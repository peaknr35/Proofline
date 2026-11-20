// Test runner (SPEC 7.3): finds *.test.mjs recursively under tests/ (or --dir), fails on none.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let dir = path.join(root, 'tests');
if (args.length === 2 && args[0] === '--dir') {
  dir = path.resolve(args[1]);
} else if (args.length !== 0) {
  process.stderr.write('run-tests: usage: node scripts/run-tests.mjs [--dir <folder>]\n');
  process.exit(2);
}

function find(folder) {
  let entries;
  try {
    entries = fs.readdirSync(folder, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    const full = path.join(folder, e.name);
    if (e.isDirectory()) out.push(...find(full));
    else if (e.isFile() && e.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

const files = find(dir).sort();
if (files.length === 0) {
  process.stderr.write('run-tests: no test files found\n');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
