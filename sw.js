// Taskbar Cosmos おでかけページのサービスワーカー: 一度開いたページのファイルを覚えておき、電波がなくても開けるようにする。
// VERSION は make_site.py が、ページの中身から作る (中身が変わると、新しいものに入れかわる)。
const VERSION = "7c3fc1fe3476";
const CACHE = "tcosmos-outing-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("tcosmos-outing-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 覚えているものをすぐ出す (電波がなくても開ける)。電波があれば裏で新しいものを取ってきて、次に開いたときに使う
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./index.html") : null);
    const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await fresh) || new Response("offline", { status: 503 });
  }));
});
