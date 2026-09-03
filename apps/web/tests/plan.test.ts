import { describe, it, expect } from "vitest";
import { generateDailyTasks, computeProgress } from "@/lib/plan";

describe("generateDailyTasks", () => {
  it("按天生成任务，模块轮换", () => {
    const plan = {
      id: "p1",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-03"),
    } as Parameters<typeof generateDailyTasks>[0];
    const tasks = generateDailyTasks(plan, 30);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].date.toISOString().slice(0, 10)).toBe("2024-01-01");
    expect(tasks[0].module).toBe("常识"); // 默认从常识开始
    expect(tasks[1].module).toBe("言语");
    expect(tasks[2].module).toBe("数量");
  });

  it("每天 N 道题", () => {
    const plan = {
      id: "p1",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-02"),
    } as Parameters<typeof generateDailyTasks>[0];
    const tasks = generateDailyTasks(plan, 30);
    expect(tasks[0].target).toEqual({ type: "questions", count: 30 });
  });

  it("生成任务初始 status=pending, doneCount=0", () => {
    const plan = {
      id: "p1",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-01"),
    } as Parameters<typeof generateDailyTasks>[0];
    const tasks = generateDailyTasks(plan, 30);
    expect(tasks[0].status).toBe("pending");
    expect(tasks[0].doneCount).toBe(0);
    expect(tasks[0].planId).toBe("p1");
  });
});

describe("computeProgress", () => {
  it("空任务列表返回 0%", () => {
    expect(computeProgress([])).toEqual({
      total: 0,
      done: 0,
      partial: 0,
      percentage: 0,
    });
  });

  it("全 done 返回 100%", () => {
    const r = computeProgress([
      { status: "done" },
      { status: "done" },
      { status: "done" },
    ]);
    expect(r).toEqual({ total: 3, done: 3, partial: 0, percentage: 1 });
  });

  it("partial 算 0.5 权重", () => {
    const r = computeProgress([
      { status: "done" },
      { status: "partial" },
      { status: "pending" },
      { status: "pending" },
    ]);
    // (1 + 0.5) / 4 = 0.375
    expect(r.percentage).toBe(0.375);
    expect(r.total).toBe(4);
    expect(r.done).toBe(1);
    expect(r.partial).toBe(1);
  });
});
