const CACHE_NAME = "wearshare-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/config.js",
  "/app.js",
  "/wearshare.js",
  "/live.js",
  "/manifest.webmanifest",
  "/icons/wearshare-180.png",
  "/icons/wearshare-192.png",
  "/icons/wearshare-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key.startsWith("wearshare-shell-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/index.html"))
        || new Response("WearShare is offline.", { status: 503, headers: { "Content-Type": "text/plain" } }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
