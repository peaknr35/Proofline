// AC-15: the runner fails on zero test files and runs the ones it finds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, withTempDir } from './helpers.mjs';

const RUNNER = path.join(ROOT, 'scripts', 'run-tests.mjs');
// A child of `node --test` inherits NODE_TEST_CONTEXT and would report to the parent, not stdout.
const ENV = { ...process.env };
delete ENV.NODE_TEST_CONTEXT;
const OPTS = { encoding: 'utf8', env: ENV };

test('AC-15: --dir with no test files exits 1 with the message', () => withTempDir((dir) => {
  fs.mkdirSync(path.join(dir, 'sub'));
  fs.writeFileSync(path.join(dir, 'sub', 'not-a-test.mjs'), '');
  const r = spawnSync(process.execPath, [RUNNER, '--dir', dir], OPTS);
  assert.equal(r.status, 1);
  assert.equal(r.stderr, 'run-tests: no test files found\n');
}));

test('AC-15: nested test files are found and their result is the exit code', () => withTempDir((dir) => {
  fs.mkdirSync(path.join(dir, 'a', 'b'), { recursive: true });
  const file = path.join(dir, 'a', 'b', 'x.test.mjs');
  fs.writeFileSync(file, "import { test } from 'node:test';\ntest('passes', () => {});\n");
  const ok = spawnSync(process.execPath, [RUNNER, '--dir', dir], OPTS);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /pass 1/);
  fs.writeFileSync(file, "import { test } from 'node:test';\ntest('fails', () => { throw new Error('no'); });\n");
  const bad = spawnSync(process.execPath, [RUNNER, '--dir', dir], OPTS);
  assert.notEqual(bad.status, 0);
}));
