import { describe, it, expect, beforeEach, vi } from "vitest";

const store = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => store.get(k),
  set: async (k: string, v: unknown) => {
    store.set(k, v);
  },
}));

;(globalThis as unknown as { window: object }).window = {};

const { enqueue, listOutbox } = await import("../src/lib/outbox");
const { flushOutbox } = await import("../src/lib/sync");

beforeEach(() => {
  store.clear();
});

describe("flushOutbox", () => {
  it("成功 send 后出队", async () => {
    await enqueue({ type: "attempt", payload: { n: 1 } });
    await enqueue({ type: "attempt", payload: { n: 2 } });

    const sent: unknown[] = [];
    await flushOutbox(async (item) => {
      sent.push(item.payload);
    });

    expect(sent).toHaveLength(2);
    expect(await listOutbox()).toHaveLength(0);
  });

  it("单条失败不影响其他", async () => {
    await enqueue({ type: "attempt", payload: { n: 1 } });
    await enqueue({ type: "attempt", payload: { n: 2 } });
    await enqueue({ type: "attempt", payload: { n: 3 } });

    const seen: number[] = [];
    await flushOutbox(async (item) => {
      const p = item.payload as { n: number };
      if (p.n === 2) throw new Error("boom");
      seen.push(p.n);
    });

    // n=1 成功，n=2 失败，n=3 仍应被处理
    expect(seen).toEqual([1, 3]);
    const left = await listOutbox();
    expect(left).toHaveLength(1);
    expect((left[0].payload as { n: number }).n).toBe(2);
    expect(left[0].retries).toBe(1);
  });

  it("空队列直接返回", async () => {
    let called = 0;
    await flushOutbox(async () => {
      called++;
    });
    expect(called).toBe(0);
  });
});
