// Shared test helpers for the foundation tests (not a test file itself).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FIXTURES = path.join(ROOT, 'contract', 'fixtures');

export function fixtureJson(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));
}

// Runs fn(folder) with a fresh todo-test-* folder that is removed afterwards, pass or fail.
export function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-test-'));
  let result;
  try {
    result = fn(dir);
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw err;
  }
  if (result && typeof result.then === 'function') {
    return result.finally(() => fs.rmSync(dir, { recursive: true, force: true }));
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

export function tempFilesIn(dir) {
  return fs.readdirSync(dir).filter((n) => n.includes('.tmp-'));
}
