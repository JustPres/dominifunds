import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedThemePreset = "CRIMSON" | "EMERALD" | "COBALT" | "AMBER";

type OrgBootstrapConfig = {
  orgId: string;
  displayName: string;
  themePreset: SeedThemePreset;
  defaultSectionName: string;
  activePeriod: {
    name: string;
    startDate: string;
    endDate: string;
  };
  defaultSchedule?: {
    name: string;
    weekdays: number[];
    note?: string;
  };
  demoOfficer?: {
    name: string;
    email: string;
    orgRole: string;
    officerAccessRole: "TREASURER" | "PRESIDENT";
  };
  demoStudent?: {
    name: string;
    email: string;
    yearLevel: string;
  };
};

const ORG_BOOTSTRAP_CONFIGS: OrgBootstrapConfig[] = [
  {
    orgId: "BSIT",
    displayName: "Dominixode",
    themePreset: "CRIMSON",
    defaultSectionName: "BSIT 3A",
    activePeriod: {
      name: "Second Semester 2026",
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-06-30T23:59:59.999Z",
    },
    defaultSchedule: {
      name: "Default Mon/Thu Collection",
      weekdays: [1, 4],
      note: "Default weekly collection run for Dominixode.",
    },
    demoOfficer: {
      name: "Justine Lopez",
      email: "justine.lopez@sdca.edu.ph",
      orgRole: "Treasurer",
      officerAccessRole: "TREASURER",
    },
    demoStudent: {
      name: "Juan Dela Cruz",
      email: "student.bsit@sdca.edu.ph",
      yearLevel: "3rd Year",
    },
  },
  {
    orgId: "COMBACHEROS",
    displayName: "Combacheros",
    themePreset: "CRIMSON",
    defaultSectionName: "Combacheros Core",
    activePeriod: {
      name: "Second Semester 2026",
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-06-30T23:59:59.999Z",
    },
    defaultSchedule: {
      name: "Default Saturday Collection",
      weekdays: [6],
      note: "Default weekly collection run for Combacheros.",
    },
  },
];

function getActiveScheduleWhere() {
  return {
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
  };
}

async function upsertOrganizationSettings(config: OrgBootstrapConfig) {
  await prisma.organizationSettings.upsert({
    where: { orgId: config.orgId },
    update: {
      displayName: config.displayName,
      themePreset: config.themePreset,
    },
    create: {
      orgId: config.orgId,
      displayName: config.displayName,
      themePreset: config.themePreset,
    },
  });
}

async function upsertDefaultSection(config: OrgBootstrapConfig) {
  const existingSection = await prisma.section.findFirst({
    where: {
      orgId: config.orgId,
      name: config.defaultSectionName,
    },
  });

  if (existingSection) {
    return prisma.section.update({
      where: { id: existingSection.id },
      data: { deletedAt: null },
    });
  }

  return prisma.section.create({
    data: {
      orgId: config.orgId,
      name: config.defaultSectionName,
    },
  });
}

async function ensureActiveCollectionPeriod(config: OrgBootstrapConfig) {
  const existingPeriods = await prisma.collectionPeriod.findMany({
    where: { orgId: config.orgId },
    orderBy: { createdAt: "asc" },
  });

  const activePeriod = existingPeriods.find((period) => period.isActive);

  if (activePeriod) {
    return activePeriod;
  }

  return prisma.collectionPeriod.create({
    data: {
      orgId: config.orgId,
      name: config.activePeriod.name,
      startDate: new Date(config.activePeriod.startDate),
      endDate: new Date(config.activePeriod.endDate),
      isActive: true,
    },
  });
}

async function ensureDefaultCollectionSchedule(config: OrgBootstrapConfig, collectionPeriodId: string) {
  if (!config.defaultSchedule) {
    return;
  }

  const existingSchedule = await prisma.collectionSchedule.findFirst({
    where: {
      orgId: config.orgId,
      collectionPeriodId,
      scope: "ORG_DEFAULT",
      ...getActiveScheduleWhere(),
    },
  });

  if (existingSchedule) {
    return;
  }

  await prisma.collectionSchedule.create({
    data: {
      orgId: config.orgId,
      collectionPeriodId,
      scope: "ORG_DEFAULT",
      name: config.defaultSchedule.name,
      weekdays: config.defaultSchedule.weekdays,
      note: config.defaultSchedule.note,
    },
  });
}

async function ensureDemoAccounts(
  config: OrgBootstrapConfig,
  defaultSectionId: string,
  officerPasswordHash: string,
  studentPasswordHash: string
) {
  if (config.demoOfficer) {
    await prisma.user.upsert({
      where: { email: config.demoOfficer.email },
      update: {
        name: config.demoOfficer.name,
        password: officerPasswordHash,
        role: "OFFICER",
        orgId: config.orgId,
        orgRole: config.demoOfficer.orgRole,
        officerAccessRole: config.demoOfficer.officerAccessRole,
        yearLevel: null,
        sectionId: null,
        deactivatedAt: null,
      },
      create: {
        name: config.demoOfficer.name,
        email: config.demoOfficer.email,
        password: officerPasswordHash,
        role: "OFFICER",
        orgId: config.orgId,
        orgRole: config.demoOfficer.orgRole,
        officerAccessRole: config.demoOfficer.officerAccessRole,
        yearLevel: null,
      },
    });
  }

  if (config.demoStudent) {
    await prisma.user.upsert({
      where: { email: config.demoStudent.email },
      update: {
        name: config.demoStudent.name,
        password: studentPasswordHash,
        role: "STUDENT",
        orgId: config.orgId,
        orgRole: "Member",
        yearLevel: config.demoStudent.yearLevel,
        sectionId: defaultSectionId,
        deactivatedAt: null,
      },
      create: {
        name: config.demoStudent.name,
        email: config.demoStudent.email,
        password: studentPasswordHash,
        role: "STUDENT",
        orgId: config.orgId,
        orgRole: "Member",
        yearLevel: config.demoStudent.yearLevel,
        sectionId: defaultSectionId,
      },
    });
  }
}

async function main() {
  console.log("Seeding started...");

  const officerPasswordHash = await bcrypt.hash("notmelook", 10);
  const studentPasswordHash = await bcrypt.hash("password123", 10);

  for (const config of ORG_BOOTSTRAP_CONFIGS) {
    await upsertOrganizationSettings(config);
    const defaultSection = await upsertDefaultSection(config);
    const activePeriod = await ensureActiveCollectionPeriod(config);

    await ensureDefaultCollectionSchedule(config, activePeriod.id);
    await ensureDemoAccounts(config, defaultSection.id, officerPasswordHash, studentPasswordHash);

    console.log(`Bootstrapped ${config.displayName} (${config.orgId})`);
  }

  console.log("Seeding finished.");
  console.log("--- Demo Accounts Created ---");
  console.log("OFFICER:");
  console.log("Email: justine.lopez@sdca.edu.ph");
  console.log("Password: notmelook");
  console.log("");
  console.log("STUDENT:");
  console.log("Email: student.bsit@sdca.edu.ph");
  console.log("Password: password123");
  console.log("");
  console.log("Combacheros has org settings and baseline structure only. No placeholder user accounts were seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
