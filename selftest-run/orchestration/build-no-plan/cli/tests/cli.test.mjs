import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseStore, writeStore } from '../todo.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(here, '..', 'todo.mjs');
const FIXTURES = path.resolve(here, '..', '..', 'contract', 'fixtures');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-cli-'));
}
function run(args, { input = '', env = {}, cwd } = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: 'utf8',
    cwd,
    env: { ...process.env, TODO_FILE: '', ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
function fixtureCopy(name) {
  const file = path.join(tempDir(), 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, name), file);
  return file;
}
const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('AC-01 add appends with next id, done false, prints Added', () => {
  const file = path.join(tempDir(), 'tasks.json');
  const r = run(['add', 'Buy milk', '--file', file]);
  assert.deepEqual([r.code, r.out, r.err], [0, 'Added #1: Buy milk\n', '']);
  const r2 = run(['add', '  Call Sam  ', '--file', file]);
  assert.equal(r2.out, 'Added #2: Call Sam\n');
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  assert.equal(data.version, 1);
  assert.equal(data.nextId, 3);
  assert.equal(data.tasks.length, 2);
  assert.deepEqual(Object.keys(data.tasks[0]), ['id', 'title', 'done', 'created']);
  assert.equal(data.tasks[1].title, 'Call Sam');
  assert.equal(data.tasks[1].done, false);
  assert.equal(new Date(data.tasks[0].created).toISOString(), data.tasks[0].created);
  assert.equal(raw, JSON.stringify(data, null, 2) + '\n');
});

test('AC-01 title length: 200 accepted, 201 refused, empty refused', () => {
  const file = path.join(tempDir(), 'tasks.json');
  assert.equal(run(['add', 'x'.repeat(200), '--file', file]).code, 0);
  const before = fs.readFileSync(file);
  const bad = run(['add', 'x'.repeat(201), '--file', file]);
  assert.equal(bad.code, 1);
  assert.notEqual(bad.err, '');
  assert.equal(bad.out, '');
  assert.equal(run(['add', '   ', '--file', file]).code, 1);
  assert.equal(run(['add', '--file', file]).code, 1);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-02 list formats, empty state, --json', () => {
  const file = fixtureCopy('valid-two.json');
  assert.equal(run(['list', '--file', file]).out, '[ ] #1 Buy milk\n[x] #2 Call Sam\n');
  const json = run(['list', '--json', '--file', file]);
  assert.equal(json.code, 0);
  assert.deepEqual(JSON.parse(json.out), load(path.join(FIXTURES, 'valid-two.json')).tasks);
  const missing = path.join(tempDir(), 'none.json');
  assert.equal(run(['list', '--file', missing]).out, 'No tasks.\n');
  assert.equal(fs.existsSync(missing), false);
  assert.deepEqual(JSON.parse(run(['list', '--json', '--file', missing]).out), []);
  assert.equal(run(['list', '--file', fixtureCopy('valid-empty.json')]).out, 'No tasks.\n');
});

test('AC-02 list is in id order even if the file is not', () => {
  const file = path.join(tempDir(), 'tasks.json');
  const c = '2026-11-13T09:00:00.000Z';
  fs.writeFileSync(file, JSON.stringify({ version: 1, nextId: 4, tasks: [
    { id: 3, title: 'c', done: false, created: c },
    { id: 1, title: 'a', done: true, created: c },
  ] }));
  assert.equal(run(['list', '--file', file]).out, '[x] #1 a\n[ ] #3 c\n');
});

test('AC-03 done sets done:true; already done; unknown id exits 2', () => {
  const file = fixtureCopy('valid-two.json');
  const r = run(['done', '1', '--file', file]);
  assert.deepEqual([r.code, r.out], [0, 'Done #1\n']);
  assert.equal(load(file).tasks[0].done, true);
  const again = run(['done', '1', '--file', file]);
  assert.deepEqual([again.code, again.out], [0, 'Already done #1\n']);
  const before = fs.readFileSync(file);
  const unknown = run(['done', '99', '--file', file]);
  assert.equal(unknown.code, 2);
  assert.equal(unknown.err, 'No task #99\n');
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-04 remove asks for yes; no leaves file byte-identical', () => {
  const file = fixtureCopy('valid-two.json');
  const before = fs.readFileSync(file);
  for (const input of ['no\n', '', 'y\n', 'YES please\n', '\n']) {
    const r = run(['remove', '1', '--file', file], { input });
    assert.equal(r.code, 0, `input ${JSON.stringify(input)}`);
    assert.match(r.out, /^Cancelled$/m);
    assert.ok(before.equals(fs.readFileSync(file)));
  }
  const yes = run(['remove', '1', '--file', file], { input: 'yes\n' });
  assert.equal(yes.code, 0);
  assert.match(yes.out, /yes/);
  assert.match(yes.out, /^Removed #1$/m);
  assert.deepEqual(load(file).tasks.map((t) => t.id), [2]);
});

test('AC-04 remove --yes skips the question; ids are never reused', () => {
  const file = fixtureCopy('valid-two.json');
  const r = run(['remove', '2', '--yes', '--file', file]);
  assert.deepEqual([r.code, r.out], [0, 'Removed #2\n']);
  assert.equal(load(file).nextId, 3);
  assert.equal(run(['add', 'New', '--file', file]).out, 'Added #3: New\n');
  assert.equal(run(['remove', '2', '--yes', '--file', file]).code, 2);
  assert.equal(run(['remove', '2', '--file', file], { input: 'yes\n' }).code, 2);
});

test('bad usage exits 1 with a stderr message', () => {
  const file = fixtureCopy('valid-two.json');
  const before = fs.readFileSync(file);
  for (const args of [[], ['frobnicate'], ['done'], ['done', 'abc'], ['done', '0'], ['done', '1.5'],
    ['done', '-1'], ['remove'], ['remove', 'x', '--yes'], ['list', '--bogus'], ['add']]) {
    const r = run([...args, '--file', file]);
    assert.equal(r.code, 1, args.join(' '));
    assert.notEqual(r.err, '', args.join(' '));
    assert.equal(r.out, '');
  }
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-05 fixtures: reader accepts valid and refuses invalid', () => {
  const expected = load(path.join(FIXTURES, 'expected.json'));
  const names = fs.readdirSync(FIXTURES).filter((n) => n !== 'expected.json');
  assert.deepEqual(names.sort(), Object.keys(expected).sort());
  for (const [name, verdict] of Object.entries(expected)) {
    const src = path.join(FIXTURES, name);
    const text = fs.readFileSync(src, 'utf8');
    if (verdict === 'valid') assert.doesNotThrow(() => parseStore(text), name);
    else assert.throws(() => parseStore(text), name);
    const r = run(['list', '--file', src]);
    assert.equal(r.code, verdict === 'valid' ? 0 : 3, name);
  }
});

test('AC-06 a bad data file is never overwritten; exit 3 with Cannot read', () => {
  for (const name of ['invalid-not-json.json', 'invalid-wrong-version.json']) {
    const file = fixtureCopy(name);
    const before = fs.readFileSync(file);
    for (const args of [['add', 'x'], ['list'], ['list', '--json'], ['done', '1'], ['remove', '1', '--yes']]) {
      const r = run([...args, '--file', file]);
      assert.equal(r.code, 3, args.join(' '));
      assert.ok(r.err.startsWith(`Cannot read ${file}: `), r.err);
      assert.equal(r.out, '');
      assert.ok(before.equals(fs.readFileSync(file)));
    }
    assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
  }
});

test('I-03 unknown fields are accepted on read and dropped on write', () => {
  const file = fixtureCopy('valid-unknown-fields.json');
  assert.equal(run(['done', '1', '--file', file]).code, 0);
  const data = load(file);
  assert.deepEqual(Object.keys(data), ['version', 'nextId', 'tasks']);
  assert.deepEqual(Object.keys(data.tasks[0]), ['id', 'title', 'done', 'created']);
});

test('settings: --file wins, then TODO_FILE, then ./tasks.json', () => {
  const dir = tempDir();
  const a = path.join(dir, 'a.json');
  const b = path.join(dir, 'b.json');
  run(['add', 'to a', '--file', a], { env: { TODO_FILE: b }, cwd: dir });
  assert.ok(fs.existsSync(a) && !fs.existsSync(b));
  run(['add', 'to b'], { env: { TODO_FILE: b }, cwd: dir });
  assert.ok(fs.existsSync(b));
  run(['add', 'to default'], { cwd: dir });
  assert.equal(load(path.join(dir, 'tasks.json')).tasks[0].title, 'to default');
});

test('AC-10 a failed write leaves the old file intact and no temp file behind', () => {
  const file = fixtureCopy('valid-two.json');
  const before = fs.readFileSync(file);
  const store = parseStore(before.toString('utf8'));
  store.tasks = [];
  const calls = [];
  const failingRename = {
    ...fs,
    mkdirSync: fs.mkdirSync,
    writeFileSync: (p, ...rest) => {
      calls.push(p);
      assert.notEqual(path.resolve(p), path.resolve(file), 'must not write the data file in place');
      assert.equal(path.dirname(path.resolve(p)), path.dirname(path.resolve(file)));
      return fs.writeFileSync(p, ...rest);
    },
    renameSync: () => {
      throw new Error('simulated rename failure');
    },
    unlinkSync: fs.unlinkSync,
  };
  assert.throws(() => writeStore(file, store, failingRename), /simulated rename failure/);
  assert.equal(calls.length, 1);
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);

  const failingWrite = { ...fs, writeFileSync: () => { throw new Error('disk full'); } };
  assert.throws(() => writeStore(file, store, failingWrite), /disk full/);
  assert.ok(before.equals(fs.readFileSync(file)));

  writeStore(file, store);
  assert.deepEqual(load(file), { version: 1, nextId: 3, tasks: [] });
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
});
