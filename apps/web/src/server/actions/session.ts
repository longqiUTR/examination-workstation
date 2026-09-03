"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export type StartSessionInput = {
  mode: "逐题";
  modules?: string[];
  difficulty?: number;
  count: number;
};

export async function startSession(input: StartSessionInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Prisma.QuestionWhereInput = {};
  if (input.modules?.length) where.module = { in: input.modules };
  if (input.difficulty) where.difficulty = input.difficulty;

  const questions = await prisma.question.findMany({
    where,
    take: input.count,
    orderBy: { id: "asc" },
  });

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      mode: input.mode,
      config: input as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    sessionId: studySession.id,
    questionIds: questions.map((q) => q.id),
  };
}
