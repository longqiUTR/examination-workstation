"use server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ListQuestionsInput = {
  examId?: string;
  module?: string;
  difficulty?: number;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listQuestions(input: ListQuestionsInput = {}) {
  const { examId, module, difficulty, tags, search, page = 1, pageSize = 20 } = input;
  const where: Prisma.QuestionWhereInput = {};
  if (examId) where.examId = examId;
  if (module) where.module = module;
  if (difficulty) where.difficulty = difficulty;
  if (tags?.length) where.tags = { hasSome: tags };
  // 关键词搜索：在题干 stem 里做 case-insensitive contains
  if (search && search.trim()) {
    where.stem = { contains: search.trim(), mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.question.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getQuestion(id: string) {
  return prisma.question.findUnique({ where: { id } });
}
