import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, "..", "index.html");
let c = fs.readFileSync(p, "utf8");
const start = c.indexOf("  <script>\n");
const end = c.lastIndexOf("  </script>");
if (start < 0 || end < 0) throw new Error("script");
const after = c.slice(end + "  </script>".length);
c = c.slice(0, start) + '  <script type="module" src="./js/app.js"></script>' + after;
fs.writeFileSync(p, c);
console.log("index.html now loads js/app.js as module");
