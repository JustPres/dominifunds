export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getAuthorizedOfficerSession } from "@/lib/organization-auth";
import { inferOfficerAccessRole } from "@/lib/officer-access";
import prisma from "@/lib/prisma";

function normalizeOfficerAccessRole(value?: string | null) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "TREASURER") return "TREASURER" as const;
  if (normalized === "PRESIDENT") return "PRESIDENT" as const;

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const authorization = await getAuthorizedOfficerSession(params.orgId, { requireManager: true });

  if (!authorization.ok) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();
  const officerAccessRole = normalizeOfficerAccessRole(body.officerAccessRole);
  const orgRole = officerAccessRole === "PRESIDENT" ? "President" : "Treasurer";
  const note = String(body.note ?? "").trim();

  if (!name || !email || !password || !officerAccessRole) {
    return NextResponse.json(
      { message: "Name, email, password, and officer access role are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      orgId: true,
      role: true,
      deactivatedAt: true,
    },
  });

  if (existing && !existing.deactivatedAt) {
    return NextResponse.json({ message: "An active account already uses that email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const officer =
    existing && existing.orgId === params.orgId && existing.role === "OFFICER"
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            password: passwordHash,
            orgRole,
            officerAccessRole,
            deactivatedAt: null,
            deactivationReason: null,
          },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            password: passwordHash,
            role: "OFFICER",
            orgId: params.orgId,
            orgRole,
            officerAccessRole,
          },
        });

  await createActivityLog({
    orgId: params.orgId,
    actorUserId: authorization.session.user.id,
    entityType: "USER_ACCOUNT",
    entityId: officer.id,
    action: existing ? "RESTORE" : "CREATE",
    note: note || (existing ? "Officer account reactivated." : "Officer account created."),
    afterSnapshot: {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      role: officer.role,
      orgRole: officer.orgRole,
      officerAccessRole: inferOfficerAccessRole(officer.officerAccessRole, officer.orgRole),
      deactivatedAt: officer.deactivatedAt?.toISOString() ?? null,
    },
  });

  return NextResponse.json(
    {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      orgRole: officer.orgRole,
      officerAccessRole: officer.officerAccessRole,
      deactivatedAt: officer.deactivatedAt?.toISOString() ?? null,
    },
    { status: existing ? 200 : 201 }
  );
}
