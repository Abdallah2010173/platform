import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = '3bdullahelsherif@gmail.com';

try {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.log(JSON.stringify({ found: false, email }, null, 2));
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, role: true },
  });

  console.log(JSON.stringify({ found: true, updated }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
