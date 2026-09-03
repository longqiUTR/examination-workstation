"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { judge, type QuestionType } from "@/lib/judge";
import { updateOnWrong, updateOnCorrect } from "@/lib/wrong-book";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

type SubmitInput = {
  questionId: string;
  userAnswer: string;
  durationMs: number;
  mode: string;
  sessionId: string;
};

type SessionStats = {
  total: number;
  correct: number;
  byModule: Record<string, { total: number; correct: number }>;
};

export async function submitAnswer(input: SubmitInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const q = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!q) throw new Error("Question not found");

  const isCorrect = judge(q.type as QuestionType, input.userAnswer, q.answer);

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      isCorrect,
      durationMs: input.durationMs,
      mode: input.mode,
    },
  });

  // 错题归集：答错调 updateOnWrong，答对调 updateOnCorrect
  if (!isCorrect) {
    await updateOnWrong(session.user.id, input.questionId, prisma);
  } else {
    await updateOnCorrect(session.user.id, input.questionId, prisma);
  }

  // 更新 StudySession.stats
  const study = await prisma.studySession.findUnique({
    where: { id: input.sessionId },
  });
  if (study) {
    const stats: SessionStats =
      (study.stats as unknown as SessionStats | null) ?? {
        total: 0,
        correct: 0,
        byModule: {},
      };
    stats.total += 1;
    if (isCorrect) stats.correct += 1;
    if (!stats.byModule[q.module]) {
      stats.byModule[q.module] = { total: 0, correct: 0 };
    }
    stats.byModule[q.module].total += 1;
    if (isCorrect) stats.byModule[q.module].correct += 1;

    await prisma.studySession.update({
      where: { id: input.sessionId },
      data: { stats: stats as unknown as Prisma.InputJsonValue },
    });
  }

  revalidatePath("/stats");
  return {
    isCorrect,
    correctAnswer: q.answer,
    analysis: q.analysis,
  };
}
