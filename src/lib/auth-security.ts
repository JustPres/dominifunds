import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export const TRUSTED_DEVICE_COOKIE = "df_trusted_device";

export const LOGIN_LIMITS = {
  passwordWindowMs: 15 * 60 * 1000,
  passwordFailuresPerEmail: 5,
  passwordFailuresPerIp: 10,
  otpLength: 6,
  otpExpiresMs: 10 * 60 * 1000,
  otpMaxAttempts: 5,
  otpResendWindowMs: 60 * 1000,
  verificationTokenExpiresMs: 5 * 60 * 1000,
  trustedDeviceTtlMs: 30 * 24 * 60 * 60 * 1000,
  suspiciousWindowMs: 24 * 60 * 60 * 1000,
  suspiciousFailureThreshold: 3,
} as const;

export interface DeviceContext {
  ipAddress: string | null;
  userAgent: string | null;
  platform: string | null;
  language: string | null;
  fingerprintHash: string;
  deviceLabel: string;
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export function generateOtpCode(length = LOGIN_LIMITS.otpLength) {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join("");
}

export function timingSafeEqualHash(input: string, expectedHash: string | null | undefined) {
  if (!expectedHash) return false;

  const inputHash = hashValue(input);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(expectedHash));
}

export function maskEmail(email: string) {
  const [localPart, domain = ""] = email.split("@");

  if (!localPart) return email;

  const visibleStart = localPart.slice(0, 2);
  const maskedLocal = `${visibleStart}${"*".repeat(Math.max(localPart.length - 2, 2))}`;

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

export function getDeviceContext(request: NextRequest): DeviceContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const language = request.headers.get("accept-language")?.split(",")[0] ?? null;
  const platform = request.headers.get("sec-ch-ua-platform")?.replace(/"/g, "") ?? null;
  const fingerprintSource = [userAgent ?? "", platform ?? "", language ?? ""].join("|");
  const fingerprintHash = hashValue(fingerprintSource);

  return {
    ipAddress: ipAddress ?? null,
    userAgent,
    platform,
    language,
    fingerprintHash,
    deviceLabel: buildDeviceLabel(platform, userAgent),
  };
}

export function getTrustedDeviceToken(request: NextRequest) {
  return request.cookies.get(TRUSTED_DEVICE_COOKIE)?.value ?? null;
}

export function setTrustedDeviceCookie(response: NextResponse, token: string) {
  response.cookies.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(LOGIN_LIMITS.trustedDeviceTtlMs / 1000),
    path: "/",
  });
}

export function clearTrustedDeviceCookie(response: NextResponse) {
  response.cookies.set(TRUSTED_DEVICE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function getLoginDestination(role: Role, callbackUrl?: string | null) {
  if (callbackUrl && callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  return role === "OFFICER" ? "/dashboard" : "/portal";
}

function buildDeviceLabel(platform: string | null, userAgent: string | null) {
  const agent = userAgent?.toLowerCase() ?? "";
  const browser = agent.includes("edg/")
    ? "Edge"
    : agent.includes("chrome/")
    ? "Chrome"
    : agent.includes("firefox/")
    ? "Firefox"
    : agent.includes("safari/") && !agent.includes("chrome/")
    ? "Safari"
    : "Browser";

  const platformLabel = platform || inferPlatform(agent) || "Device";
  return `${platformLabel} - ${browser}`;
}

function inferPlatform(agent: string) {
  if (agent.includes("windows")) return "Windows";
  if (agent.includes("mac os")) return "macOS";
  if (agent.includes("iphone") || agent.includes("ipad")) return "iOS";
  if (agent.includes("android")) return "Android";
  if (agent.includes("linux")) return "Linux";
  return null;
}
