"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlanTaskLite = {
  id: string;
  date: Date;
  module: string;
  target: { type: "questions"; count: number } | Record<string, unknown>;
  status: string;
  doneCount: number;
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  partial: "secondary",
  done: "default",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "未开始",
  partial: "进行中",
  done: "已完成",
};

function targetCount(t: PlanTaskLite): number {
  const v = (t.target as { count?: number }).count;
  return typeof v === "number" ? v : 0;
}

export function PlanCard({ task }: { task: PlanTaskLite }) {
  const count = targetCount(task);
  const dateStr = task.date.toISOString().slice(0, 10);
  const variant = STATUS_VARIANT[task.status] ?? "outline";
  const text = STATUS_TEXT[task.status] ?? task.status;
  const isToday = dateStr === new Date().toISOString().slice(0, 10);
  const isPast = new Date(dateStr) < new Date(new Date().toISOString().slice(0, 10));

  return (
    <Card
      className={cn(
        "p-3 transition-colors",
        task.status === "done" && "opacity-70",
        isToday && "ring-1 ring-primary"
      )}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{dateStr}</span>
            {isToday && <Badge variant="default">今天</Badge>}
            {isPast && task.status !== "done" && (
              <Badge variant="destructive">已过期</Badge>
            )}
          </div>
          <div className="font-medium mt-0.5">
            {task.module} · {count} 题
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {task.doneCount} / {count}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={variant}>{text}</Badge>
          {task.status !== "done" && (
            <Link
              href={`/practice/new?module=${encodeURIComponent(task.module)}&count=${count}`}
              className="text-primary text-sm hover:underline"
            >
              开始 →
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
