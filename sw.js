/* Offline shell — index.html, manifest, icon. Google Fonts는 온라인일 때만 사용됩니다. */
const CACHE = "study-romance-shell-v21";

const OFFLINE_HTML = "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>너의 옆자리</title></head><body style=\"font-family:system-ui,sans-serif;padding:24px;line-height:1.5;max-width:420px;margin:0 auto;\"><h1 style=\"font-size:1.1rem;\">불러오기에 실패했어요</h1><p>네트워크가 불안정하거나 예전 캐시가 남았을 수 있어요.</p><p><button type=\"button\" onclick=\"location.reload()\" style=\"padding:10px 16px;border:0;border-radius:8px;background:#e8a6c8;font-weight:600;cursor:pointer;\">다시 시도</button></p></body></html>";

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
  if (p.endsWith("today-inanna.png") || p.endsWith("character-scene.png")) return true;
  return false;
}

async function offlineNavigationFallback() {
  const indexUrl = new URL("./index.html", self.location.href).href;
  const cached = await caches.match(indexUrl) || await caches.match("./index.html");
  if (cached) return cached;
  return new Response(OFFLINE_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
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
          .catch(() => {
            if (req.mode === "navigate" || req.destination === "document") {
              return offlineNavigationFallback();
            }
            return caches.match(req);
          })
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
