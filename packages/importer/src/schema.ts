import { z } from 'zod';

export const QuestionSchema = z.object({
  module: z.enum(['常识', '言语', '数量', '判断', '资料']),
  type: z.enum(['单选', '多选', '不定项']),
  stem: z.string().min(1),
  options: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .min(2),
  answer: z.string().min(1),
  analysis: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  year: z.number().int().optional(),
});

export const ImportFileSchema = z.object({
  examId: z.string(),
  questions: z.array(QuestionSchema),
});

export type ImportQuestion = z.infer<typeof QuestionSchema>;
export type ImportFile = z.infer<typeof ImportFileSchema>;
