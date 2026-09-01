import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry === "route.ts") {
      let content = readFileSync(full, "utf8");
      let changed = false;

      if (content.includes('parsed.error.errors[0].message')) {
        content = content
          .replace(
            /import \{ Errors \} from "@\/lib\/errors";/g,
            'import { Errors, zodMessage } from "@/lib/errors";'
          )
          .replace(/parsed\.error\.errors\[0\]\.message/g, 'zodMessage(parsed.error)');
        changed = true;
      }

      if (changed) {
        writeFileSync(full, content, "utf8");
        console.log("✅ Fixed:", full.replace(process.cwd(), ""));
      }
    }
  }
}

walk("app/api");
console.log("Done.");
