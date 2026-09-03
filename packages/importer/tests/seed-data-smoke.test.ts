import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseJsonFile } from '../src/parsers/json.js';

const SEED_DIR = join(
  __dirname,
  '..',
  '..',
  'db',
  'seed-data',
  'guokao-2024'
);

describe('seed data 校验', () => {
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  it('应包含 5 个模块 JSON', () => {
    expect(files).toHaveLength(5);
    const expected = ['常识', '言语', '数量', '判断', '资料'].map((m) => `${m}.json`).sort();
    expect(files.sort()).toEqual(expected);
  });

  for (const f of files) {
    it(`${f} 解析成功且有 50 道题`, () => {
      const content = readFileSync(join(SEED_DIR, f), 'utf-8');
      const questions = parseJsonFile(content);
      expect(questions).toHaveLength(50);
      for (const q of questions) {
        expect(q.module).toBeTruthy();
        expect(q.stem.length).toBeGreaterThan(0);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answer.length).toBeGreaterThan(0);
        expect(q.difficulty).toBeGreaterThanOrEqual(1);
        expect(q.difficulty).toBeLessThanOrEqual(5);
      }
    });
  }
});
