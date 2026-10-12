import "dotenv/config";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
async function seed() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase(),
    password = process.env.SEED_USER_PASSWORD,
    firstName = process.env.SEED_USER_FIRST_NAME?.trim() || "ProjectForge",
    lastName = process.env.SEED_USER_LAST_NAME?.trim() || "Student";
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set SEED_USER_EMAIL and a SEED_USER_PASSWORD of at least 12 characters",
    );
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      firstName,
      lastName,
      email,
      passwordHash,
      role: UserRole.STUDENT,
    },
    update: { firstName, lastName, passwordHash, isActive: true },
    select: { id: true, email: true, role: true },
  });
  console.log("Development user ready", user);
}
seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
