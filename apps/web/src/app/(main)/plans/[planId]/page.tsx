import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlan, archivePlan } from "@/server/actions/plan";
import { computeProgress } from "@/lib/plan";
import { PlanCard } from "@/components/plan-card";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<string, string> = {
  active: "进行中",
  archived: "已归档",
};

export default async function PlanDetailPage({
  params,
}: {
  params: { planId: string };
}) {
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

  const plan = await getPlan(params.planId);
  if (!plan) notFound();

  const progress = computeProgress(plan.tasks);
  const todayUtc = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    )
  );
  const daysLeft = Math.max(
    0,
    Math.round((plan.endDate.getTime() - todayUtc.getTime()) / 86400000)
  );
  const totalDays = plan.tasks.length;

  async function handleArchive() {
    "use server";
    await archivePlan(plan!.id);
    // 不重定向，让用户留在页面看状态变化
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{plan.title}</h1>
            <Badge variant={plan.status === "active" ? "default" : "outline"}>
              {STATUS_TEXT[plan.status] ?? plan.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.startDate.toISOString().slice(0, 10)} ~{" "}
            {plan.endDate.toISOString().slice(0, 10)}
          </p>
        </div>
        <Link
          href="/plans"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← 返回
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">完成度</div>
          <div className="text-lg font-bold">
            {(progress.percentage * 100).toFixed(0)}%
          </div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">已完成/总</div>
          <div className="text-lg font-bold">
            {progress.done}/{totalDays}
          </div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">剩余天数</div>
          <div className="text-lg font-bold">{daysLeft}</div>
        </div>
      </div>

      {plan.status === "active" && (
        <form action={handleArchive}>
          <Button type="submit" variant="outline" size="sm">
            归档该计划
          </Button>
        </form>
      )}

      <section>
        <h2 className="text-lg font-bold mb-2">每日任务</h2>
        {plan.tasks.length === 0 ? (
          <Card className="p-4 text-muted-foreground text-sm">
            该计划没有每日任务
          </Card>
        ) : (
          <div className="space-y-2">
            {plan.tasks.map((t) => (
              <PlanCard
                key={t.id}
                task={{
                  id: t.id,
                  date: t.date,
                  module: t.module,
                  target: t.target as Record<string, unknown>,
                  status: t.status,
                  doneCount: t.doneCount,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
