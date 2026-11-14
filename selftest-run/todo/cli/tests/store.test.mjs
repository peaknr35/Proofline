// Store tests: the reader against every golden fixture (AC-05, CLI reader) and the writer (AC-10).
import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  StoreError, loadStore, parseStore, saveStore, serialize, resolveFile, validate,
} from '../store.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(here, '../../contract/fixtures');
const expected = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'expected.json'), 'utf8'));

// Every temp folder a test creates is removed when that test finishes, pass or fail.
const createdDirs = [];
function removeCreatedDirs() {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      /* a folder that cannot be removed must not turn a passing test into a failing one */
    }
  }
}
afterEach(removeCreatedDirs);
after(removeCreatedDirs);
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-store-'));
  createdDirs.push(dir);
  return dir;
}
const task = (id, extra = {}) => ({ id, title: `Task ${id}`, done: false, created: '2026-11-13T09:00:00.000Z', ...extra });

// ---- AC-05: every fixture, exactly as expected.json says ----

test('AC-05 expected.json lists every fixture file and nothing else', () => {
  const onDisk = fs.readdirSync(fixturesDir).filter((f) => f !== 'expected.json').sort();
  assert.deepEqual(Object.keys(expected).sort(), onDisk);
  assert.ok(onDisk.length > 0);
});

for (const [name, verdict] of Object.entries(expected)) {
  test(`AC-05 reader verdict on ${name} is ${verdict}`, () => {
    const file = path.join(fixturesDir, name);
    if (verdict === 'valid') {
      const store = loadStore(file);
      assert.equal(store.version, 1);
      assert.ok(Array.isArray(store.tasks));
    } else if (verdict === 'invalid') {
      assert.throws(() => loadStore(file), StoreError);
    } else {
      assert.fail(`unknown verdict "${verdict}" in expected.json`);
    }
  });
}

// ---- section 6 rules one by one (own data, not fixtures) ----

test('reader: a missing file is an empty list with nextId 1 and is not created by reading', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  assert.deepEqual(loadStore(file), { version: 1, nextId: 1, tasks: [] });
  assert.equal(fs.existsSync(file), false);
});

test('reader: refuses each broken rule of section 6', () => {
  const bad = [
    ['top level array', []],
    ['top level null', null],
    ['version as text', { version: '1', nextId: 1, tasks: [] }],
    ['version missing', { nextId: 1, tasks: [] }],
    ['nextId 0', { version: 1, nextId: 0, tasks: [] }],
    ['nextId fraction', { version: 1, nextId: 1.5, tasks: [] }],
    ['nextId text', { version: 1, nextId: '2', tasks: [] }],
    ['nextId missing', { version: 1, tasks: [] }],
    ['nextId equal to an id', { version: 1, nextId: 1, tasks: [task(1)] }],
    ['tasks missing', { version: 1, nextId: 1 }],
    ['task not an object', { version: 1, nextId: 2, tasks: ['x'] }],
    ['id 0', { version: 1, nextId: 2, tasks: [task(0)] }],
    ['id negative', { version: 1, nextId: 2, tasks: [task(-1)] }],
    ['id fraction', { version: 1, nextId: 3, tasks: [task(1.5)] }],
    ['id text', { version: 1, nextId: 3, tasks: [task('1')] }],
    ['duplicate id', { version: 1, nextId: 3, tasks: [task(1), task(1)] }],
    ['title missing', { version: 1, nextId: 2, tasks: [{ id: 1, done: false, created: 'x' }] }],
    ['title a number', { version: 1, nextId: 2, tasks: [task(1, { title: 5 })] }],
    ['title empty', { version: 1, nextId: 2, tasks: [task(1, { title: '' })] }],
    ['title only spaces', { version: 1, nextId: 2, tasks: [task(1, { title: '   ' })] }],
    ['title 201 characters', { version: 1, nextId: 2, tasks: [task(1, { title: 'a'.repeat(201) })] }],
    ['done missing', { version: 1, nextId: 2, tasks: [{ id: 1, title: 'x', created: 'x' }] }],
    ['done as text', { version: 1, nextId: 2, tasks: [task(1, { done: 'true' })] }],
    ['done as number', { version: 1, nextId: 2, tasks: [task(1, { done: 1 })] }],
    ['completed instead of done', { version: 1, nextId: 2, tasks: [{ id: 1, title: 'x', completed: false, created: 'x' }] }],
    ['created missing', { version: 1, nextId: 2, tasks: [{ id: 1, title: 'x', done: false }] }],
    ['created a number', { version: 1, nextId: 2, tasks: [task(1, { created: 5 })] }],
  ];
  for (const [label, data] of bad) {
    assert.throws(() => validate(data), StoreError, label);
    assert.throws(() => parseStore(JSON.stringify(data)), StoreError, label);
  }
});

test('reader: accepts the edges of section 6', () => {
  const ok = [
    { version: 1, nextId: 1, tasks: [] },
    { version: 1, nextId: 99, tasks: [] },
    { version: 1, nextId: 2, tasks: [task(1, { title: 'a'.repeat(200) })] },
    { version: 1, nextId: 2, tasks: [task(1, { title: `  ${'a'.repeat(200)}  ` })] }, // 200 after trimming
    { version: 1, nextId: 2, tasks: [task(1, { created: 'any string at all' })] }, // I-08
    { version: 1, nextId: 2, tasks: [task(1, { created: '' })] },
  ];
  for (const data of ok) assert.doesNotThrow(() => validate(data), JSON.stringify(data).slice(0, 60));
});

test('reader: unknown fields are accepted and dropped; tasks come back in id order (I-03)', () => {
  const store = validate({
    version: 1, nextId: 9, note: 'x',
    tasks: [task(5, { priority: 'high' }), task(2)],
  });
  assert.deepEqual(Object.keys(store), ['version', 'nextId', 'tasks']);
  assert.deepEqual(store.tasks.map((t) => t.id), [2, 5]);
  assert.deepEqual(Object.keys(store.tasks[1]), ['id', 'title', 'done', 'created']);
});

test('reader: empty text and non-JSON text are refused', () => {
  assert.throws(() => parseStore(''), StoreError);
  assert.throws(() => parseStore('hello'), StoreError);
});

test('reader: a folder in place of the data file is refused, not treated as missing', () => {
  const dir = tempDir();
  assert.throws(() => loadStore(dir), StoreError);
});

// ---- settings (section 5) ----

test('settings: --file wins, then TODO_FILE, then ./tasks.json', () => {
  assert.equal(resolveFile('a.json', { TODO_FILE: 'b.json' }), 'a.json');
  assert.equal(resolveFile(undefined, { TODO_FILE: 'b.json' }), 'b.json');
  assert.equal(resolveFile(undefined, {}), './tasks.json');
  assert.equal(resolveFile(undefined, { TODO_FILE: '' }), './tasks.json');
});

// ---- writer: format and AC-10 ----

test('writer: two-space JSON, trailing newline, UTF-8, known fields only', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  saveStore(file, { version: 1, nextId: 3, extra: 1, tasks: [task(2, { title: 'Café ☕', junk: 1 }), task(1)] });
  const text = fs.readFileSync(file, 'utf8');
  const want = {
    version: 1,
    nextId: 3,
    tasks: [
      { id: 1, title: 'Task 1', done: false, created: '2026-11-13T09:00:00.000Z' },
      { id: 2, title: 'Café ☕', done: false, created: '2026-11-13T09:00:00.000Z' },
    ],
  };
  assert.equal(text, JSON.stringify(want, null, 2) + '\n');
  assert.ok(text.startsWith('{\n  "version": 1,\n  "nextId": 3,\n  "tasks": ['));
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json'], 'no temp file left behind');
});

test('writer: refuses to write an invalid store and leaves the old file alone', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  saveStore(file, { version: 1, nextId: 2, tasks: [task(1)] });
  const before = fs.readFileSync(file);
  assert.throws(() => saveStore(file, { version: 1, nextId: 1, tasks: [task(1)] }), StoreError);
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);
});

test('AC-10 writer saves a temp file in the same folder, then renames it over the data file', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  saveStore(file, { version: 1, nextId: 2, tasks: [task(1)] });
  const calls = [];
  const spy = {
    writeFileSync(p, data, opts) {
      calls.push(['write', p]);
      return fs.writeFileSync(p, data, opts);
    },
    renameSync(from, to) {
      // at the moment of the rename the old file is still whole and the new text is complete in the temp file
      assert.equal(loadStore(to).tasks.length, 1);
      assert.equal(parseStore(fs.readFileSync(from, 'utf8')).tasks.length, 2);
      calls.push(['rename', from, to]);
      return fs.renameSync(from, to);
    },
  };
  saveStore(file, { version: 1, nextId: 3, tasks: [task(1), task(2)] }, { fsImpl: spy });
  assert.equal(calls.length, 2);
  const [w, r] = calls;
  assert.equal(w[0], 'write');
  assert.notEqual(path.resolve(w[1]), path.resolve(file), 'the data file itself is never opened for writing');
  assert.equal(path.dirname(path.resolve(w[1])), path.resolve(dir), 'temp file is in the same folder');
  assert.deepEqual(r, ['rename', w[1], file]);
  assert.equal(loadStore(file).tasks.length, 2);
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);
});

test('AC-10 a write that fails at the rename leaves the old file byte-identical', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  saveStore(file, { version: 1, nextId: 2, tasks: [task(1)] });
  const before = fs.readFileSync(file);
  const failing = {
    writeFileSync: fs.writeFileSync,
    renameSync() {
      throw Object.assign(new Error('simulated crash'), { code: 'EIO' });
    },
  };
  assert.throws(
    () => saveStore(file, { version: 1, nextId: 3, tasks: [task(1), task(2)] }, { fsImpl: failing }),
    (e) => e instanceof StoreError && e.kind === 'write',
  );
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json'], 'temp file cleaned up');
});

test('AC-10 a write that fails half-way through the temp file leaves the old file byte-identical', () => {
  const dir = tempDir();
  const file = path.join(dir, 'tasks.json');
  saveStore(file, { version: 1, nextId: 2, tasks: [task(1)] });
  const before = fs.readFileSync(file);
  const failing = {
    writeFileSync(p, data, opts) {
      fs.writeFileSync(p, String(data).slice(0, 10), opts); // a torn write
      throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    },
    renameSync: fs.renameSync,
  };
  assert.throws(
    () => saveStore(file, { version: 1, nextId: 3, tasks: [task(1), task(2)] }, { fsImpl: failing }),
    StoreError,
  );
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);
});

test('AC-10 a real failed write (the folder does not exist) throws and creates nothing', () => {
  const dir = tempDir();
  const file = path.join(dir, 'missing-folder', 'tasks.json');
  assert.throws(() => saveStore(file, { version: 1, nextId: 1, tasks: [] }), StoreError);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('writer: every valid fixture survives a read-then-write and reads back the same (CLI side of AC-09)', () => {
  for (const [name, verdict] of Object.entries(expected)) {
    if (verdict !== 'valid') continue;
    const dir = tempDir();
    const file = path.join(dir, 'tasks.json');
    const store = loadStore(path.join(fixturesDir, name));
    saveStore(file, store);
    assert.equal(fs.readFileSync(file, 'utf8'), serialize(store), name);
    assert.deepEqual(loadStore(file), store, name);
  }
});
