import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { aggregateByModule, aggregateDaily } from "@/lib/stats";
import { DailyChart, ModuleChart } from "@/components/stats-chart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-3">
        <p>请先登录</p>
        <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
          去登录
        </Link>
      </div>
    );
  }

  const attempts = await prisma.attempt.findMany({
    where: { userId: session.user.id },
    include: { question: { select: { module: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const byModule = aggregateByModule(
    attempts.map((a) => ({
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
      question: { module: a.question.module },
    }))
  );
  const daily = aggregateDaily(
    attempts.map((a) => ({
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
      question: { module: a.question.module },
    })),
    7
  );

  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const accuracy = attempts.length > 0 ? totalCorrect / attempts.length : 0;

  const dailySeries = Object.entries(daily)
    .map(([date, v]) => ({ date: date.slice(5), total: v.total, correct: v.correct }))
    .reverse();
  const moduleSeries = Object.entries(byModule).map(([m, v]) => ({
    module: m,
    accuracy: v.accuracy,
    total: v.total,
  }));

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">学习统计</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-muted-foreground">总做题数</div>
          <div className="text-2xl font-bold">{attempts.length}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-muted-foreground">总正确率</div>
          <div className="text-2xl font-bold">{(accuracy * 100).toFixed(1)}%</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2">近 7 天</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有答题记录</p>
        ) : (
          <DailyChart data={dailySeries} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">模块正确率</h2>
        {moduleSeries.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有答题记录</p>
        ) : (
          <ModuleChart data={moduleSeries} />
        )}
      </section>
    </div>
  );
}
