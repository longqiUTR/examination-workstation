import { describe, it, expect, vi } from "vitest";
import {
  generateDailyTasks,
  computeProgress,
  markPlanTasksDone,
} from "@/lib/plan";

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

describe("markPlanTasksDone", () => {
  it("答对一道：doneCount +1，未达 target 仍 partial", async () => {
    const fakePrisma = {
      planTask: {
        findMany: vi.fn().mockResolvedValue([
          { id: "t1", doneCount: 1, target: { count: 3 } },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    await markPlanTasksDone({
      userId: "u1",
      module: "言语",
      now: new Date("2024-01-01T10:00:00Z"),
      prisma: fakePrisma as any,
    });
    expect(fakePrisma.planTask.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { doneCount: { increment: 1 }, status: "partial" },
    });
  });

  it("答对达到 target：状态转 done", async () => {
    const fakePrisma = {
      planTask: {
        findMany: vi.fn().mockResolvedValue([
          { id: "t1", doneCount: 2, target: { count: 3 } },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    await markPlanTasksDone({
      userId: "u1",
      module: "言语",
      now: new Date("2024-01-01T10:00:00Z"),
      prisma: fakePrisma as any,
    });
    expect(fakePrisma.planTask.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { doneCount: { increment: 1 }, status: "done" },
    });
  });

  it("已 done 的任务不会再被查到", async () => {
    const fakePrisma = {
      planTask: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    await markPlanTasksDone({
      userId: "u1",
      module: "言语",
      now: new Date("2024-01-01T10:00:00Z"),
      prisma: fakePrisma as any,
    });
    expect(fakePrisma.planTask.update).not.toHaveBeenCalled();
  });

  it("按当天 UTC 窗口查询 active 计划", async () => {
    const fakePrisma = {
      planTask: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    const now = new Date("2024-06-15T10:00:00Z");
    await markPlanTasksDone({
      userId: "u1",
      module: "数量",
      now,
      prisma: fakePrisma as any,
    });
    const call = fakePrisma.planTask.findMany.mock.calls[0][0];
    expect(call.where.plan).toEqual({ userId: "u1", status: "active" });
    expect(call.where.module).toBe("数量");
    expect(call.where.status).toEqual({ in: ["pending", "partial"] });
    expect(call.where.date.gte.toISOString()).toBe("2024-06-15T00:00:00.000Z");
    expect(call.where.date.lt.toISOString()).toBe("2024-06-16T00:00:00.000Z");
  });
});
