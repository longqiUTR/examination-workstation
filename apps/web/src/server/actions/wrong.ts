"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type ListWrongFilter = {
  module?: string;
  mastered?: boolean;
};

export async function listWrongQuestions(filter: ListWrongFilter = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.wrongQuestion.findMany({
    where: {
      userId: session.user.id,
      ...(filter.module ? { question: { module: filter.module } } : {}),
      ...(filter.mastered !== undefined ? { mastered: filter.mastered } : {}),
    },
    include: { question: true },
    orderBy: [{ mastered: "asc" }, { lastWrongAt: "desc" }],
  });
}
