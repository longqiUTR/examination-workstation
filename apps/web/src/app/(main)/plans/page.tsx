import Link from "next/link";
import { auth } from "@/lib/auth";
import { listPlans } from "@/server/actions/plan";
import { computeProgress } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { text: string; variant: "default" | "secondary" | "outline" }> = {
  active: { text: "进行中", variant: "default" },
  archived: { text: "已归档", variant: "outline" },
};

export default async function PlansPage() {
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

  const plans = await listPlans();

  // 批量拿每个 plan 的 tasks 算进度
  const planIds = plans.map((p) => p.id);
  const allTasks =
    planIds.length > 0
      ? await prisma.planTask.findMany({
          where: { planId: { in: planIds } },
          select: { planId: true, status: true },
        })
      : [];
  const tasksByPlan: Record<string, { status: string }[]> = {};
  for (const t of allTasks) {
    (tasksByPlan[t.planId] ??= []).push({ status: t.status });
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">个人计划（{plans.length}）</h1>
        <Link
          href="/plans/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          新建
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>还没有计划</p>
          <Link
            href="/plans/new"
            className={cn(
              buttonVariants({ variant: "link" }),
              "mt-2"
            )}
          >
            立即新建一个
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const progress = computeProgress(tasksByPlan[p.id] ?? []);
            const st = STATUS_LABEL[p.status] ?? {
              text: p.status,
              variant: "outline" as const,
            };
            return (
              <Link key={p.id} href={`/plans/${p.id}`}>
                <Card className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{p.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {p.startDate.toISOString().slice(0, 10)} ~{" "}
                        {p.endDate.toISOString().slice(0, 10)}
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.text}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    进度 {progress.done}/{progress.total}（
                    {(progress.percentage * 100).toFixed(0)}%）
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
