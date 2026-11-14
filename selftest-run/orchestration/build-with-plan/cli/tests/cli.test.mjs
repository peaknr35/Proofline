import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const CLI = path.join(ROOT, 'cli', 'todo.mjs');
const FIXTURES = path.join(ROOT, 'contract', 'fixtures');

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function cli(args, { input, closedStdin = false, env = {}, cwd } = {}) {
  const fullEnv = { ...process.env, ...env };
  if (!('TODO_FILE' in env)) delete fullEnv.TODO_FILE;
  const opts = { encoding: 'utf8', env: fullEnv, cwd };
  if (closedStdin) opts.stdio = ['ignore', 'pipe', 'pipe'];
  else opts.input = input ?? '';
  const r = spawnSync(process.execPath, [CLI, ...args], opts);
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('AC-01 add appends with the next id, done:false, and prints Added', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  const a = cli(['add', 'Buy milk', '--file', file]);
  assert.deepEqual([a.code, a.out, a.err], [0, 'Added #1: Buy milk\n', '']);
  const b = cli(['add', 'Call Sam', '--file', file]);
  assert.deepEqual([b.code, b.out], [0, 'Added #2: Call Sam\n']);

  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  assert.equal(data.version, 1);
  assert.equal(data.nextId, 3);
  assert.deepEqual(Object.keys(data), ['version', 'nextId', 'tasks']);
  assert.deepEqual(
    data.tasks.map((x) => [x.id, x.title, x.done]),
    [
      [1, 'Buy milk', false],
      [2, 'Call Sam', false],
    ],
  );
  for (const task of data.tasks) {
    assert.deepEqual(Object.keys(task), ['id', 'title', 'done', 'created']);
    assert.equal(new Date(task.created).toISOString(), task.created);
  }
  assert.equal(raw, JSON.stringify(data, null, 2) + '\n', 'two-space JSON with trailing newline');
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json'], 'no temp file left behind');
});

test('AC-01 known-bad: a 201-character title is refused with exit 1; 200 is accepted', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  const bad = cli(['add', 'x'.repeat(201), '--file', file]);
  assert.equal(bad.code, 1);
  assert.notEqual(bad.err, '');
  assert.equal(bad.out, '');
  assert.equal(fs.existsSync(file), false);
  const ok = cli(['add', 'x'.repeat(200), '--file', file]);
  assert.equal(ok.code, 0);
});

test('I-07 title is trimmed before the length check and before saving', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  const a = cli(['add', '   Buy milk  ', '--file', file]);
  assert.deepEqual([a.code, a.out], [0, 'Added #1: Buy milk\n']);
  const b = cli(['add', '  ' + 'y'.repeat(200) + '  ', '--file', file]);
  assert.equal(b.code, 0);
  assert.deepEqual(
    readJson(file).tasks.map((x) => x.title),
    ['Buy milk', 'y'.repeat(200)],
  );
  const before = fs.readFileSync(file);
  const empty = cli(['add', '    ', '--file', file]);
  assert.equal(empty.code, 1);
  assert.notEqual(empty.err, '');
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-02 list prints one line per task in id order, No tasks. when empty, and --json', (t) => {
  const dir = tempDir(t);
  const file = path.join(dir, 'tasks.json');
  const none = cli(['list', '--file', file]);
  assert.deepEqual([none.code, none.out], [0, 'No tasks.\n']);
  assert.equal(fs.existsSync(file), false, 'list does not create the file');
  const noneJson = cli(['list', '--json', '--file', file]);
  assert.deepEqual(JSON.parse(noneJson.out), []);

  fs.copyFileSync(path.join(FIXTURES, 'valid-two.json'), file);
  const two = cli(['list', '--file', file]);
  assert.deepEqual([two.code, two.out], [0, '[ ] #1 Buy milk\n[x] #2 Call Sam\n']);
  const json = cli(['list', '--json', '--file', file]);
  assert.equal(json.code, 0);
  assert.deepEqual(JSON.parse(json.out), readJson(file).tasks);

  // out-of-order file still lists in id order
  const shuffled = readJson(file);
  shuffled.tasks.reverse();
  fs.writeFileSync(file, JSON.stringify(shuffled));
  assert.equal(cli(['list', '--file', file]).out, '[ ] #1 Buy milk\n[x] #2 Call Sam\n');
});

test('AC-03 done sets done:true and prints Done; unknown id exits 2', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'Buy milk', '--file', file]);
  const d = cli(['done', '1', '--file', file]);
  assert.deepEqual([d.code, d.out, d.err], [0, 'Done #1\n', '']);
  assert.equal(readJson(file).tasks[0].done, true);
  assert.equal(cli(['list', '--file', file]).out, '[x] #1 Buy milk\n');

  const before = fs.readFileSync(file);
  const unknown = cli(['done', '99', '--file', file]);
  assert.deepEqual([unknown.code, unknown.out, unknown.err], [2, '', 'No task #99\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('I-01 done on an already-done task: exit 0, Already done, same content', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'Buy milk', '--file', file]);
  cli(['done', '1', '--file', file]);
  const before = fs.readFileSync(file);
  const again = cli(['done', '1', '--file', file]);
  assert.deepEqual([again.code, again.out], [0, 'Already done #1\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-04 remove asks for yes; no leaves the file byte-identical; yes and --yes remove', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'One', '--file', file]);
  cli(['add', 'Two', '--file', file]);
  cli(['add', 'Three', '--file', file]);
  const before = fs.readFileSync(file);

  for (const answer of ['no\n', 'y\n', 'YES\n', 'yes please\n', '\n']) {
    const r = cli(['remove', '1', '--file', file], { input: answer });
    assert.deepEqual([r.code, r.out], [0, 'Cancelled\n'], `answer ${JSON.stringify(answer)}`);
    assert.ok(before.equals(fs.readFileSync(file)), `file untouched after ${JSON.stringify(answer)}`);
  }

  const yes = cli(['remove', '1', '--file', file], { input: 'yes\n' });
  assert.equal(yes.code, 0);
  assert.doesNotMatch(yes.out, /Cancelled/);
  assert.deepEqual(readJson(file).tasks.map((x) => x.id), [2, 3]);

  const skip = cli(['remove', '2', '--yes', '--file', file], { closedStdin: true });
  assert.equal(skip.code, 0);
  assert.doesNotMatch(skip.out, /Cancelled/);
  assert.deepEqual(readJson(file).tasks.map((x) => x.id), [3]);

  const unknown = cli(['remove', '42', '--yes', '--file', file]);
  assert.deepEqual([unknown.code, unknown.err], [2, 'No task #42\n']);
  const unknownAsk = cli(['remove', '42', '--file', file], { input: 'yes\n' });
  assert.equal(unknownAsk.code, 2);
});

test('I-06 remove with closed or empty stdin and no --yes: Cancelled, exit 0, file untouched', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'One', '--file', file]);
  const before = fs.readFileSync(file);
  const empty = cli(['remove', '1', '--file', file], { input: '' });
  assert.deepEqual([empty.code, empty.out], [0, 'Cancelled\n']);
  const closed = cli(['remove', '1', '--file', file], { closedStdin: true });
  assert.deepEqual([closed.code, closed.out], [0, 'Cancelled\n']);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('I-02 ids are never reused after remove; nextId only grows', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'A', '--file', file]);
  cli(['add', 'B', '--file', file]);
  cli(['remove', '2', '--yes', '--file', file]);
  assert.equal(readJson(file).nextId, 3);
  const c = cli(['add', 'C', '--file', file]);
  assert.equal(c.out, 'Added #3: C\n');
  cli(['remove', '1', '--yes', '--file', file]);
  cli(['remove', '3', '--yes', '--file', file]);
  assert.deepEqual(readJson(file), { version: 1, nextId: 4, tasks: [] });
  assert.equal(cli(['add', 'D', '--file', file]).out, 'Added #4: D\n');
});

test('bad usage exits 1 with a message on stderr', (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  cli(['add', 'One', '--file', file]);
  const before = fs.readFileSync(file);
  const cases = [
    [],
    ['frobnicate'],
    ['add'],
    ['add', ''],
    ['done'],
    ['done', 'abc'],
    ['done', '1.5'],
    ['done', '-1'],
    ['remove'],
    ['remove', 'one', '--yes'],
  ];
  for (const args of cases) {
    const r = cli([...args, '--file', file]);
    assert.equal(r.code, 1, `args ${JSON.stringify(args)}`);
    assert.notEqual(r.err, '', `stderr for ${JSON.stringify(args)}`);
    assert.equal(r.out, '', `stdout for ${JSON.stringify(args)}`);
  }
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('data file setting: --file wins, then TODO_FILE, then ./tasks.json', (t) => {
  const dir = tempDir(t);
  const flagFile = path.join(dir, 'flag.json');
  const envFile = path.join(dir, 'env.json');
  cli(['add', 'via flag', '--file', flagFile], { env: { TODO_FILE: envFile }, cwd: dir });
  assert.equal(fs.existsSync(flagFile), true);
  assert.equal(fs.existsSync(envFile), false);
  cli(['add', 'via env'], { env: { TODO_FILE: envFile }, cwd: dir });
  assert.equal(readJson(envFile).tasks[0].title, 'via env');
  cli(['add', 'via default'], { cwd: dir });
  assert.equal(readJson(path.join(dir, 'tasks.json')).tasks[0].title, 'via default');
});

test('AC-05 the CLI reader accepts every valid fixture and refuses every invalid one', (t) => {
  const dir = tempDir(t);
  const expected = readJson(path.join(FIXTURES, 'expected.json'));
  const names = Object.keys(expected);
  assert.ok(names.length > 0);
  for (const name of names) {
    const verdict = expected[name];
    assert.ok(verdict === 'valid' || verdict === 'invalid', `verdict for ${name}`);
    const copy = path.join(dir, name);
    fs.copyFileSync(path.join(FIXTURES, name), copy);
    const r = cli(['list', '--file', copy]);
    assert.equal(r.code, verdict === 'valid' ? 0 : 3, `${name} should be ${verdict}: ${r.err}`);
    if (verdict === 'invalid') assert.ok(r.err.startsWith(`Cannot read ${copy}: `), r.err);
  }
});

test('AC-06 a bad data file is never overwritten: exit 3 on every command', (t) => {
  const dir = tempDir(t);
  const copy = path.join(dir, 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, 'invalid-not-json.json'), copy);
  const before = fs.readFileSync(copy);
  for (const args of [['add', 'x'], ['list'], ['list', '--json'], ['done', '1'], ['remove', '1', '--yes'], ['remove', '1']]) {
    const r = cli([...args, '--file', copy], { input: 'yes\n' });
    assert.equal(r.code, 3, `args ${JSON.stringify(args)}`);
    assert.equal(r.out, '');
    assert.ok(r.err.startsWith(`Cannot read ${copy}: `), r.err);
    assert.ok(r.err.trim().length > `Cannot read ${copy}: `.length, 'has a reason');
    assert.ok(before.equals(fs.readFileSync(copy)), `file untouched after ${JSON.stringify(args)}`);
  }
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);

  // an unreadable path (a folder) is also exit 3
  const folder = cli(['list', '--file', dir]);
  assert.equal(folder.code, 3);
  assert.ok(folder.err.startsWith(`Cannot read ${dir}: `), folder.err);
});

test('I-03 unknown fields are accepted on read and dropped on the next write', (t) => {
  const copy = path.join(tempDir(t), 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, 'valid-unknown-fields.json'), copy);
  assert.equal(cli(['done', '1', '--file', copy]).code, 0);
  const data = readJson(copy);
  assert.deepEqual(Object.keys(data), ['version', 'nextId', 'tasks']);
  assert.deepEqual(Object.keys(data.tasks[0]), ['id', 'title', 'done', 'created']);
});

test('AC-10 a failed write leaves the old file intact and removes the temp file', async (t) => {
  const { saveData, loadData } = await import('../todo.mjs');
  const dir = tempDir(t);
  const file = path.join(dir, 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, 'valid-two.json'), file);
  const before = fs.readFileSync(file);

  const data = loadData(file);
  data.tasks.push({ id: 3, title: 'New', done: false, created: new Date().toISOString() });
  data.nextId = 4;

  let tempSeen = null;
  assert.throws(
    () =>
      saveData(file, data, {
        rename: (from, to) => {
          tempSeen = from;
          assert.equal(to, file);
          assert.equal(path.dirname(from), dir, 'temp file is in the same folder');
          assert.notEqual(from, file);
          assert.equal(JSON.parse(fs.readFileSync(from, 'utf8')).nextId, 4, 'new content went to the temp file');
          assert.ok(before.equals(fs.readFileSync(file)), 'data file not touched before the rename');
          throw new Error('rename refused');
        },
      }),
    /Cannot write/,
  );
  assert.ok(tempSeen, 'rename step was reached');
  assert.ok(before.equals(fs.readFileSync(file)), 'old file intact');
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json'], 'temp file removed');

  // and the normal path does replace the file
  saveData(file, data);
  assert.equal(readJson(file).nextId, 4);
  assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);
});

test('AC-10 through the real CLI: a write that cannot finish leaves no half-written file', (t) => {
  const dir = tempDir(t);
  const file = path.join(dir, 'missing-folder', 'tasks.json');
  const r = cli(['add', 'x', '--file', file]);
  assert.notEqual(r.code, 0);
  assert.match(r.err, /Cannot write/);
  assert.equal(r.out, '');
  assert.deepEqual(fs.readdirSync(dir), []);
});
