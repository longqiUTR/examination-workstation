const MODULES = ["常识", "言语", "数量", "判断", "资料"] as const;

export type ModuleName = (typeof MODULES)[number];

export type PlanLite = {
  id: string;
  startDate: Date;
  endDate: Date;
};

export type DailyTaskInput = {
  planId: string;
  date: Date;
  module: string;
  target: { type: "questions"; count: number };
  status: "pending" | "partial" | "done";
  doneCount: number;
};

/** 把任意 Date 归一化为"该日 UTC 0:00"，避免时区导致日界漂移 */
function toUtcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function generateDailyTasks(plan: PlanLite, dailyCount: number): DailyTaskInput[] {
  const tasks: DailyTaskInput[] = [];
  const start = toUtcDayStart(plan.startDate);
  const end = toUtcDayStart(plan.endDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    tasks.push({
      planId: plan.id,
      date: d,
      module: MODULES[i % MODULES.length],
      target: { type: "questions", count: dailyCount },
      status: "pending",
      doneCount: 0,
    });
  }
  return tasks;
}

export type ProgressTask = { status: string };

export type Progress = {
  total: number;
  done: number;
  partial: number;
  percentage: number;
};

export function computeProgress(tasks: ProgressTask[]): Progress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const partial = tasks.filter((t) => t.status === "partial").length;
  return {
    total,
    done,
    partial,
    percentage: total > 0 ? (done + partial * 0.5) / total : 0,
  };
}
