/**
 * Outbox 队列：离线写操作先入队，联网后再 flush。
 * 客户端 only；使用 idb-keyval 持久化到 IndexedDB。
 */
import { get, set } from "idb-keyval";

const OUTBOX_KEY = "outbox-queue";

export type OutboxType = "attempt" | "note";

export type OutboxItem = {
  id: string;
  type: OutboxType;
  payload: unknown;
  createdAt: number;
  retries: number;
};

export async function enqueue(
  item: Omit<OutboxItem, "id" | "createdAt" | "retries">
): Promise<OutboxItem> {
  if (typeof window === "undefined") {
    throw new Error("outbox.enqueue() must run on the client");
  }
  const q = ((await get(OUTBOX_KEY)) as OutboxItem[] | undefined) || [];
  const full: OutboxItem = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
    ...item,
  };
  q.push(full);
  await set(OUTBOX_KEY, q);
  return full;
}

export async function dequeue(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const q = ((await get(OUTBOX_KEY)) as OutboxItem[] | undefined) || [];
  await set(
    OUTBOX_KEY,
    q.filter((x) => x.id !== id)
  );
}

export async function markFailed(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const q = ((await get(OUTBOX_KEY)) as OutboxItem[] | undefined) || [];
  await set(
    OUTBOX_KEY,
    q.map((x) => (x.id === id ? { ...x, retries: x.retries + 1 } : x))
  );
}

export async function listOutbox(): Promise<OutboxItem[]> {
  if (typeof window === "undefined") return [];
  return ((await get(OUTBOX_KEY)) as OutboxItem[] | undefined) || [];
}

export async function clearOutbox(): Promise<void> {
  if (typeof window === "undefined") return;
  await set(OUTBOX_KEY, []);
}
