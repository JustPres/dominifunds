import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Add BSIT Officer
  await prisma.user.upsert({
    where: { email: "officer.bsit@sdca.edu.ph" },
    update: { password: passwordHash },
    create: {
      name: "BSIT Officer",
      email: "officer.bsit@sdca.edu.ph",
      password: passwordHash,
      role: "OFFICER",
      orgId: "BSIT",
      orgRole: "Treasurer",
    },
  });

  // Add BSIT Student
  await prisma.user.upsert({
    where: { email: "student.bsit@sdca.edu.ph" },
    update: { password: passwordHash },
    create: {
      name: "Juan Dela Cruz",
      email: "student.bsit@sdca.edu.ph",
      password: passwordHash,
      role: "STUDENT",
      orgId: "BSIT",
      orgRole: "3rd Year",
    },
  });

  // Add Demo BSIT FundType
  const existingFund = await prisma.fundType.findFirst({
    where: { name: "Annual Org Fee", orgId: "BSIT" },
  });

  if (!existingFund) {
    await prisma.fundType.create({
      data: {
        name: "Annual Org Fee",
        description: "Mandatory collection for the school year",
        amount: 500,
        required: true,
        orgId: "BSIT",
      },
    });
  }

  console.log("Seeding finished.");
  console.log("--- Demo Accounts Created ---");
  console.log("OFFICER:");
  console.log("Email: officer.bsit@sdca.edu.ph");
  console.log("Password: password123");
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
