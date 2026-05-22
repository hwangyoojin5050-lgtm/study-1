import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = fs.readFileSync(path.join(root, "index.html"), "utf8");
const m = raw.match(/<style[^>]*>([\s\S]*)<\/style>/);
if (!m) throw new Error("style block not found");
const lines = m[1].replace(/^\n/, "").split(/\r?\n/);
const i2 = lines.findIndex((l) => l.includes("§2 Record"));
const i3 = lines.findIndex((l) => l.includes("§3 VN"));
const i4 = lines.findIndex((l) => l.includes("§4 Responsive"));
const util = `
/* layout utilities */
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.my-2 { margin-top: var(--space-2); margin-bottom: var(--space-2); }
.max-w-input { max-width: 320px; width: 100%; }
.max-w-input-sm { max-width: 100px; }
.lede-tight { line-height: 1.45; }
.block-label { display: block; margin-bottom: var(--space-1); }
.app-snackbar-actions { display: flex; gap: var(--space-1); flex-shrink: 0; }
`;
const dir = path.join(root, "styles");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "tokens.css"), lines.slice(0, i2).join("\n") + util);
fs.writeFileSync(
  path.join(dir, "components.css"),
  lines.slice(i2, i3).join("\n") + "\n" + lines.slice(i4).join("\n")
);
fs.writeFileSync(path.join(dir, "vn.css"), lines.slice(i3, i4).join("\n"));
console.log("Wrote styles/*.css", { i2, i3, i4 });

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(/\s*<!-- legacy inline block[\s\S]*?<\/style>\s*/i, "\n");
html = html.replace(/\s*<style[^>]*>[\s\S]*?<\/style>\s*/i, "\n");
if (!html.includes("./styles/tokens.css")) {
  html = html.replace(
    /(<link href="https:\/\/fonts\.googleapis\.com[^>]+>)\s*/,
    "$1\n  <link rel=\"stylesheet\" href=\"./styles/tokens.css\" />\n  <link rel=\"stylesheet\" href=\"./styles/components.css\" />\n  <link rel=\"stylesheet\" href=\"./styles/vn.css\" />\n"
  );
}
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("Updated index.html");
