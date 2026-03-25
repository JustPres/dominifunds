export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { type Role } from "@prisma/client";
import { startLoginChallenge, AuthFlowError } from "@/lib/auth-login";
import { sendLoginOtpEmail } from "@/lib/auth-mail";
import { getDeviceContext, getTrustedDeviceToken, maskEmail, setTrustedDeviceCookie } from "@/lib/auth-security";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Enter a valid email, password, and role." }, { status: 400 });
    }

    const deviceContext = getDeviceContext(request);
    const trustedDeviceToken = getTrustedDeviceToken(request);
    const result = await startLoginChallenge({
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role as Role,
      context: {
        ...deviceContext,
        trustedDeviceToken,
      },
    });

    const payload = result.otpRequired
      ? {
          mfaRequired: true,
          challengeId: result.challenge.id,
          maskedEmail: maskEmail(result.user.email),
          role: result.user.role,
          debugCode: null as string | null,
        }
      : {
          mfaRequired: false,
          verificationToken: result.verificationToken,
          role: result.user.role,
        };
    const response = NextResponse.json(payload);

    if (!result.otpRequired && trustedDeviceToken) {
      setTrustedDeviceCookie(response, trustedDeviceToken);
    }

    if (result.otpRequired && result.otpCode) {
      const mailResult = await sendLoginOtpEmail(result.user.email, result.otpCode, result.user.role);

      if (!mailResult.delivered && mailResult.debugCode) {
        return NextResponse.json({
          ...payload,
          debugCode: mailResult.debugCode,
        });
      }
    }

    return response;
  } catch (error) {
    if (error instanceof AuthFlowError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[auth][login/start]", error);
    return NextResponse.json({ message: "Unable to start sign-in." }, { status: 500 });
  }
}
