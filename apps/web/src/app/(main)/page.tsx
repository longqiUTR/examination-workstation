import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { aggregateDaily } from "@/lib/stats";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-3">
        <p>请先登录</p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          去登录
        </Link>
      </div>
    );
  }

  const userId = session.user.id;
  const todayUtc = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    )
  );
  const tomorrowUtc = new Date(todayUtc.getTime() + 86400000);

  const [todayTasks, todayAttempts, recentWrong, activePlans, weekAttempts] =
    await Promise.all([
      prisma.planTask.findMany({
        where: {
          plan: { userId, status: "active" },
          date: { gte: todayUtc, lt: tomorrowUtc },
        },
        include: { plan: { select: { id: true, title: true } } },
        orderBy: { module: "asc" },
      }),
      prisma.attempt.count({
        where: { userId, createdAt: { gte: todayUtc } },
      }),
      prisma.wrongQuestion.count({
        where: { userId, mastered: false },
      }),
      prisma.plan.count({ where: { userId, status: "active" } }),
      prisma.attempt.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        select: { isCorrect: true, createdAt: true, question: { select: { module: true } } },
      }),
    ]);

  // 今日正确率
  const todayCorrect = await prisma.attempt.count({
    where: { userId, createdAt: { gte: todayUtc }, isCorrect: true },
  });
  const todayAccuracy =
    todayAttempts > 0 ? Math.round((todayCorrect / todayAttempts) * 100) : 0;

  // 本周统计
  const daily = aggregateDaily(weekAttempts as never, 7);
  const weekTotal = Object.values(daily).reduce((s, d) => s + d.total, 0);
  const weekCorrect = Object.values(daily).reduce((s, d) => s + d.correct, 0);
  const weekAccuracy =
    weekTotal > 0 ? Math.round((weekCorrect / weekTotal) * 100) : 0;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          你好 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.user.email}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">今日做题</div>
          <div className="text-2xl font-bold">{todayAttempts}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            正确率 {todayAccuracy}%
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">未掌握错题</div>
          <div className="text-2xl font-bold">{recentWrong}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            <Link href="/mistakes?mastered=false" className="hover:underline">
              去复习
            </Link>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">活跃计划</div>
          <div className="text-2xl font-bold">{activePlans}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            <Link href="/plans" className="hover:underline">
              管理
            </Link>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">近 7 天</div>
          <div className="text-2xl font-bold">{weekTotal}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            正确率 {weekAccuracy}%
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">今日任务</h2>
        {todayTasks.length === 0 ? (
          <Card className="p-4 text-muted-foreground text-sm space-y-2">
            <p>今日无计划任务</p>
            {activePlans === 0 ? (
              <Link
                href="/plans/new"
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "p-0 h-auto")}
              >
                立即新建一个计划 →
              </Link>
            ) : (
              <Link
                href="/practice/new"
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "p-0 h-auto")}
              >
                去自由练习 →
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => {
              const target = t.target as { count?: number } | null;
              const count = target?.count ?? 0;
              const isDone = t.status === "done";
              return (
                <Card
                  key={t.id}
                  className="p-3 flex justify-between items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {t.plan.title} · {t.module}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>
                        {t.doneCount} / {count}
                      </span>
                      {isDone ? (
                        <Badge variant="secondary">已完成</Badge>
                      ) : t.status === "partial" ? (
                        <Badge variant="outline">进行中</Badge>
                      ) : null}
                    </div>
                  </div>
                  {isDone ? (
                    <Link
                      href={`/plans/${t.plan.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" })
                      )}
                    >
                      查看
                    </Link>
                  ) : (
                    <Link
                      href={`/practice/new?module=${encodeURIComponent(t.module)}&count=${count}`}
                    >
                      <Button size="sm">开始</Button>
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">快速入口</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/questions" className="w-full">
            <Button variant="outline" className="w-full">
              浏览题库
            </Button>
          </Link>
          <Link href="/mistakes" className="w-full">
            <Button variant="outline" className="w-full">
              复习错题
            </Button>
          </Link>
          <Link href="/stats" className="w-full">
            <Button variant="outline" className="w-full">
              查看统计
            </Button>
          </Link>
          <Link href="/plans" className="w-full">
            <Button variant="outline" className="w-full">
              管理计划
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
