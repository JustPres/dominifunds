export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthFlowError, rememberTrustedDevice, verifyOtpChallenge } from "@/lib/auth-login";
import { sendSuspiciousLoginAlertEmail } from "@/lib/auth-mail";
import { clearTrustedDeviceCookie, generateOpaqueToken, getDeviceContext, setTrustedDeviceCookie } from "@/lib/auth-security";
import { otpVerificationSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  let challengeId = "";

  try {
    const body = await request.json();
    const parsed = otpVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Enter the 6-digit verification code." }, { status: 400 });
    }

    challengeId = parsed.data.challengeId;
    const deviceContext = getDeviceContext(request);
    const { challenge, verificationToken } = await verifyOtpChallenge(parsed.data.challengeId, parsed.data.code);
    const response = NextResponse.json({
      verificationToken,
      role: challenge.user.role,
    });

    if (challenge.user.role === "STUDENT") {
      const trustedDeviceToken = generateOpaqueToken();
      await rememberTrustedDevice({
        userId: challenge.user.id,
        deviceToken: trustedDeviceToken,
        context: deviceContext,
      });
      setTrustedDeviceCookie(response, trustedDeviceToken);
    } else {
      clearTrustedDeviceCookie(response);
    }

    if (
      challenge.user.role === "STUDENT" ||
      challenge.suspiciousReason?.toLowerCase().includes("new officer device")
    ) {
      await sendSuspiciousLoginAlertEmail(
        challenge.user.email,
        `A login was completed from ${challenge.deviceLabel ?? "a new device"}.`
      );
    }

    return response;
  } catch (error) {
    if (error instanceof AuthFlowError) {
      if (error.status === 401 && challengeId) {
        const challenge = await prisma.loginVerificationChallenge.findUnique({
          where: { id: challengeId },
          include: { user: true },
        }).catch(() => null);

        if (challenge?.user?.email) {
          await sendSuspiciousLoginAlertEmail(
            challenge.user.email,
            `A verification code was entered incorrectly for ${challenge.deviceLabel ?? "your account"}`
          );
        }
      }

      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[auth][login/verify-email-otp]", error);
    return NextResponse.json({ message: "Unable to verify the code." }, { status: 500 });
  }
}
