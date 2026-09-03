import { describe, it, expect, vi } from "vitest";
import { updateOnWrong, updateOnCorrect, MASTERY_THRESHOLD } from "@/lib/wrong-book";

describe("wrong-book", () => {
  it("updateOnWrong: 新错题创建", async () => {
    const fakePrisma = {
      wrongQuestion: {
        upsert: vi.fn().mockResolvedValue({ wrongCount: 1, correctCount: 0, mastered: false }),
      },
    };
    await updateOnWrong("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.upsert).toHaveBeenCalledWith({
      where: { userId_questionId: { userId: "u1", questionId: "q1" } },
      create: expect.objectContaining({ wrongCount: 1, correctCount: 0, mastered: false }),
      update: expect.objectContaining({ wrongCount: { increment: 1 }, correctCount: 0, mastered: false, masteredAt: null }),
    });
  });

  it("updateOnCorrect: 答对一次 correctCount 增 1", async () => {
    const existing = { wrongCount: 2, correctCount: 1, mastered: false };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue({ ...existing, correctCount: 2 }),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.update).toHaveBeenCalledWith({
      where: { userId_questionId: { userId: "u1", questionId: "q1" } },
      data: { correctCount: { increment: 1 } },
    });
  });

  it("updateOnCorrect: 达到阈值自动 mark mastered", async () => {
    const existing = { wrongCount: 2, correctCount: MASTERY_THRESHOLD - 1, mastered: false };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue({ ...existing, correctCount: 3, mastered: true }),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    const call = fakePrisma.wrongQuestion.update.mock.calls[0][0];
    expect(call.data).toMatchObject({ correctCount: { increment: 1 }, mastered: true });
    expect(call.data.masteredAt).toBeInstanceOf(Date);
  });

  it("updateOnCorrect: 已掌握不重复触发", async () => {
    const existing = { wrongCount: 2, correctCount: 5, mastered: true };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn(),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.update).not.toHaveBeenCalled();
  });
});
