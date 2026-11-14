// Runs every *.test.mjs under the test roots. Exits 1 when it finds none (AC-12).
// TEST_ROOTS (comma-separated, relative to the project root) overrides the roots; used to prove the zero-test case.
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roots = (process.env.TEST_ROOTS ?? 'cli/tests,web/tests,tests/integration')
  .split(',').map((s) => s.trim()).filter(Boolean);

function find(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...find(full));
    else if (entry.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

const files = roots.flatMap((r) => find(join(root, r))).sort();
console.log(`test files found: ${files.length}`);
for (const f of files) console.log(`  ${f.slice(root.length + 1)}`);

if (files.length === 0) {
  console.error('FAIL: no test files found. A run with zero tests is a failure.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
