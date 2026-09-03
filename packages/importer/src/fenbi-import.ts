import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@exam/db';
import { parseJsonFile } from './parsers/json.js';

export interface ImportSummary {
  totalImported: number;
  byModule: Record<string, number>;
}

/**
 * 读取 dir 下所有 .json 题目文件，解析后写入 Postgres。
 * 每个 .json 文件结构：{ examId, questions: [...] }，见 @exam/importer schema。
 */
export async function importFromDir(
  dir: string,
  examId: string,
  options: { truncate?: boolean } = {}
): Promise<ImportSummary> {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const byModule: Record<string, number> = {};
  let totalImported = 0;

  if (options.truncate) {
    // 仅删当前 examId 下的题目，避免误伤其他考试
    await prisma.question.deleteMany({ where: { examId } });
  }

  for (const file of files) {
    const fullPath = join(dir, file);
    const content = readFileSync(fullPath, 'utf-8');
    const questions = parseJsonFile(content);

    for (const q of questions) {
      await prisma.question.create({
        data: {
          examId,
          module: q.module,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          analysis: q.analysis,
          difficulty: q.difficulty,
          tags: q.tags,
          source: '真题',
          year: q.year,
        },
      });
      byModule[q.module] = (byModule[q.module] ?? 0) + 1;
      totalImported++;
    }
  }

  return { totalImported, byModule };
}

// CLI 入口：`tsx packages/importer/src/fenbi-import.ts <dir> <examId> [--truncate]`
const isMain = (() => {
  if (typeof process === 'undefined') return false;
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isMain) {
  const args = process.argv.slice(2);
  const truncate = args.includes('--truncate');
  const positional = args.filter((a) => !a.startsWith('--'));
  const [dir, examId] = positional;
  if (!dir || !examId) {
    console.error('用法: tsx fenbi-import.ts <dir> <examId> [--truncate]');
    process.exit(1);
  }
  importFromDir(dir, examId, { truncate })
    .then((summary) => {
      console.log(
        `✅ 导入 ${summary.totalImported} 道题，按模块：${JSON.stringify(summary.byModule)}`
      );
      process.exit(0);
    })
    .catch((e) => {
      console.error('❌ 导入失败：', e);
      process.exit(1);
    });
}
