export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createActivityLog } from "@/lib/activity-log";
import prisma from "@/lib/prisma";

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.flatten().fieldErrors.newPassword?.[0] ?? "Invalid password." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deactivatedAt: null,
    },
    select: {
      id: true,
      password: true,
      orgId: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Account is inactive." }, { status: 401 });
  }

  const isSamePassword = await bcrypt.compare(parsed.data.newPassword, user.password);

  if (isSamePassword) {
    return NextResponse.json(
      { message: "Choose a different password from the temporary one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      mustChangePassword: false,
    },
  });

  if (user.orgId) {
    await createActivityLog({
      orgId: user.orgId,
      actorUserId: user.id,
      actorOfficerRole: session.user.officerAccessRole ?? null,
      entityType: "USER_ACCOUNT",
      entityId: user.id,
      action: "UPDATE",
      note: user.mustChangePassword ? "Initial password changed." : "Password changed.",
      beforeSnapshot: {
        mustChangePassword: user.mustChangePassword,
      },
      afterSnapshot: {
        mustChangePassword: false,
      },
    });
  }

  return NextResponse.json({ success: true, mustChangePassword: false });
}
