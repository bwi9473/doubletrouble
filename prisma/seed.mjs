import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(data) {
  return prisma.appUser.upsert({
    where: { username: data.username },
    update: {
      name: data.name,
      password: data.password,
      role: data.role,
    },
    create: data,
  });
}

async function main() {
  const adminUser = await upsertUser({
    name: "Admin User",
    username: "admin",
    password: "GastenHuis5",
    role: "ADMIN",
  });

  const matchManagerUser = await upsertUser({
    name: "Match Manager",
    username: "manager",
    password: "manager123",
    role: "MATCH_MANAGER",
  });

  console.log("Seed complete:");
  console.log(`- Admin: ${adminUser.username}`);
  console.log(`- Match Manager: ${matchManagerUser.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
