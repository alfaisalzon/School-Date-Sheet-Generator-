const CACHE_NAME = "school-date-sheet-v1";

const LOCAL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

const EXTERNAL_FILES = [
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdn.jsdelivr.net/gh/tariq-abdullah/urdu-web-font-CDN/JameelNooriNastaleeq.woff"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(LOCAL_FILES);

    for (const url of EXTERNAL_FILES) {
      try {
        const response = await fetch(url);

        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        // Agar external file abhi load na ho,
        // tab bhi app install hone ki koshish karegi.
      }
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys.map(key => {
        if (
          key.startsWith("school-date-sheet-") &&
          key !== CACHE_NAME
        ) {
          return caches.delete(key);
        }
      })
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  const isLocal = url.origin === self.location.origin;
  const isExternal = EXTERNAL_FILES.includes(request.url);

  if (!isLocal && !isExternal) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const offlinePage = await cache.match("./index.html");
        if (offlinePage) return offlinePage;
      }

      throw error;
    }
  })());
});
