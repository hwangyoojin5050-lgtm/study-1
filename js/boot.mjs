/**
 * 앱 진입점 — import.meta.url 기준으로 app.js를 불러 옵니다.
 * (GitHub Pages /study-1 처럼 경로 끝에 / 가 없을 때 HTML 상대경로가 깨지는 문제 회피)
 */
const APP_URL = new URL("./app.js", import.meta.url);
APP_URL.searchParams.set("v", "24");

if (typeof window !== "undefined") {
  window.__studyBootOk = "module";
  try {
    window.dispatchEvent(new Event("study-app-module"));
  } catch (_) {}
}

try {
  await import(APP_URL.href);
} catch (err) {
  if (typeof window !== "undefined") {
    window.__studyBootImportError = err;
    try {
      window.dispatchEvent(new CustomEvent("study-app-import-failed", { detail: err }));
    } catch (_) {}
  }
  console.error("[boot.mjs]", err);
}
