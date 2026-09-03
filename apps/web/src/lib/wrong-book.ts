import type { PrismaClient } from "@prisma/client";

export const MASTERY_THRESHOLD = 3;

export async function updateOnWrong(userId: string, questionId: string, prisma: PrismaClient) {
  await prisma.wrongQuestion.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, wrongCount: 1, correctCount: 0, mastered: false },
    update: {
      wrongCount: { increment: 1 },
      correctCount: 0,
      mastered: false,
      masteredAt: null,
      lastWrongAt: new Date(),
    },
  });
}

export async function updateOnCorrect(userId: string, questionId: string, prisma: PrismaClient) {
  const existing = await prisma.wrongQuestion.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });
  if (!existing || existing.mastered) return;

  const newCorrectCount = existing.correctCount + 1;
  const shouldMaster = newCorrectCount >= MASTERY_THRESHOLD;

  await prisma.wrongQuestion.update({
    where: { userId_questionId: { userId, questionId } },
    data: {
      correctCount: { increment: 1 },
      ...(shouldMaster ? { mastered: true, masteredAt: new Date() } : {}),
    },
  });
}
