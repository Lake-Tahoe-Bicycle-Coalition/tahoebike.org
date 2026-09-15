/**
 * `pnpm content:parse [path/to/export.xml]`
 *
 * Parses the WordPress export and writes JSON snapshots to content/generated/
 * (gitignored) for inspection while porting pages:
 *   pages.json, attachments.json, nav-menu-items.json, layouts.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WP_EXPORT_PATH, parseWpExport } from "../lib/wp-export";

const xmlPath = process.argv[2] ?? WP_EXPORT_PATH;
const outDir = join("content", "generated");

const data = parseWpExport(xmlPath);
mkdirSync(outDir, { recursive: true });

const outputs: [string, unknown][] = [
  ["pages.json", data.pages],
  ["attachments.json", data.attachments],
  ["nav-menu-items.json", data.navMenuItems],
  ["layouts.json", data.layouts],
];
for (const [file, value] of outputs) {
  writeFileSync(join(outDir, file), JSON.stringify(value, null, 2) + "\n");
}

const published = data.pages.filter((p) => p.status === "publish");
console.log(`Parsed ${xmlPath}`);
console.log(`  site: ${data.siteUrl}`);
console.log(`  pages: ${data.pages.length} (${published.length} published)`);
console.log(`  attachments: ${data.attachments.length}`);
console.log(`  nav menu items: ${data.navMenuItems.length}`);
console.log(`  layouts: ${data.layouts.length}`);
console.log(`Wrote ${outputs.map(([file]) => join(outDir, file)).join(", ")}`);
