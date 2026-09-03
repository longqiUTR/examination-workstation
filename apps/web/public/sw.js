/* Service Worker - 考公工作台
 * 策略：app shell 预缓存 + 运行时 stale-while-fallback-to-cache
 * 仅缓存 GET 请求；非 GET 直接放行（写操作交给 outbox 同步）。
 */
const CACHE = "exam-v1";
const SHELL = [
  "/",
  "/questions",
  "/practice/new",
  "/mistakes",
  "/stats",
  "/plans",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  // 立即激活新 SW（避免旧 cache 占用）
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;
      return fetch(e.request)
        .then((res) => {
          // 只缓存同源 + ok 响应
          if (
            res.ok &&
            new URL(e.request.url).origin === self.location.origin
          ) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match("/"));
    })
  );
});
