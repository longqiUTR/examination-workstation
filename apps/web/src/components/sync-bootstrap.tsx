"use client";
import { useEffect } from "react";
import { flushOutbox, type Sender } from "@/lib/sync";
import { submitAnswer } from "@/server/actions/attempt";
import { saveNote } from "@/server/actions/wrong";
import type { OutboxItem } from "@/lib/outbox";

/**
 * 挂在根 layout：联网时（以及首次挂载时）自动 flush outbox。
 * 写操作（答题、笔记）失败 → 入队 → 下次联网重试。
 */
export function SyncBootstrap() {
  useEffect(() => {
    const sender: Sender = async (item: OutboxItem) => {
      if (item.type === "attempt") {
        await submitAnswer(item.payload as Parameters<typeof submitAnswer>[0]);
      } else if (item.type === "note") {
        const p = item.payload as { questionId: string; note: string };
        await saveNote(p.questionId, p.note);
      } else {
        // 未知类型直接忽略（不算失败）
      }
    };

    function onOnline() {
      flushOutbox(sender).catch((e) => console.warn("flushOutbox failed", e));
    }

    window.addEventListener("online", onOnline);
    // 首次挂载也跑一次（即便已在线；处理上次离线堆积）
    onOnline();

    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
