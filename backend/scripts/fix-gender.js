const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const males = new Set(['Илья', 'Марк', 'Артём', 'Лев', 'Глеб', 'Тимур', 'Егор']);
const back = {
  Иванова: 'Иванов',
  Петрова: 'Петров',
  Смирнова: 'Смирнов',
  Козлова: 'Козлов',
};

async function main() {
  const masters = await prisma.master.findMany({ where: { firstName: { in: [...males] } } });
  for (const master of masters) {
    await prisma.master.update({
      where: { id: master.id },
      data: {
        gender: 'MALE',
        lastName: back[master.lastName] || master.lastName,
      },
    });
  }
  console.log(`gender ${masters.length}`);
}

main().finally(() => prisma.$disconnect());
