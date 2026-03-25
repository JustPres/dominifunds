import bcrypt from "bcryptjs";
import {
  LoginChallengeStatus,
  LoginEventStatus,
  type LoginVerificationChallenge,
  type Role,
  type TrustedDevice,
  type User,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  LOGIN_LIMITS,
  generateOpaqueToken,
  generateOtpCode,
  hashValue,
  timingSafeEqualHash,
  type DeviceContext,
} from "@/lib/auth-security";

export interface LoginRequestContext extends DeviceContext {
  trustedDeviceToken: string | null;
}

export interface StartLoginResult {
  user: User;
  otpRequired: boolean;
  suspiciousReason: string | null;
  challenge: LoginVerificationChallenge;
  otpCode?: string;
  verificationToken?: string;
  trustedDevice?: TrustedDevice | null;
}

export class AuthFlowError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuthFlowError";
    this.status = status;
  }
}

export async function startLoginChallenge(input: {
  email: string;
  password: string;
  role: Role;
  context: LoginRequestContext;
}) {
  await enforcePasswordRateLimit(input.email, input.context.ipAddress);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || user.role !== input.role) {
    await recordLoginEvent({
      email: input.email,
      role: input.role,
      status: LoginEventStatus.PASSWORD_FAILED,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      platform: input.context.platform,
      detail: "Invalid credentials or role mismatch.",
    });
    throw new AuthFlowError("Invalid email or password.", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    await recordLoginEvent({
      userId: user.id,
      email: input.email,
      role: input.role,
      status: LoginEventStatus.PASSWORD_FAILED,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      platform: input.context.platform,
      detail: "Invalid password.",
    });
    throw new AuthFlowError("Invalid email or password.", 401);
  }

  await expireOutstandingChallenges(user.id);

  const trustedDevice = await getTrustedDevice(user.id, input.context.trustedDeviceToken);
  const suspiciousReason = await getSuspiciousReason(user, input.context, trustedDevice);
  const otpRequired = user.role === "OFFICER" || suspiciousReason !== null;
  const baseChallengeData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    otpRequired,
    fingerprintHash: input.context.fingerprintHash,
    deviceLabel: input.context.deviceLabel,
    userAgent: input.context.userAgent,
    platform: input.context.platform,
    language: input.context.language,
    ipAddress: input.context.ipAddress,
    suspiciousReason,
    lastSentAt: new Date(),
    passwordVerifiedAt: new Date(),
  };

  if (!otpRequired) {
    const verificationToken = generateOpaqueToken();
    const challenge = await prisma.loginVerificationChallenge.create({
      data: {
        ...baseChallengeData,
        otpRequired: false,
        status: LoginChallengeStatus.VERIFIED,
        verifiedAt: new Date(),
        verificationTokenHash: hashValue(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + LOGIN_LIMITS.verificationTokenExpiresMs),
      },
    });

    if (trustedDevice) {
      await prisma.trustedDevice.update({
        where: { id: trustedDevice.id },
        data: {
          lastSeenAt: new Date(),
          ipAddress: input.context.ipAddress,
          userAgent: input.context.userAgent,
          platform: input.context.platform,
          language: input.context.language,
          label: input.context.deviceLabel,
          fingerprintHash: input.context.fingerprintHash,
          expiresAt: new Date(Date.now() + LOGIN_LIMITS.trustedDeviceTtlMs),
        },
      });
    }

    return {
      user,
      otpRequired: false,
      suspiciousReason,
      challenge,
      verificationToken,
      trustedDevice,
    } satisfies StartLoginResult;
  }

  const otpCode = generateOtpCode();
  const challenge = await prisma.loginVerificationChallenge.create({
    data: {
      ...baseChallengeData,
      status: LoginChallengeStatus.PENDING,
      codeHash: hashValue(otpCode),
      codeExpiresAt: new Date(Date.now() + LOGIN_LIMITS.otpExpiresMs),
    },
  });

  await recordLoginEvent({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: LoginEventStatus.OTP_SENT,
    mfaRequired: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    platform: input.context.platform,
    deviceLabel: input.context.deviceLabel,
    detail: suspiciousReason ?? "Verification required.",
  });

  return {
    user,
    otpRequired: true,
    suspiciousReason,
    challenge,
    otpCode,
    trustedDevice,
  } satisfies StartLoginResult;
}

export async function verifyOtpChallenge(challengeId: string, code: string) {
  const challenge = await prisma.loginVerificationChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });

  if (!challenge || challenge.status !== LoginChallengeStatus.PENDING) {
    throw new AuthFlowError("Verification session has expired. Please try again.", 400);
  }

  if (!challenge.codeExpiresAt || challenge.codeExpiresAt.getTime() < Date.now()) {
    await prisma.loginVerificationChallenge.update({
      where: { id: challenge.id },
      data: { status: LoginChallengeStatus.EXPIRED },
    });
    throw new AuthFlowError("Verification code expired. Please request a new code.", 400);
  }

  if (!timingSafeEqualHash(code, challenge.codeHash)) {
    const failedAttempts = challenge.failedAttempts + 1;
    const nextStatus =
      failedAttempts >= LOGIN_LIMITS.otpMaxAttempts ? LoginChallengeStatus.FAILED : LoginChallengeStatus.PENDING;

    await prisma.loginVerificationChallenge.update({
      where: { id: challenge.id },
      data: {
        failedAttempts,
        status: nextStatus,
      },
    });

    await recordLoginEvent({
      userId: challenge.userId,
      email: challenge.email,
      role: challenge.role,
      status: LoginEventStatus.OTP_FAILED,
      mfaRequired: true,
      ipAddress: challenge.ipAddress,
      userAgent: challenge.userAgent,
      platform: challenge.platform,
      deviceLabel: challenge.deviceLabel,
      detail: failedAttempts >= LOGIN_LIMITS.otpMaxAttempts ? "Too many invalid OTP attempts." : "Invalid OTP code.",
    });

    throw new AuthFlowError(
      failedAttempts >= LOGIN_LIMITS.otpMaxAttempts
        ? "Too many invalid codes. Start over and request a new code."
        : "Invalid verification code.",
      401
    );
  }

  const verificationToken = generateOpaqueToken();
  const updatedChallenge = await prisma.loginVerificationChallenge.update({
    where: { id: challenge.id },
    data: {
      status: LoginChallengeStatus.VERIFIED,
      verifiedAt: new Date(),
      verificationTokenHash: hashValue(verificationToken),
      verificationTokenExpiresAt: new Date(Date.now() + LOGIN_LIMITS.verificationTokenExpiresMs),
    },
    include: { user: true },
  });

  return {
    challenge: updatedChallenge,
    verificationToken,
  };
}

export async function resendOtpChallenge(challengeId: string) {
  const challenge = await prisma.loginVerificationChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });

  if (!challenge || challenge.status !== LoginChallengeStatus.PENDING) {
    throw new AuthFlowError("Verification session has expired. Please sign in again.", 400);
  }

  if (challenge.lastSentAt.getTime() + LOGIN_LIMITS.otpResendWindowMs > Date.now()) {
    throw new AuthFlowError("Please wait before requesting another code.", 429);
  }

  const otpCode = generateOtpCode();
  const updatedChallenge = await prisma.loginVerificationChallenge.update({
    where: { id: challenge.id },
    data: {
      codeHash: hashValue(otpCode),
      codeExpiresAt: new Date(Date.now() + LOGIN_LIMITS.otpExpiresMs),
      lastSentAt: new Date(),
      failedAttempts: 0,
    },
    include: { user: true },
  });

  await recordLoginEvent({
    userId: updatedChallenge.userId,
    email: updatedChallenge.email,
    role: updatedChallenge.role,
    status: LoginEventStatus.OTP_SENT,
    mfaRequired: true,
    ipAddress: updatedChallenge.ipAddress,
    userAgent: updatedChallenge.userAgent,
    platform: updatedChallenge.platform,
    deviceLabel: updatedChallenge.deviceLabel,
    detail: "Verification code resent.",
  });

  return { challenge: updatedChallenge, otpCode };
}

export async function consumeVerifiedLoginToken(email: string, role: Role, verificationToken: string) {
  const challenge = await prisma.loginVerificationChallenge.findFirst({
    where: {
      email,
      role,
      status: LoginChallengeStatus.VERIFIED,
      verificationTokenHash: hashValue(verificationToken),
      verificationTokenExpiresAt: { gt: new Date() },
    },
    include: { user: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!challenge || !challenge.user) {
    throw new Error("Verification expired.");
  }

  await prisma.$transaction([
    prisma.loginVerificationChallenge.update({
      where: { id: challenge.id },
      data: {
        status: LoginChallengeStatus.CONSUMED,
        consumedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: challenge.user.id },
      data: {
        lastLoginAt: new Date(),
      },
    }),
    prisma.loginEvent.create({
      data: {
        userId: challenge.user.id,
        email: challenge.email,
        role: challenge.role,
        status: LoginEventStatus.SUCCEEDED,
        mfaRequired: challenge.otpRequired,
        deviceLabel: challenge.deviceLabel,
        ipAddress: challenge.ipAddress,
        userAgent: challenge.userAgent,
        platform: challenge.platform,
        detail: challenge.suspiciousReason ?? "Login completed.",
      },
    }),
  ]);

  return challenge.user;
}

async function enforcePasswordRateLimit(email: string, ipAddress: string | null) {
  const since = new Date(Date.now() - LOGIN_LIMITS.passwordWindowMs);
  const [emailFailures, ipFailures] = await Promise.all([
    prisma.loginEvent.count({
      where: {
        email,
        status: LoginEventStatus.PASSWORD_FAILED,
        createdAt: { gte: since },
      },
    }),
    ipAddress
      ? prisma.loginEvent.count({
          where: {
            ipAddress,
            status: LoginEventStatus.PASSWORD_FAILED,
            createdAt: { gte: since },
          },
        })
      : Promise.resolve(0),
  ]);

  if (
    emailFailures >= LOGIN_LIMITS.passwordFailuresPerEmail ||
    ipFailures >= LOGIN_LIMITS.passwordFailuresPerIp
  ) {
    throw new AuthFlowError("Too many sign-in attempts. Please wait and try again.", 429);
  }
}

async function getTrustedDevice(userId: string, trustedDeviceToken: string | null) {
  if (!trustedDeviceToken) return null;

  return prisma.trustedDevice.findFirst({
    where: {
      userId,
      tokenHash: hashValue(trustedDeviceToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

async function getSuspiciousReason(user: User, context: LoginRequestContext, trustedDevice: TrustedDevice | null) {
  if (user.role === "OFFICER") {
    return trustedDevice ? "Officer login still requires verification." : "New officer device requires verification.";
  }

  if (!trustedDevice) {
    return "New student device requires verification.";
  }

  if (trustedDevice.fingerprintHash && trustedDevice.fingerprintHash !== context.fingerprintHash) {
    return "Student device fingerprint changed.";
  }

  const recentFailedOtps = await prisma.loginEvent.count({
    where: {
      userId: user.id,
      status: LoginEventStatus.OTP_FAILED,
      createdAt: { gte: new Date(Date.now() - LOGIN_LIMITS.suspiciousWindowMs) },
    },
  });

  if (recentFailedOtps >= LOGIN_LIMITS.suspiciousFailureThreshold) {
    return "Recent verification failures require a fresh check.";
  }

  return null;
}

async function expireOutstandingChallenges(userId: string) {
  await prisma.loginVerificationChallenge.updateMany({
    where: {
      userId,
      status: {
        in: [LoginChallengeStatus.PENDING, LoginChallengeStatus.VERIFIED],
      },
    },
    data: {
      status: LoginChallengeStatus.EXPIRED,
    },
  });
}

export async function rememberTrustedDevice(input: {
  userId: string;
  deviceToken: string;
  context: DeviceContext;
}) {
  const tokenHash = hashValue(input.deviceToken);
  const existing = await prisma.trustedDevice.findFirst({
    where: {
      userId: input.userId,
      fingerprintHash: input.context.fingerprintHash,
      revokedAt: null,
    },
  });

  if (existing) {
    return prisma.trustedDevice.update({
      where: { id: existing.id },
      data: {
        tokenHash,
        fingerprintHash: input.context.fingerprintHash,
        label: input.context.deviceLabel,
        userAgent: input.context.userAgent,
        platform: input.context.platform,
        language: input.context.language,
        ipAddress: input.context.ipAddress,
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + LOGIN_LIMITS.trustedDeviceTtlMs),
        revokedAt: null,
      },
    });
  }

  return prisma.trustedDevice.create({
    data: {
      userId: input.userId,
      tokenHash,
      fingerprintHash: input.context.fingerprintHash,
      label: input.context.deviceLabel,
      userAgent: input.context.userAgent,
      platform: input.context.platform,
      language: input.context.language,
      ipAddress: input.context.ipAddress,
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + LOGIN_LIMITS.trustedDeviceTtlMs),
    },
  });
}

export async function recordLoginEvent(input: {
  userId?: string;
  email: string;
  role?: Role;
  status: LoginEventStatus;
  mfaRequired?: boolean;
  deviceLabel?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  platform?: string | null;
  detail?: string | null;
}) {
  return prisma.loginEvent.create({
    data: {
      userId: input.userId ?? null,
      email: input.email,
      role: input.role ?? null,
      status: input.status,
      mfaRequired: input.mfaRequired ?? false,
      deviceLabel: input.deviceLabel ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      platform: input.platform ?? null,
      detail: input.detail ?? null,
    },
  });
}
