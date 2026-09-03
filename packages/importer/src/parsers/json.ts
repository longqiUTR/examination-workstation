import { ImportFileSchema, type ImportQuestion } from '../schema.js';

export function parseJsonFile(content: string): ImportQuestion[] {
  const data = JSON.parse(content);
  const parsed = ImportFileSchema.parse(data);
  return parsed.questions;
}
