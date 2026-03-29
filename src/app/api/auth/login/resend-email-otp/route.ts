export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { resendOtpChallenge, AuthFlowError } from "@/lib/auth-login";
import { sendLoginOtpEmail } from "@/lib/auth-mail";
import { otpResendSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpResendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Missing verification session." }, { status: 400 });
    }

    const { challenge, otpCode } = await resendOtpChallenge(parsed.data.challengeId);
    const mailResult = await sendLoginOtpEmail(challenge.user.email, otpCode, challenge.user.role);

    if (!mailResult.delivered && !mailResult.debugCode) {
      console.error("[auth][login/resend-email-otp] Verification email failed", {
        email: challenge.user.email,
        error: mailResult.errorMessage ?? "Unknown email provider error",
      });
      return NextResponse.json({ message: "Unable to resend the verification email." }, { status: 500 });
    }

    return NextResponse.json({
      resent: true,
      debugCode: !mailResult.delivered && mailResult.debugCode ? mailResult.debugCode : null,
    });
  } catch (error) {
    if (error instanceof AuthFlowError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[auth][login/resend-email-otp]", error);
    return NextResponse.json({ message: "Unable to resend the code." }, { status: 500 });
  }
}
