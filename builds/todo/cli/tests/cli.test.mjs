// Command tests: the real cli/todo.mjs is started as a process against a fresh temp file each time.
import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TODO = path.resolve(here, '../todo.mjs');
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-cli-'));
  createdDirs.push(dir);
  return dir;
}
function tempFile() {
  return path.join(tempDir(), 'tasks.json');
}
/** Runs the CLI. `input` is what stdin delivers ('' = closed, empty stdin). */
function run(args, { input = '', env = {}, cwd } = {}) {
  const childEnv = { ...process.env, ...env };
  if (!('TODO_FILE' in env)) delete childEnv.TODO_FILE;
  const r = spawnSync(process.execPath, [TODO, ...args], { input, env: childEnv, cwd, encoding: 'utf8', timeout: 20000 });
  assert.equal(r.error, undefined, `process did not run cleanly: ${r.error}`);
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const copyFixture = (name) => {
  const file = tempFile();
  fs.copyFileSync(path.join(fixturesDir, name), file);
  return file;
};

// ---------------- AC-01 add ----------------

test('AC-01 add creates the file, appends with the next id, done:false, and prints Added #<id>: <title>', () => {
  const file = tempFile();
  const t0 = Date.now();
  const a = run(['add', 'Buy milk', '--file', file]);
  assert.deepEqual([a.code, a.out, a.err], [0, 'Added #1: Buy milk\n', '']);
  const b = run(['add', 'Call Sam', '--file', file]);
  assert.deepEqual([b.code, b.out, b.err], [0, 'Added #2: Call Sam\n', '']);

  const data = read(file);
  assert.deepEqual(Object.keys(data), ['version', 'nextId', 'tasks']);
  assert.equal(data.version, 1);
  assert.equal(data.nextId, 3);
  assert.deepEqual(data.tasks.map((t) => [t.id, t.title, t.done]), [[1, 'Buy milk', false], [2, 'Call Sam', false]]);
  for (const t of data.tasks) {
    assert.deepEqual(Object.keys(t), ['id', 'title', 'done', 'created']);
    assert.match(t.created, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(new Date(t.created).toISOString(), t.created);
    assert.ok(Date.parse(t.created) >= t0 - 1000 && Date.parse(t.created) <= Date.now() + 1000);
  }
  // section 5: two-space JSON with a trailing newline
  assert.equal(fs.readFileSync(file, 'utf8'), JSON.stringify(data, null, 2) + '\n');
});

test('AC-01 known-bad: a title of 201 characters is refused with exit 1 and nothing is written', () => {
  const file = tempFile();
  const r = run(['add', 'a'.repeat(201), '--file', file]);
  assert.equal(r.code, 1);
  assert.equal(r.out, '');
  assert.notEqual(r.err, '');
  assert.equal(fs.existsSync(file), false);
  // and on an existing file it changes nothing
  const file2 = copyFixture('valid-two.json');
  const before = fs.readFileSync(file2);
  assert.equal(run(['add', 'a'.repeat(201), '--file', file2]).code, 1);
  assert.ok(before.equals(fs.readFileSync(file2)));
});

test('AC-01 a title of exactly 200 characters is accepted', () => {
  const file = tempFile();
  const title = 'b'.repeat(200);
  const r = run(['add', title, '--file', file]);
  assert.equal(r.code, 0);
  assert.equal(r.out, `Added #1: ${title}\n`);
  assert.equal(read(file).tasks[0].title, title);
});

test('AC-01 / I-07 the title is trimmed before the length check and before saving', () => {
  const file = tempFile();
  const r = run(['add', '   Buy milk  ', '--file', file]);
  assert.deepEqual([r.code, r.out], [0, 'Added #1: Buy milk\n']);
  assert.equal(read(file).tasks[0].title, 'Buy milk');
  const padded = `  ${'c'.repeat(200)}  `; // 204 raw, 200 trimmed
  assert.equal(run(['add', padded, '--file', file]).code, 0);
  assert.equal(read(file).tasks[1].title, 'c'.repeat(200));
});

test('AC-01 an empty, blank or missing title is refused with exit 1', () => {
  const file = tempFile();
  for (const args of [['add'], ['add', ''], ['add', '   ']]) {
    const r = run([...args, '--file', file]);
    assert.equal(r.code, 1, JSON.stringify(args));
    assert.equal(r.out, '');
    assert.notEqual(r.err, '');
  }
  assert.equal(fs.existsSync(file), false);
});

test('AC-01 / I-02 ids are never reused after a remove; nextId only grows', () => {
  const file = tempFile();
  run(['add', 'one', '--file', file]);
  run(['add', 'two', '--file', file]);
  assert.equal(run(['remove', '2', '--yes', '--file', file]).code, 0);
  assert.equal(read(file).nextId, 3);
  const r = run(['add', 'three', '--file', file]);
  assert.equal(r.out, 'Added #3: three\n');
  assert.deepEqual(read(file).tasks.map((t) => t.id), [1, 3]);
  assert.equal(read(file).nextId, 4);
});

test('AC-01 add on valid-gap-ids.json uses nextId (6), not the count or the highest id + 1', () => {
  const file = copyFixture('valid-gap-ids.json');
  const r = run(['add', 'Next', '--file', file]);
  assert.equal(r.out, 'Added #6: Next\n');
  assert.deepEqual(read(file).tasks.map((t) => t.id), [2, 5, 6]);
  assert.equal(read(file).nextId, 7);
});

test('AC-01 a markup title is stored as plain text, unchanged', () => {
  const file = tempFile();
  const title = '<script>alert(1)</script> & "quotes"';
  const r = run(['add', title, '--file', file]);
  assert.equal(r.out, `Added #1: ${title}\n`);
  assert.equal(read(file).tasks[0].title, title);
});

// ---------------- AC-02 list ----------------

test('AC-02 list prints one line per task in id order with [ ] and [x]', () => {
  const file = copyFixture('valid-two.json');
  const r = run(['list', '--file', file]);
  assert.deepEqual([r.code, r.out, r.err], [0, '[ ] #1 Buy milk\n[x] #2 Call Sam\n', '']);
});

test('AC-02 list with no tasks prints No tasks. (empty file and missing file) and does not create the file', () => {
  const empty = copyFixture('valid-empty.json');
  assert.deepEqual(run(['list', '--file', empty]), { code: 0, out: 'No tasks.\n', err: '' });
  const missing = tempFile();
  assert.deepEqual(run(['list', '--file', missing]), { code: 0, out: 'No tasks.\n', err: '' });
  assert.equal(fs.existsSync(missing), false);
});

test('AC-02 list sorts by id even when the file is out of order, and never changes the file', () => {
  const file = tempFile();
  const c = '2026-11-13T09:00:00.000Z';
  fs.writeFileSync(file, JSON.stringify({
    version: 1, nextId: 8,
    tasks: [{ id: 7, title: 'seven', done: true, created: c }, { id: 3, title: 'three', done: false, created: c }],
  }));
  const before = fs.readFileSync(file);
  assert.equal(run(['list', '--file', file]).out, '[ ] #3 three\n[x] #7 seven\n');
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-02 list --json prints the tasks array', () => {
  const file = copyFixture('valid-two.json');
  const r = run(['list', '--json', '--file', file]);
  assert.equal(r.code, 0);
  assert.deepEqual(JSON.parse(r.out), read(path.join(fixturesDir, 'valid-two.json')).tasks);
  const e = run(['list', '--json', '--file', copyFixture('valid-empty.json')]);
  assert.deepEqual(JSON.parse(e.out), []);
  const m = run(['list', '--json', '--file', tempFile()]);
  assert.deepEqual([m.code, JSON.parse(m.out)], [0, []]);
});

test('AC-02 list --json shows the four task fields only (unknown fields are not echoed)', () => {
  const r = run(['list', '--json', '--file', copyFixture('valid-unknown-fields.json')]);
  const tasks = JSON.parse(r.out);
  assert.equal(tasks.length, 1);
  assert.deepEqual(Object.keys(tasks[0]), ['id', 'title', 'done', 'created']);
});

// ---------------- AC-03 done ----------------

test('AC-03 done sets done:true, prints Done #<id>, and touches nothing else', () => {
  const file = copyFixture('valid-two.json');
  const before = read(file);
  const r = run(['done', '1', '--file', file]);
  assert.deepEqual([r.code, r.out, r.err], [0, 'Done #1\n', '']);
  const after = read(file);
  assert.equal(after.tasks[0].done, true);
  assert.equal(typeof after.tasks[0].done, 'boolean');
  before.tasks[0].done = true;
  assert.deepEqual(after, before);
  assert.equal(run(['list', '--file', file]).out, '[x] #1 Buy milk\n[x] #2 Call Sam\n');
});

test('AC-03 known-bad: an unknown id exits 2 with No task #<id> and leaves the file byte-identical', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  const r = run(['done', '99', '--file', file]);
  assert.deepEqual([r.code, r.out, r.err], [2, '', 'No task #99\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
  // a missing file has no tasks either, and is not created
  const missing = tempFile();
  assert.equal(run(['done', '1', '--file', missing]).code, 2);
  assert.equal(fs.existsSync(missing), false);
});

test('AC-03 / I-01 done on an already-done task exits 0, prints Already done #<id>, content unchanged', () => {
  const file = copyFixture('valid-two.json');
  const before = read(file);
  const r = run(['done', '2', '--file', file]);
  assert.deepEqual([r.code, r.out, r.err], [0, 'Already done #2\n', '']);
  assert.deepEqual(read(file), before);
});

test('AC-03 a missing or non-numeric id exits 1 and changes nothing', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  for (const args of [['done'], ['done', 'abc'], ['done', '1.5'], ['done', '-1'], ['done', '0'], ['done', '1x'], ['done', ''], ['done', '1', '2']]) {
    const r = run([...args, '--file', file]);
    assert.equal(r.code, 1, JSON.stringify(args));
    assert.equal(r.out, '');
    assert.notEqual(r.err, '');
  }
  assert.ok(before.equals(fs.readFileSync(file)));
});

// ---------------- AC-04 remove ----------------

test('AC-04 remove answered yes removes the task', () => {
  const file = copyFixture('valid-two.json');
  const r = run(['remove', '1', '--file', file], { input: 'yes\n' });
  assert.equal(r.code, 0);
  assert.equal(r.out, 'Removed #1\n');
  const after = read(file);
  assert.deepEqual(after.tasks.map((t) => t.id), [2]);
  assert.equal(after.nextId, 3);
});

test('AC-04 known-bad: answering no prints Cancelled, exits 0 and leaves the file byte-identical', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  const r = run(['remove', '1', '--file', file], { input: 'no\n' });
  assert.deepEqual([r.code, r.out], [0, 'Cancelled\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
});

test('AC-04 anything other than the word yes cancels and leaves the file byte-identical', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  for (const input of ['y\n', 'YES\n', 'Yes\n', 'yes please\n', 'yess\n', '\n', 'no\nyes\n', 'maybe']) {
    const r = run(['remove', '2', '--file', file], { input });
    assert.deepEqual([r.code, r.out], [0, 'Cancelled\n'], JSON.stringify(input));
    assert.ok(before.equals(fs.readFileSync(file)), JSON.stringify(input));
  }
});

test('AC-04 / I-06 a closed or empty stdin without --yes is Cancelled, exit 0, nothing changed', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  const r = run(['remove', '1', '--file', file], { input: '' });
  assert.deepEqual([r.code, r.out], [0, 'Cancelled\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-04 yes with Windows line ending or no line ending is accepted', () => {
  for (const input of ['yes\r\n', 'yes']) {
    const file = copyFixture('valid-two.json');
    const r = run(['remove', '2', '--file', file], { input });
    assert.deepEqual([r.code, r.out], [0, 'Removed #2\n'], JSON.stringify(input));
    assert.deepEqual(read(file).tasks.map((t) => t.id), [1]);
  }
});

test('AC-04 --yes skips the question (stdin is not consulted)', () => {
  const file = copyFixture('valid-two.json');
  const r = run(['remove', '2', '--yes', '--file', file], { input: 'no\n' });
  assert.deepEqual([r.code, r.out, r.err], [0, 'Removed #2\n', '']);
  assert.deepEqual(read(file).tasks.map((t) => t.id), [1]);
  assert.equal(read(file).nextId, 3);
});

test('AC-04 remove of an unknown id exits 2 without asking; bad ids exit 1', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  const r = run(['remove', '9', '--file', file], { input: 'yes\n' });
  assert.deepEqual([r.code, r.out, r.err], [2, '', 'No task #9\n']);
  assert.equal(run(['remove', '9', '--yes', '--file', file]).code, 2);
  assert.equal(run(['remove', '--file', file]).code, 1);
  assert.equal(run(['remove', 'abc', '--yes', '--file', file]).code, 1);
  assert.ok(before.equals(fs.readFileSync(file)));
});

// ---------------- section 7: usage errors, section 5: settings ----------------

test('usage: no command, an unknown command and an unknown option exit 1 with a message on stderr', () => {
  const file = copyFixture('valid-two.json');
  const before = fs.readFileSync(file);
  for (const args of [[], ['frobnicate'], ['clear'], ['list', '--nope'], ['list', 'extra'], ['add', 'x', '--file'], ['add', 'x', '--yes'], ['done', '1', '--json']]) {
    const r = run(args[args.length - 1] === '--file' ? args : [...args, '--file', file]);
    assert.equal(r.code, 1, JSON.stringify(args));
    assert.equal(r.out, '', JSON.stringify(args));
    assert.notEqual(r.err, '', JSON.stringify(args));
  }
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('settings: --file wins over TODO_FILE, TODO_FILE wins over the default', () => {
  const flagFile = tempFile();
  const envFile = tempFile();
  const cwd = tempDir(); // the default ./tasks.json would land here, never in the project
  assert.equal(run(['add', 'via env', ], { env: { TODO_FILE: envFile }, cwd }).code, 0);
  assert.equal(read(envFile).tasks[0].title, 'via env');
  assert.equal(run(['add', 'via flag', '--file', flagFile], { env: { TODO_FILE: envFile }, cwd }).code, 0);
  assert.equal(read(flagFile).tasks[0].title, 'via flag');
  assert.equal(read(envFile).tasks.length, 1);
  assert.deepEqual(fs.readdirSync(cwd), []);
  // --file=path form
  assert.equal(run(['list', `--file=${flagFile}`], { cwd }).out, '[ ] #1 via flag\n');
});

test('settings: with no --file and no TODO_FILE the data file is ./tasks.json in the current folder', () => {
  const cwd = tempDir();
  assert.equal(run(['add', 'default place'], { cwd }).code, 0);
  assert.deepEqual(fs.readdirSync(cwd), ['tasks.json']);
  assert.equal(read(path.join(cwd, 'tasks.json')).tasks[0].title, 'default place');
});

// ---------------- AC-05 (CLI reader) and AC-06 (CLI side) ----------------

for (const [name, verdict] of Object.entries(expected)) {
  test(`AC-05 CLI list on ${name}: ${verdict === 'valid' ? 'exit 0' : 'exit 3'}`, () => {
    const file = copyFixture(name);
    const before = fs.readFileSync(file);
    const r = run(['list', '--file', file]);
    if (verdict === 'valid') {
      assert.equal(r.code, 0, r.err);
      assert.equal(r.err, '');
    } else {
      assert.equal(r.code, 3);
      assert.equal(r.out, '');
      assert.ok(r.err.startsWith(`Cannot read ${file}: `), r.err);
    }
    assert.ok(before.equals(fs.readFileSync(file)));
  });
}

test('AC-06 invalid-not-json.json: every command exits 3 with Cannot read <path>: <reason> and never overwrites it', () => {
  const file = copyFixture('invalid-not-json.json');
  const before = fs.readFileSync(file);
  const commands = [
    ['add', 'New task'], ['list'], ['list', '--json'], ['done', '1'], ['remove', '1', '--yes'], ['remove', '1'],
  ];
  for (const args of commands) {
    const r = run([...args, '--file', file], { input: 'yes\n' });
    assert.equal(r.code, 3, JSON.stringify(args));
    assert.equal(r.out, '', JSON.stringify(args));
    const lines = r.err.trimEnd().split('\n');
    assert.equal(lines.length, 1, 'one line, no stack trace');
    assert.ok(lines[0].startsWith(`Cannot read ${file}: `), r.err);
    assert.ok(lines[0].length > `Cannot read ${file}: `.length, 'a reason is given');
    assert.ok(before.equals(fs.readFileSync(file)), `file changed by ${JSON.stringify(args)}`);
  }
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json'], 'no temp file left');
});

for (const [name, verdict] of Object.entries(expected)) {
  if (verdict !== 'invalid') continue;
  test(`AC-06 writing commands never overwrite ${name}`, () => {
    const file = copyFixture(name);
    const before = fs.readFileSync(file);
    for (const args of [['add', 'New task'], ['done', '1'], ['remove', '1', '--yes']]) {
      const r = run([...args, '--file', file]);
      assert.equal(r.code, 3, JSON.stringify(args));
      assert.ok(r.err.startsWith(`Cannot read ${file}: `), r.err);
      assert.ok(before.equals(fs.readFileSync(file)), JSON.stringify(args));
    }
    assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
  });
}

test('AC-06 the path in the message is the one given through TODO_FILE when no --file is used', () => {
  const file = copyFixture('invalid-not-json.json');
  const r = run(['list'], { env: { TODO_FILE: file }, cwd: tempDir() });
  assert.equal(r.code, 3);
  assert.ok(r.err.startsWith(`Cannot read ${file}: `), r.err);
});

test('AC-06 a data path that is a folder exits 3 and is left alone', () => {
  const dir = tempDir();
  const r = run(['add', 'x', '--file', dir]);
  assert.equal(r.code, 3);
  assert.ok(r.err.startsWith(`Cannot read ${dir}: `), r.err);
  assert.deepEqual(fs.readdirSync(dir), []);
});

// ---------------- rewriting valid fixtures (CLI side of AC-09, I-01, I-03) ----------------

for (const [name, verdict] of Object.entries(expected)) {
  if (verdict !== 'valid') continue;
  test(`valid fixture ${name}: add, done and done-again keep the file valid and in contract format`, () => {
    const file = copyFixture(name);
    const original = read(file);
    assert.equal(run(['add', 'Extra', '--file', file]).code, 0);
    const id = original.nextId;
    assert.equal(run(['done', String(id), '--file', file]).out, `Done #${id}\n`);
    const text1 = fs.readFileSync(file, 'utf8');
    assert.equal(run(['done', String(id), '--file', file]).out, `Already done #${id}\n`);
    const text2 = fs.readFileSync(file, 'utf8');
    assert.equal(text2, text1, 'I-01: rewritten, content unchanged');

    const data = JSON.parse(text2);
    assert.equal(text2, JSON.stringify(data, null, 2) + '\n');
    assert.deepEqual(Object.keys(data), ['version', 'nextId', 'tasks']); // I-03 unknown top-level fields dropped
    assert.equal(data.nextId, original.nextId + 1);
    assert.equal(data.tasks.length, original.tasks.length + 1);
    for (const t of data.tasks) assert.deepEqual(Object.keys(t), ['id', 'title', 'done', 'created']);
    original.tasks.forEach((t, i) => {
      assert.deepEqual(data.tasks[i], { id: t.id, title: t.title, done: t.done, created: t.created });
    });
    assert.equal(run(['list', '--file', file]).code, 0);
  });
}

test('I-01 / I-03 done on an already-done task rewrites the file: unknown fields are dropped by that write', () => {
  const file = tempFile();
  const c = '2026-11-13T09:00:00.000Z';
  fs.writeFileSync(file, JSON.stringify({ version: 1, nextId: 2, note: 'x', tasks: [{ id: 1, title: 'T', done: true, created: c, priority: 'high' }] }));
  assert.equal(run(['done', '1', '--file', file]).out, 'Already done #1\n');
  const want = { version: 1, nextId: 2, tasks: [{ id: 1, title: 'T', done: true, created: c }] };
  assert.equal(fs.readFileSync(file, 'utf8'), JSON.stringify(want, null, 2) + '\n');
});

// ---------------- AC-10 through the real command ----------------

test('AC-10 a real failed write (read-only data file folder is not portable, so: target folder missing) exits non-zero and creates nothing', () => {
  const dir = tempDir();
  const file = path.join(dir, 'no-such-folder', 'tasks.json');
  const r = run(['add', 'x', '--file', file]);
  assert.equal(r.code, 3);
  assert.equal(r.out, '');
  assert.ok(r.err.startsWith(`Cannot write ${file}: `), r.err);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('AC-10 successful commands leave only the data file in its folder (no temp files)', () => {
  const file = tempFile();
  run(['add', 'one', '--file', file]);
  run(['add', 'two', '--file', file]);
  run(['done', '1', '--file', file]);
  run(['remove', '2', '--yes', '--file', file]);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
});
