/* Offline shell — index.html, manifest, icon. Google Fonts는 온라인일 때만 사용됩니다. */
const CACHE = "study-romance-shell-v19";
const CORE = [
  "./index.html",
  "./styles/tokens.css",
  "./styles/components.css",
  "./styles/vn.css",
  "./js/app.js",
  "./js/badge-icons.js",
  "./js/state.js",
  "./manifest.webmanifest",
  "./assets/character-scene.png",
  "./assets/today-inanna.png",
  "./assets/icon.svg",
  "./assets/romance-narrative.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(CORE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function shouldNetworkFirst(req, url) {
  if (req.mode === "navigate" || req.destination === "document") return true;
  const p = url.pathname.toLowerCase();
  if (p.endsWith(".html") || p.endsWith(".webmanifest")) return true;
  if (p.endsWith(".js") && p.includes("/js/")) return true;
  if (p.endsWith("romance-narrative.json")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const fresh = shouldNetworkFirst(req, url);

  event.respondWith(
    fresh
      ? fetch(req)
          .then((res) => {
            if (res && res.ok && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => {
                try {
                  cache.put(req, copy);
                } catch (_) {}
              });
            }
            return res;
          })
          .catch(() => caches.match(req))
      : caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (!res || res.status !== 200 || res.type !== "basic") return res;
            const copy = res.clone();
            caches.open(CACHE).then((cache) => {
              try {
                cache.put(req, copy);
              } catch (_) {}
            });
            return res;
          });
        })
  );
});
