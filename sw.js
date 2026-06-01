// Service worker for the Scream Trainer PWA.
// Strategy: stale-while-revalidate. Cached assets serve instantly (works
// offline in the shower with no signal); a fresh copy is fetched in the
// background and used on the next open. Bump CACHE to force-evict on deploy.
const CACHE = "scream-v3";
const ASSETS = [
  "./vocal.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Navigations (e.g. vocal.html#tab:scream) resolve to vocal.html.
  const url = new URL(req.url);
  const isShell = req.mode === "navigate" || url.pathname.endsWith("/vocal.html");
  const key = isShell ? "./vocal.html" : req;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(key).then((cached) => {
        const network = fetch(req)
          .then((resp) => {
            if (resp && resp.ok) cache.put(key, resp.clone());
            return resp;
          })
          .catch(() => cached); // offline: fall back to cache
        return cached || network;
      })
    )
  );
});
