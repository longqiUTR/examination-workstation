/**
 * Question cache: high-level wrapper for caching questions when fetched.
 * 在客户端组件中 fetch 题目后调用 cacheQuestion() 写入 IndexedDB。
 */
import {
  cacheQuestion as _cache,
  getRecentQuestions as _recent,
  getCachedQuestion as _one,
  isOfflineMode as _offline,
  type CachedQuestion,
} from "./offline-db";

export type { CachedQuestion };

export async function cacheQuestion(q: CachedQuestion) {
  return _cache(q);
}

export async function getRecentQuestions() {
  return _recent();
}

export async function getCachedQuestion(id: string) {
  return _one(id);
}

export async function isOfflineMode() {
  return _offline();
}
