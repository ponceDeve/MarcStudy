import { execSync } from "node:child_process";
import { cpSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cmd, cwd = ".") => execSync(cmd, { cwd, stdio: "inherit" });

const remote = execSync("git remote get-url origin", { encoding: "utf8" }).trim();

run("npm run build");

const tmp = mkdtempSync(join(tmpdir(), "ghp-"));
try {
  cpSync("dist", tmp, { recursive: true });
  writeFileSync(join(tmp, ".nojekyll"), "");

  run("git init -b gh-pages", tmp);
  run("git add -A", tmp);
  run('git commit -m "Deploy"', tmp);
  run(`git push -f "${remote}" gh-pages`, tmp);

  console.log("\n✅ Desplegado en la rama gh-pages");
} finally {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 3 });
}