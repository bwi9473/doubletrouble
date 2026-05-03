import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing users without personId (admin/manager accounts)
  await prisma.appUser.deleteMany({ where: { personId: null } });

  const adminUser = await prisma.appUser.create({
    data: {
      name: "Admin User",
      username: "admin",
      password: "admin123",
      role: "ADMIN",
    },
  });

  const matchManagerUser = await prisma.appUser.create({
    data: {
      name: "Match Manager",
      username: "manager",
      password: "manager123",
      role: "MATCH_MANAGER",
    },
  });

  console.log("✅ Test users created:");
  console.log("- Admin:", adminUser.username);
  console.log("- Match Manager:", matchManagerUser.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
