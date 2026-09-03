"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createPlan } from "@/server/actions/plan";

export default function NewPlanPage() {
  const router = useRouter();
  const [title, setTitle] = useState("国考冲刺 90 天");
  const [days, setDays] = useState(90);
  const [dailyCount, setDailyCount] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    if (title.trim().length === 0) {
      setError("标题不能为空");
      return;
    }
    if (days < 1 || days > 365) {
      setError("天数需要在 1-365 之间");
      return;
    }
    if (dailyCount < 1 || dailyCount > 200) {
      setError("每日题数需要在 1-200 之间");
      return;
    }
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (days - 1));
    startTransition(async () => {
      try {
        const plan = await createPlan({
          title: title.trim(),
          targetExam: "guokao",
          startDate,
          endDate,
          dailyCount,
        });
        router.push(`/plans/${plan.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">新建计划</h1>

      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            计划标题
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="如：国考冲刺 90 天"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="days" className="text-sm font-medium">
            天数（含今天起）
          </label>
          <Input
            id="days"
            type="number"
            value={days}
            onChange={(e) =>
              setDays(Math.max(1, Math.min(365, +e.target.value || 0)))
            }
            min={1}
            max={365}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="daily" className="text-sm font-medium">
            每日题数
          </label>
          <Input
            id="daily"
            type="number"
            value={dailyCount}
            onChange={(e) =>
              setDailyCount(Math.max(1, Math.min(200, +e.target.value || 0)))
            }
            min={1}
            max={200}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          模块按 常识→言语→数量→判断→资料 轮换，每天生成 {dailyCount} 道
          {dailyCount} 题计划。
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleCreate} disabled={isPending} className="w-full">
          {isPending ? "创建中…" : "创建"}
        </Button>
      </Card>
    </div>
  );
}
