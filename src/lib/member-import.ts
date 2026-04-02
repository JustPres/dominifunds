import { Buffer } from "node:buffer";
import { type Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { createActivityLog } from "@/lib/activity-log";
import prisma from "@/lib/prisma";
import { normalizeYearLevel } from "@/lib/member-fields";
import { getActiveSectionWhere } from "@/lib/section-lifecycle";
import {
  getStudentEmailValidationMessage,
  isValidStudentEmail,
  normalizeStudentEmail,
} from "@/lib/student-email";

export const MEMBER_IMPORT_ALLOWED_ROLES = [
  "Member",
  "Section Representative",
  "Committee Lead",
  "Volunteer",
] as const;

export type MemberImportAllowedRole = (typeof MEMBER_IMPORT_ALLOWED_ROLES)[number];
export type MemberImportAction = "create" | "update" | "restore" | "draft" | "skip" | "error";

export interface MemberImportRowInput {
  rowNumber: number;
  name: string;
  email: string;
  role: string;
  yearLevel: string;
  sectionName: string;
}

export interface MemberImportPreviewRow extends MemberImportRowInput {
  action: MemberImportAction;
  issues: string[];
  normalizedRole: MemberImportAllowedRole;
  normalizedYearLevel: string | null;
  sectionId: string | null;
  existingMemberId: string | null;
}

export function summarizeMemberImportPreview(rows: MemberImportPreviewRow[]) {
  return rows.reduce(
    (summary, row) => {
      if (row.action === "create") summary.created += 1;
      else if (row.action === "update") summary.updated += 1;
      else if (row.action === "restore") summary.restored += 1;
      else if (row.action === "draft") summary.drafted += 1;
      else if (row.action === "skip") summary.skipped += 1;
      else summary.failed += 1;

      return summary;
    },
    {
      created: 0,
      updated: 0,
      restored: 0,
      drafted: 0,
      skipped: 0,
      failed: 0,
    }
  );
}

const HEADER_ALIASES: Record<string, keyof Omit<MemberImportRowInput, "rowNumber">> = {
  name: "name",
  "full name": "name",
  "student name": "name",
  email: "email",
  "email address": "email",
  "school email": "email",
  role: "role",
  "org role": "role",
  "organization role": "role",
  year: "yearLevel",
  "year level": "yearLevel",
  yearlevel: "yearLevel",
  section: "sectionName",
  "section name": "sectionName",
};

type ExistingMemberRecord = {
  id: string;
  email: string;
  name: string;
  orgRole: string | null;
  yearLevel: string | null;
  sectionId: string | null;
  deactivatedAt: Date | null;
};

function cleanCellValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeader(value: unknown) {
  return cleanCellValue(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeEmail(value: string) {
  return normalizeStudentEmail(value);
}

function normalizeRole(value: string): MemberImportAllowedRole | null {
  const normalized = value.trim().toLowerCase();
  const matched = MEMBER_IMPORT_ALLOWED_ROLES.find((role) => role.toLowerCase() === normalized);
  return matched ?? null;
}

export async function parseMemberImportFile(fileBuffer: ArrayBuffer | Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  const workbookSource = Buffer.from(fileBuffer instanceof ArrayBuffer ? new Uint8Array(fileBuffer) : fileBuffer);
  await workbook.xlsx.load(workbookSource as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const columnMap = new Map<number, keyof Omit<MemberImportRowInput, "rowNumber">>();

  headerRow.eachCell((cell, colNumber) => {
    const mappedKey = HEADER_ALIASES[normalizeHeader(cell.value)];

    if (mappedKey) {
      columnMap.set(colNumber, mappedKey);
    }
  });

  const rows: MemberImportRowInput[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const draft: MemberImportRowInput = {
      rowNumber,
      name: "",
      email: "",
      role: "",
      yearLevel: "",
      sectionName: "",
    };

    row.eachCell((cell, colNumber) => {
      const key = columnMap.get(colNumber);

      if (key) {
        draft[key] = cleanCellValue(cell.value);
      }
    });

    if (Object.values(draft).every((value) => value === "" || typeof value === "number")) {
      return;
    }

    rows.push(draft);
  });

  return rows;
}

export async function buildMemberImportPreview(orgId: string, rows: MemberImportRowInput[]) {
  const [sections, members] = await Promise.all([
    prisma.section.findMany({
      where: {
        orgId,
        ...getActiveSectionWhere(),
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      where: {
        orgId,
        role: "STUDENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        orgRole: true,
        yearLevel: true,
        sectionId: true,
        deactivatedAt: true,
      },
    }),
  ]);

  const sectionsByName = new Map(sections.map((section) => [section.name.trim().toLowerCase(), section]));
  const membersByEmail = new Map<string, ExistingMemberRecord>(
    members.map((member) => [
      member.email.trim().toLowerCase(),
      {
        id: member.id,
        email: member.email,
        name: member.name,
        orgRole: member.orgRole,
        yearLevel: member.yearLevel,
        sectionId: member.sectionId,
        deactivatedAt: member.deactivatedAt,
      },
    ])
  );

  return rows.map((row) => classifyMemberImportRow(row, sectionsByName, membersByEmail));
}

function classifyMemberImportRow(
  row: MemberImportRowInput,
  sectionsByName: Map<string, { id: string; name: string }>,
  membersByEmail: Map<string, ExistingMemberRecord>
): MemberImportPreviewRow {
  const issues: string[] = [];
  const email = normalizeEmail(row.email);
  const normalizedRole = normalizeRole(row.role) ?? "Member";
  const normalizedYearLevel = normalizeYearLevel(row.yearLevel);
  const section = row.sectionName ? sectionsByName.get(row.sectionName.trim().toLowerCase()) ?? null : null;
  const existingMember = email ? membersByEmail.get(email) ?? null : null;

  if (!row.name.trim()) {
    issues.push("Missing student name.");
  }

  if (email) {
    const emailValidationMessage = getStudentEmailValidationMessage(email);

    if (emailValidationMessage) {
      issues.push(emailValidationMessage);
    }
  }

  if (row.yearLevel && !normalizedYearLevel) {
    issues.push("Year level is not recognized.");
  }

  if (row.role && !normalizeRole(row.role)) {
    issues.push("Role is not recognized.");
  }

  if (row.sectionName && !section) {
    issues.push("Section does not exist yet.");
  }

  let action: MemberImportAction = "create";

  if (issues.some((issue) => issue.includes("Missing student name"))) {
    action = "error";
  } else if (!email) {
    issues.push("Missing email address.");
    action = "draft";
  } else if (issues.length > 0) {
    action = "draft";
  } else if (existingMember?.deactivatedAt) {
    action = "restore";
  } else if (existingMember) {
    action = "update";
  }

  return {
    ...row,
    email,
    action,
    issues,
    normalizedRole,
    normalizedYearLevel,
    sectionId: section?.id ?? null,
    existingMemberId: existingMember?.id ?? null,
  };
}

function getDraftStatus(email: string, issues: string[]) {
  return email && isValidStudentEmail(email) && issues.length === 0 ? "READY" : "INCOMPLETE";
}

export async function commitMemberImport(
  orgId: string,
  rows: MemberImportRowInput[],
  actorUserId: string,
  sourceFileName?: string | null
) {
  const previewRows = await buildMemberImportPreview(orgId, rows);
  const passwordHash = await bcrypt.hash("password123", 10);
  const summary = {
    created: 0,
    updated: 0,
    restored: 0,
    drafted: 0,
    skipped: 0,
    failed: 0,
  };

  for (const row of previewRows) {
    if (row.action === "error") {
      summary.failed += 1;
      continue;
    }

    if (row.action === "draft") {
      const draft = await prisma.memberImportDraft.create({
        data: {
          orgId,
          name: row.name.trim(),
          email: row.email || null,
          orgRole: row.normalizedRole,
          yearLevel: row.normalizedYearLevel,
          sectionId: row.sectionId,
          sourceFileName: sourceFileName ?? null,
          status: getDraftStatus(row.email, row.issues),
          issueSummary: row.issues.join(" "),
          rawData: {
            rowNumber: row.rowNumber,
            name: row.name,
            email: row.email,
            role: row.role,
            yearLevel: row.yearLevel,
            sectionName: row.sectionName,
            action: row.action,
            issues: row.issues,
            normalizedRole: row.normalizedRole,
            normalizedYearLevel: row.normalizedYearLevel,
            sectionId: row.sectionId,
            existingMemberId: row.existingMemberId,
          } satisfies Prisma.InputJsonObject,
          createdByUserId: actorUserId,
        },
      });

      await createActivityLog({
        orgId,
        actorUserId,
        entityType: "MEMBER_IMPORT_DRAFT",
        entityId: draft.id,
        action: "CREATE",
        note: "Import draft created from spreadsheet review.",
        afterSnapshot: {
          id: draft.id,
          name: draft.name,
          email: draft.email,
          role: draft.orgRole,
          yearLevel: draft.yearLevel,
          sectionId: draft.sectionId,
          status: draft.status,
          sourceFileName: draft.sourceFileName,
        },
      });
      summary.drafted += 1;
      continue;
    }

    if (row.action === "update" && row.existingMemberId) {
      const existingMember = await prisma.user.findUnique({
        where: { id: row.existingMemberId },
        select: {
          id: true,
          name: true,
          email: true,
          orgRole: true,
          yearLevel: true,
          sectionId: true,
          deactivatedAt: true,
        },
      });

      const updatedMember = await prisma.user.update({
        where: { id: row.existingMemberId },
        data: {
          name: row.name.trim(),
          orgRole: row.normalizedRole,
          yearLevel: row.normalizedYearLevel,
          sectionId: row.sectionId,
        },
      });

      await createActivityLog({
        orgId,
        actorUserId,
        entityType: "MEMBER",
        entityId: updatedMember.id,
        action: "UPDATE",
        note: "Member updated from spreadsheet import.",
        beforeSnapshot: existingMember
          ? {
              id: existingMember.id,
              name: existingMember.name,
              email: existingMember.email,
              role: existingMember.orgRole,
              yearLevel: existingMember.yearLevel,
              sectionId: existingMember.sectionId,
              deactivatedAt: existingMember.deactivatedAt?.toISOString() ?? null,
            }
          : null,
        afterSnapshot: {
          id: updatedMember.id,
          name: updatedMember.name,
          email: updatedMember.email,
          role: updatedMember.orgRole,
          yearLevel: updatedMember.yearLevel,
          sectionId: updatedMember.sectionId,
          deactivatedAt: updatedMember.deactivatedAt?.toISOString() ?? null,
        },
      });
      summary.updated += 1;
      continue;
    }

    if (row.action === "restore" && row.existingMemberId) {
      const existingMember = await prisma.user.findUnique({
        where: { id: row.existingMemberId },
        select: {
          id: true,
          name: true,
          email: true,
          orgRole: true,
          yearLevel: true,
          sectionId: true,
          deactivatedAt: true,
        },
      });

      const restoredMember = await prisma.user.update({
        where: { id: row.existingMemberId },
        data: {
          name: row.name.trim(),
          orgRole: row.normalizedRole,
          yearLevel: row.normalizedYearLevel,
          sectionId: row.sectionId,
          deactivatedAt: null,
          deactivationReason: null,
        },
      });

      await createActivityLog({
        orgId,
        actorUserId,
        entityType: "MEMBER",
        entityId: restoredMember.id,
        action: "RESTORE",
        note: "Archived member restored from spreadsheet import.",
        beforeSnapshot: existingMember
          ? {
              id: existingMember.id,
              name: existingMember.name,
              email: existingMember.email,
              role: existingMember.orgRole,
              yearLevel: existingMember.yearLevel,
              sectionId: existingMember.sectionId,
              deactivatedAt: existingMember.deactivatedAt?.toISOString() ?? null,
            }
          : null,
        afterSnapshot: {
          id: restoredMember.id,
          name: restoredMember.name,
          email: restoredMember.email,
          role: restoredMember.orgRole,
          yearLevel: restoredMember.yearLevel,
          sectionId: restoredMember.sectionId,
          deactivatedAt: restoredMember.deactivatedAt?.toISOString() ?? null,
        },
      });
      summary.restored += 1;
      continue;
    }

    if (row.action === "create") {
      const createdMember = await prisma.user.create({
        data: {
          name: row.name.trim(),
          email: normalizeStudentEmail(row.email),
          password: passwordHash,
          role: "STUDENT",
          orgId,
          orgRole: row.normalizedRole,
          yearLevel: row.normalizedYearLevel,
          sectionId: row.sectionId,
          mustChangePassword: true,
        },
      });

      await createActivityLog({
        orgId,
        actorUserId,
        entityType: "MEMBER",
        entityId: createdMember.id,
        action: "CREATE",
        note: "Member created from spreadsheet import.",
        afterSnapshot: {
          id: createdMember.id,
          name: createdMember.name,
          email: createdMember.email,
          role: createdMember.orgRole,
          yearLevel: createdMember.yearLevel,
          sectionId: createdMember.sectionId,
          deactivatedAt: createdMember.deactivatedAt?.toISOString() ?? null,
        },
      });
      summary.created += 1;
      continue;
    }

    summary.skipped += 1;
  }

  return {
    rows: previewRows,
    summary,
  };
}
