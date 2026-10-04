const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const map = {
  Иванов: 'Иванова',
  Петров: 'Петрова',
  Смирнов: 'Смирнова',
  Козлов: 'Козлова',
};

async function main() {
  const masters = await prisma.master.findMany({
    where: { gender: 'FEMALE', lastName: { in: Object.keys(map) } },
  });
  for (const master of masters) {
    await prisma.master.update({
      where: { id: master.id },
      data: { lastName: map[master.lastName] },
    });
  }
  console.log(`updated ${masters.length}`);
}

main().finally(() => prisma.$disconnect());
