/**
 * 客户端 IndexedDB 封装（基于 idb-keyval）
 *
 * - 缓存最近刷过的题目（最多 MAX_RECENT 条），便于离线读题
 * - 仅在客户端运行；server actions / DB 不能用
 */
import { get, set } from "idb-keyval";

const RECENT_KEY = "recent-questions";
const MAX_RECENT = 50;

export type CachedQuestion = {
  id: string;
  module: string;
  type: string;
  stem: string;
  options: { key: string; value: string }[] | null;
  difficulty: number;
  answer?: string;
  analysis?: string | null;
};

export async function cacheQuestion(q: CachedQuestion): Promise<void> {
  if (typeof window === "undefined") return;
  const recent = ((await get(RECENT_KEY)) as CachedQuestion[] | undefined) || [];
  const filtered = recent.filter((x) => x.id !== q.id);
  filtered.unshift(q);
  await set(RECENT_KEY, filtered.slice(0, MAX_RECENT));
}

export async function getRecentQuestions(): Promise<CachedQuestion[]> {
  if (typeof window === "undefined") return [];
  return ((await get(RECENT_KEY)) as CachedQuestion[] | undefined) || [];
}

export async function getCachedQuestion(
  id: string
): Promise<CachedQuestion | null> {
  if (typeof window === "undefined") return null;
  const recent = ((await get(RECENT_KEY)) as CachedQuestion[] | undefined) || [];
  return recent.find((q) => q.id === id) || null;
}

export async function isOfflineMode(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return !navigator.onLine;
}
