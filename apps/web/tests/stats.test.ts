import { describe, it, expect } from "vitest";
import { aggregateByModule, aggregateDaily } from "@/lib/stats";

describe("stats.aggregateByModule", () => {
  it("按模块聚合正确率", () => {
    const attempts = [
      { isCorrect: true, createdAt: new Date(), question: { module: "言语" } },
      { isCorrect: false, createdAt: new Date(), question: { module: "言语" } },
      { isCorrect: true, createdAt: new Date(), question: { module: "数量" } },
    ];
    expect(aggregateByModule(attempts)).toEqual({
      言语: { total: 2, correct: 1, accuracy: 0.5 },
      数量: { total: 1, correct: 1, accuracy: 1 },
    });
  });

  it("空 attempts 返回空 map", () => {
    expect(aggregateByModule([])).toEqual({});
  });
});

describe("stats.aggregateDaily", () => {
  it("按日期聚合（窗口内）", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    const attempts = [
      { isCorrect: true, createdAt: today, question: { module: "言语" } },
      { isCorrect: false, createdAt: today, question: { module: "言语" } },
      { isCorrect: true, createdAt: yesterday, question: { module: "数量" } },
    ];
    const r = aggregateDaily(attempts, 7);
    const todayKey = today.toISOString().slice(0, 10);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    expect(r[todayKey]).toEqual({ total: 2, correct: 1, accuracy: 0.5 });
    expect(r[yesterdayKey]).toEqual({ total: 1, correct: 1, accuracy: 1 });
    // 预填 7 个空槽
    expect(Object.keys(r)).toHaveLength(7);
  });
});
