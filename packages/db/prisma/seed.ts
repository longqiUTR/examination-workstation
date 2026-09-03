import { PrismaClient } from '@prisma/client';
import { importFromDir } from '@exam/importer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

const SEED_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'seed-data',
  'guokao-2024'
);

async function main() {
  // 确保 exam 存在
  await prisma.exam.upsert({
    where: { id: 'guokao-2024' },
    update: {},
    create: {
      id: 'guokao-2024',
      name: '国考 2024',
      type: 'GUO_KAO',
      year: 2024,
    },
  });

  const summary = await importFromDir(SEED_DIR, 'guokao-2024', { truncate: true });
  console.log(
    `导入完成：共 ${summary.totalImported} 道题，按模块：${JSON.stringify(summary.byModule)}`
  );
}

main()
  .catch((e) => {
    console.error('❌ seed 失败：', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
