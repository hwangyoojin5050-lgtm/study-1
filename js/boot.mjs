/**
 * App entrypoint that resolves app.js from import.meta.url.
 * Prevents relative-path issues on GitHub Pages subpaths.
 */
const APP_URL = new URL("./app.js", import.meta.url);
APP_URL.searchParams.set("v", "25");

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

