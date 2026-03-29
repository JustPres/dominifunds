import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL;

interface MailResult {
  delivered: boolean;
  debugCode?: string;
  errorMessage?: string;
}

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  debugCode?: string;
}): Promise<MailResult> {
  if (!resend || !fromEmail) {
    console.info(`[auth-mail] Skipping email send for ${options.to}: ${options.subject}`);

    if (options.debugCode && process.env.NODE_ENV !== "production") {
      console.info(`[auth-mail] Debug code for ${options.to}: ${options.debugCode}`);
      return { delivered: false, debugCode: options.debugCode };
    }

    return { delivered: false };
  }

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    console.error("[auth-mail] Resend send failed", {
      to: options.to,
      subject: options.subject,
      name: error.name,
      message: error.message,
    });

    return {
      delivered: false,
      errorMessage: error.message,
    };
  }

  return {
    delivered: true,
    errorMessage: data?.id ? undefined : "Email provider did not return a message id.",
  };
}

export async function sendLoginOtpEmail(email: string, code: string, role: "OFFICER" | "STUDENT") {
  return sendEmail({
    to: email,
    subject: `Your DominiFunds verification code`,
    debugCode: code,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f1a1a">
        <h1 style="margin:0 0 12px;font-size:24px;color:#8f1c20">DominiFunds verification</h1>
        <p style="margin:0 0 16px;line-height:1.6">
          Use the code below to finish signing in to your ${role === "OFFICER" ? "officer" : "student"} account.
        </p>
        <div style="margin:24px 0;padding:18px 22px;border-radius:16px;background:#fff4ef;border:1px solid #f1d6cc;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center;color:#8f1c20">
          ${code}
        </div>
        <p style="margin:0;line-height:1.6;color:#5f4e4b">
          This code expires in 10 minutes. If you did not try to sign in, please ignore this email and update your password.
        </p>
      </div>
    `,
    text: `Your DominiFunds verification code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendSuspiciousLoginAlertEmail(email: string, detail: string) {
  return sendEmail({
    to: email,
    subject: "DominiFunds security alert",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f1a1a">
        <h1 style="margin:0 0 12px;font-size:24px;color:#8f1c20">Security alert</h1>
        <p style="margin:0 0 12px;line-height:1.6">
          We noticed a sign-in event that may need your attention.
        </p>
        <div style="margin:20px 0;padding:16px;border-radius:14px;background:#fff7f5;border:1px solid #f1d6cc;color:#5f4e4b">
          ${detail}
        </div>
        <p style="margin:0;line-height:1.6;color:#5f4e4b">
          If this was not you, change your password and contact your organization officer immediately.
        </p>
      </div>
    `,
    text: `DominiFunds security alert: ${detail}`,
  });
}
