// Runs every *.test.mjs under cli/tests, web/tests and tests/ with the Node test runner.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collect(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

const files = ['cli/tests', 'web/tests', 'tests'].flatMap((d) => collect(path.join(root, d))).sort();
if (files.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
