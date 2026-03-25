export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTrustedDeviceToken, hashValue } from "@/lib/auth-security";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const trustedDeviceToken = getTrustedDeviceToken(request);
  const [recentEvents, trustedDevice] = await Promise.all([
    prisma.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    trustedDeviceToken
      ? prisma.trustedDevice.findFirst({
          where: {
            userId,
            tokenHash: hashValue(trustedDeviceToken),
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    lastLoginAt: session.user.lastLoginAt,
    currentDevice: trustedDevice
      ? {
          label: trustedDevice.label || "Trusted device",
          trusted: true,
          lastSeenAt: trustedDevice.lastSeenAt.toISOString(),
          expiresAt: trustedDevice.expiresAt.toISOString(),
        }
      : {
          label: "Verification required on this device",
          trusted: false,
          lastSeenAt: null,
          expiresAt: null,
        },
    recentActivity: recentEvents.map((event) => ({
      id: event.id,
      status: event.status,
      detail: event.detail,
      deviceLabel: event.deviceLabel,
      createdAt: event.createdAt.toISOString(),
    })),
  });
}
