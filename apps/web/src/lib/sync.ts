/**
 * Sync 引擎：遍历 outbox，逐条调用 send 回调；成功后 dequeue，失败则 +retries。
 * send 由调用方注入（client 端，把 OutboxItem 映射到 server action）。
 */
import { listOutbox, dequeue, markFailed, type OutboxItem } from "./outbox";

export type Sender = (item: OutboxItem) => Promise<void>;

let flushing: Promise<void> | null = null;

export async function flushOutbox(send: Sender): Promise<void> {
  // 防并发：上一次还没跑完就跳过
  if (flushing) return flushing;
  flushing = (async () => {
    const items = await listOutbox();
    for (const item of items) {
      try {
        await send(item);
        await dequeue(item.id);
      } catch (e) {
        // 单条失败不影响其他；只 +retries
        // eslint-disable-next-line no-console
        console.warn("sync: item failed", item, e);
        await markFailed(item.id);
      }
    }
  })();
  try {
    await flushing;
  } finally {
    flushing = null;
  }
}
