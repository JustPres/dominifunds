import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  const officerPasswordHash = await bcrypt.hash("notmelook", 10);
  const studentPasswordHash = await bcrypt.hash("password123", 10);
  const existingSection = await prisma.section.findFirst({
    where: { orgId: "BSIT", name: "BSIT 3A" },
  });

  const defaultSection = existingSection
    ? await prisma.section.update({
        where: { id: existingSection.id },
        data: { deletedAt: null },
      })
    : await prisma.section.create({
        data: {
          orgId: "BSIT",
          name: "BSIT 3A",
        },
      });

  const existingPeriods = await prisma.collectionPeriod.findMany({
    where: { orgId: "BSIT" },
    orderBy: { createdAt: "asc" },
  });

  let activePeriod = existingPeriods.find((period) => period.isActive) ?? null;

  if (!activePeriod) {
    activePeriod = await prisma.collectionPeriod.create({
      data: {
        orgId: "BSIT",
        name: "Second Semester 2026",
        startDate: new Date("2026-01-05T00:00:00.000Z"),
        endDate: new Date("2026-06-30T23:59:59.999Z"),
        isActive: true,
      },
    });
  }

  // Add BSIT Officer
  await prisma.user.upsert({
    where: { email: "justine.lopez@sdca.edu.ph" },
    update: {
      name: "Justine Lopez",
      password: officerPasswordHash,
      officerAccessRole: "TREASURER",
    },
    create: {
      name: "Justine Lopez",
      email: "justine.lopez@sdca.edu.ph",
      password: officerPasswordHash,
      role: "OFFICER",
      orgId: "BSIT",
      orgRole: "Treasurer",
      officerAccessRole: "TREASURER",
      yearLevel: null,
    },
  });

  // Add BSIT Student
  await prisma.user.upsert({
    where: { email: "student.bsit@sdca.edu.ph" },
    update: {
      password: studentPasswordHash,
      sectionId: defaultSection.id,
    },
    create: {
      name: "Juan Dela Cruz",
      email: "student.bsit@sdca.edu.ph",
      password: studentPasswordHash,
      role: "STUDENT",
      orgId: "BSIT",
      orgRole: "Member",
      yearLevel: "3rd",
      sectionId: defaultSection.id,
    },
  });

  const defaultSchedule = await prisma.collectionSchedule.findFirst({
    where: {
      orgId: "BSIT",
      collectionPeriodId: activePeriod.id,
      scope: "ORG_DEFAULT",
      deletedAt: null,
    },
  });

  if (!defaultSchedule) {
    await prisma.collectionSchedule.create({
      data: {
        orgId: "BSIT",
        collectionPeriodId: activePeriod.id,
        scope: "ORG_DEFAULT",
        name: "Default Mon/Thu Collection",
        weekdays: [1, 4],
        note: "Default weekly collection run for BSIT.",
      },
    });
  }

  console.log("Seeding finished.");
  console.log("--- Demo Accounts Created ---");
  console.log("OFFICER:");
  console.log("Email: justine.lopez@sdca.edu.ph");
  console.log("Password: notmelook");
  console.log("\nSTUDENT:");
  console.log("Email: student.bsit@sdca.edu.ph");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
