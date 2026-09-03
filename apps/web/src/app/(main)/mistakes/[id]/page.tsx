import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PracticeSession } from "@/components/practice-session";
import type { Prisma } from "@prisma/client";

export default async function MistakeRedoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) notFound();

  // 临时建一个 StudySession 复用 practice-session 组件
  const study = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      mode: "错题重做",
      config: { questionId: params.id } as unknown as Prisma.InputJsonValue,
    },
  });

  return (
    <PracticeSession
      questions={[
        {
          id: question.id,
          module: question.module,
          type: question.type,
          stem: question.stem,
          options: (question.options as { key: string; value: string }[] | null) ?? null,
          difficulty: question.difficulty,
        },
      ]}
      sessionId={study.id}
    />
  );
}
