import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PracticeSession } from "@/components/practice-session";

type Option = { key: string; value: string };

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }> | { sessionId: string };
  searchParams: Promise<{ ids?: string }> | { ids?: string };
}) {
  const { sessionId } =
    params instanceof Promise ? await params : params;
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const idsParam = sp.ids;

  // 未登录 → 跳登录
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  // 校验 session 属于当前用户
  const study = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!study || study.userId !== session.user.id) {
    notFound();
  }

  if (!idsParam) {
    // 没有 ids query 时回退到取题库中前 20 道
    const fallback = await prisma.question.findMany({ take: 20, orderBy: { id: "asc" } });
    if (fallback.length === 0) notFound();
    return (
      <PracticeSession
        questions={fallback.map((q) => ({
          id: q.id,
          module: q.module,
          type: q.type,
          stem: q.stem,
          options: Array.isArray(q.options) ? (q.options as Option[]) : null,
          difficulty: q.difficulty,
        }))}
        sessionId={sessionId}
      />
    );
  }

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) notFound();

  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
  });
  // 保持顺序与 ids 一致
  const ordered = ids
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is (typeof questions)[number] => Boolean(q));

  if (ordered.length === 0) notFound();

  return (
    <PracticeSession
      questions={ordered.map((q) => ({
        id: q.id,
        module: q.module,
        type: q.type,
        stem: q.stem,
        options: Array.isArray(q.options) ? (q.options as Option[]) : null,
        difficulty: q.difficulty,
      }))}
      sessionId={sessionId}
    />
  );
}
