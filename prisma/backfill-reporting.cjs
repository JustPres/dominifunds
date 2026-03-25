const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const YEAR_LEVEL_MAP = new Map([
  ["1st", "1st"],
  ["1st year", "1st"],
  ["2nd", "2nd"],
  ["2nd year", "2nd"],
  ["3rd", "3rd"],
  ["3rd year", "3rd"],
  ["4th", "4th"],
  ["4th year", "4th"],
]);

function normalizeYearLevel(value) {
  if (!value) return null;
  return YEAR_LEVEL_MAP.get(String(value).trim().toLowerCase().replace(/\s+/g, " ")) ?? null;
}

async function backfillUsers() {
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, orgRole: true, yearLevel: true },
  });

  let updatedCount = 0;

  for (const user of users) {
    const yearLevel = normalizeYearLevel(user.yearLevel) ?? normalizeYearLevel(user.orgRole);
    const hasYearLevelInRole = normalizeYearLevel(user.orgRole) !== null;
    const nextOrgRole = !user.orgRole || hasYearLevelInRole ? "Member" : user.orgRole;

    if (yearLevel !== user.yearLevel || nextOrgRole !== user.orgRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          yearLevel,
          orgRole: nextOrgRole,
        },
      });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function backfillFunds() {
  const funds = await prisma.fundType.findMany({
    include: {
      installmentPlans: {
        include: {
          entries: {
            select: { id: true },
          },
        },
      },
    },
  });

  let updatedCount = 0;

  for (const fund of funds) {
    const installmentCounts = [...new Set(
      fund.installmentPlans
        .map((plan) => plan.entries.length)
        .filter((entryCount) => entryCount > 1)
    )];

    const maxInstallments = installmentCounts.length === 1 ? installmentCounts[0] : null;
    const allowInstallment = fund.installmentPlans.length > 0;

    await prisma.fundType.update({
      where: { id: fund.id },
      data: {
        frequency: fund.frequency ?? "PER_SEMESTER",
        allowInstallment,
        maxInstallments,
      },
    });

    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const userUpdates = await backfillUsers();
  const fundUpdates = await backfillFunds();

  console.log(`Updated ${userUpdates} student records.`);
  console.log(`Updated ${fundUpdates} fund records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
