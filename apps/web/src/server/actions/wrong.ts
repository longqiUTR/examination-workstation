"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { MAX_NOTE_LENGTH } from "@/lib/notes";

export type ListWrongFilter = {
  module?: string;
  mastered?: boolean;
};

export async function listWrongQuestions(filter: ListWrongFilter = {}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

export async function saveNote(questionId: string, note: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 服务端硬性字数限制（按字符计，中文/emoji 都算 1），防绕过
  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error(`笔记不能超过 ${MAX_NOTE_LENGTH} 字（当前 ${note.length}）`);
  }

  const result = await prisma.wrongQuestion.update({
    where: {
      userId_questionId: { userId: session.user.id, questionId },
    },
    data: { notes: note },
  });
  revalidatePath(`/mistakes/${questionId}`);
  return result;
}

/**
 * 强制将错题标记为已掌握，跳过"答对 3 次"门槛。
 * 二次确认由调用方（前端 Dialog）保证。
 */
export async function forceMaster(questionId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = await prisma.wrongQuestion.update({
    where: {
      userId_questionId: { userId: session.user.id, questionId },
    },
    data: {
      mastered: true,
      masteredAt: new Date(),
    },
  });
  revalidatePath("/mistakes");
  revalidatePath(`/mistakes/${questionId}`);
  return result;
}

