import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const indexPath = path.join(root, "index.html");
const raw = fs.readFileSync(indexPath, "utf8");
const startMark = "  <script>\n";
const start = raw.indexOf(startMark);
const end = raw.lastIndexOf("\n  </script>");
if (start < 0 || end < 0 || end <= start) throw new Error("script block not found");
let body = raw.slice(start + startMark.length, end);

body = body.replace(/^    const STORAGE_KEY = .*\r?\n/m, "");
body = body.replace(/^    const APP_DISPLAY_NAME = .*\r?\n/m, "");
body = body.replace(/^    const BACKUP_SCHEMA_VERSION = .*\r?\n/m, "");
body = body.replace(
  /    function sanitizeMemoryMoment\(m\) \{[\s\S]*?\r?\n    \}\r?\n\r?\n    function renderMemoryDiaryList/,
  "    function renderMemoryDiaryList"
);
body = body.replace(
  /    function sanitizeRecordRow\(r\) \{[\s\S]*?\r?\n    \}\r?\n\r?\n    function hydrateStateFromPlainObject/,
  "    function hydrateStateFromPlainObject"
);

const header = `import {
  STORAGE_KEY,
  APP_DISPLAY_NAME,
  PERSIST_SCHEMA_VERSION,
  BACKUP_SCHEMA_VERSION,
  sanitizeRecordRow,
  sanitizeMemoryMoment,
  migratePersistedPayload
} from "./state.js";

`;

const outPath = path.join(root, "js", "app.js");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + body, "utf8");
console.log("Wrote", outPath, "bytes", fs.statSync(outPath).size);
