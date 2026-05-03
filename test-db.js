const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.appUser.findMany();
    console.log('All users:', JSON.stringify(users, null, 2));
    
    const user = await prisma.appUser.findUnique({
      where: { username: 'bert' },
    });
    console.log('\nBert user:', JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
