import { describe, it, expect } from 'vitest';
import { parseJsonFile } from '../src/parsers/json.js';

describe('parseJsonFile', () => {
  it('parses a valid file', () => {
    const content = JSON.stringify({
      examId: 'guokao-2024',
      questions: [
        {
          module: '言语',
          type: '单选',
          stem: '下列词语中正确的是？',
          options: [
            { key: 'A', value: '正确' },
            { key: 'B', value: '错' },
          ],
          answer: 'A',
          difficulty: 2,
          tags: ['字形'],
        },
      ],
    });
    const result = parseJsonFile(content);
    expect(result).toHaveLength(1);
    expect(result[0].module).toBe('言语');
  });

  it('rejects invalid schema', () => {
    const bad = JSON.stringify({ examId: 'x', questions: [{ module: '未知' }] });
    expect(() => parseJsonFile(bad)).toThrow();
  });
});
