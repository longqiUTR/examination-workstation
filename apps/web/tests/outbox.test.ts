import { describe, it, expect, beforeEach, vi } from "vitest";

// 用一个内存 store 模拟 idb-keyval
const store = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => store.get(k),
  set: async (k: string, v: unknown) => {
    store.set(k, v);
  },
}));

// 模拟 window（enqueue 检查 typeof window !== "undefined"）
;(globalThis as unknown as { window: object }).window = {};

// 必须在 mock 后 import
const { enqueue, dequeue, listOutbox, markFailed, clearOutbox } = await import(
  "../src/lib/outbox"
);

beforeEach(() => {
  store.clear();
});

describe("outbox", () => {
  it("enqueue pushes item with id/createdAt/retries=0", async () => {
    const item = await enqueue({ type: "attempt", payload: { x: 1 } });
    expect(item.id).toBeTypeOf("string");
    expect(item.createdAt).toBeTypeOf("number");
    expect(item.retries).toBe(0);
    const list = await listOutbox();
    expect(list).toHaveLength(1);
    expect(list[0].payload).toEqual({ x: 1 });
  });

  it("enqueue 支持多次入队", async () => {
    await enqueue({ type: "attempt", payload: { n: 1 } });
    await enqueue({ type: "note", payload: { n: 2 } });
    const list = await listOutbox();
    expect(list).toHaveLength(2);
    expect(list[0].type).toBe("attempt");
    expect(list[1].type).toBe("note");
  });

  it("dequeue 删除指定 id", async () => {
    const a = await enqueue({ type: "attempt", payload: { n: 1 } });
    await enqueue({ type: "attempt", payload: { n: 2 } });
    await dequeue(a.id);
    const list = await listOutbox();
    expect(list).toHaveLength(1);
    expect((list[0].payload as { n: number }).n).toBe(2);
  });

  it("markFailed 增加 retries", async () => {
    const a = await enqueue({ type: "attempt", payload: { n: 1 } });
    await markFailed(a.id);
    const list = await listOutbox();
    expect(list[0].retries).toBe(1);
  });

  it("clearOutbox 清空", async () => {
    await enqueue({ type: "attempt", payload: { n: 1 } });
    await clearOutbox();
    expect(await listOutbox()).toHaveLength(0);
  });
});
