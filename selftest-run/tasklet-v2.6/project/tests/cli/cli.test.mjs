// U2: AC-05, 06, 10, 11, 12, 21, 24. Every cli-cases.json case through bin/todo.mjs as a child process.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { main } from '../../src/cli.mjs';
import { loadStore } from '../../src/store.mjs';
import { ROOT, FIXTURES, fixtureJson, withTempDir } from '../foundation/helpers.mjs';

const BIN = path.join(ROOT, 'bin', 'todo.mjs');
const HELP = fs.readFileSync(path.join(FIXTURES, 'help.txt'), 'utf8');
const cases = fixtureJson('cli-cases.json').cases;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function childEnv(file) {
  const env = { ...process.env, TODO_FILE: file };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function run(args, file, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { env: childEnv(file), cwd, encoding: 'utf8' });
}

// Prepares TODO_FILE for a case's "start" and returns the start bytes (or null).
function prepare(start, dir) {
  if (start === 'missing-parent') return { file: path.join(dir, 'missing', 'todo.json'), bytes: null };
  const file = path.join(dir, 'todo.json');
  if (start === 'none') return { file, bytes: null };
  if (start === 'directory') {
    fs.mkdirSync(file);
    return { file, bytes: null };
  }
  const fixture = start === 'stray-temp' ? 'valid-two.json' : start;
  fs.copyFileSync(path.join(FIXTURES, 'stores', fixture), file);
  if (start === 'stray-temp') fs.writeFileSync(`${file}.tmp-999-abc`, 'junk');
  return { file, bytes: fs.readFileSync(file) };
}

// The file after a step, parsed, for <SAME:n>; undefined when absent or not plain JSON.
function snapshot(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function isTimestamp(v) {
  return typeof v === 'string' && TIMESTAMP.test(v) && new Date(v).toISOString() === v;
}

// Replaces <ISO> and <SAME:n> in the expected "end" with the actual values found at that place,
// after checking them; keeps the expected object's key order (cli-cases rule).
function fill(expected, actual, snapshots, at) {
  if (expected === '<ISO>') {
    assert.ok(isTimestamp(actual), `${at}: <ISO> expected, got ${JSON.stringify(actual)}`);
    return actual;
  }
  const same = typeof expected === 'string' && /^<SAME:(\d+)>$/.exec(expected);
  if (same) {
    const snap = snapshots[Number(same[1]) - 1];
    const was = at.split('.').slice(1).reduce((o, k) => (o == null ? o : o[k]), snap);
    assert.deepEqual(actual, was, `${at}: <SAME:${same[1]}>`);
    return actual;
  }
  if (Array.isArray(expected)) {
    return expected.map((e, i) => fill(e, Array.isArray(actual) ? actual[i] : undefined, snapshots, `${at}.${i}`));
  }
  if (expected !== null && typeof expected === 'object') {
    const out = {};
    for (const k of Object.keys(expected)) {
      const v = fill(expected[k], actual == null ? undefined : actual[k], snapshots, `${at}.${k}`);
      Object.defineProperty(out, k, { value: v, enumerable: true, writable: true, configurable: true });
    }
    return out;
  }
  return expected;
}

function checkStdout(step, stdout, fileShown) {
  if (step.stdoutLineCount !== undefined) {
    const lines = stdout.split('\n');
    assert.equal(lines.pop(), '', 'stdout ends with a newline');
    assert.equal(lines.length, step.stdoutLineCount);
    assert.equal(lines[0], step.stdoutFirstLine);
    assert.equal(lines[lines.length - 1], step.stdoutLastLine);
    return;
  }
  const want = step.stdout.replaceAll('<HELP>', HELP).replaceAll('<FILE>', fileShown);
  assert.equal(stdout, want, 'stdout');
}

test('AC-05/06: every cli-cases.json case through bin/todo.mjs', async (t) => {
  assert.ok(cases.length > 0);
  for (const c of cases) {
    await t.test(c.name, () => withTempDir((dir) => {
      const { file, bytes } = prepare(c.start, dir);
      const shown = path.resolve(file);
      const snapshots = [];
      c.steps.forEach((step, i) => {
        const r = run(step.args, file, dir);
        assert.equal(r.status, step.exit, `step ${i + 1} exit; stderr=${JSON.stringify(r.stderr)}`);
        checkStdout(step, r.stdout, shown);
        assert.equal(r.stderr, step.stderr.replaceAll('<FILE>', shown), `step ${i + 1} stderr`);
        snapshots.push(snapshot(file));
      });
      const end = c.end;
      if (end === 'absent') {
        assert.ok(!fs.existsSync(file), 'no file at TODO_FILE');
        if (c.start === 'missing-parent') assert.ok(!fs.existsSync(path.dirname(file)), 'parent not created');
      } else if (end === 'unchanged') {
        assert.ok(fs.readFileSync(file).equals(bytes), 'file bytes unchanged');
      } else if (end === 'directory') {
        assert.ok(fs.statSync(file).isDirectory());
        assert.deepEqual(fs.readdirSync(file), []);
      } else if (end !== undefined) {
        const text = fs.readFileSync(file, 'utf8');
        const filled = fill(end, JSON.parse(text), snapshots, 'end');
        assert.equal(text, JSON.stringify(filled, null, 2) + '\n', 'end file bytes');
      }
      const raw = fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : '';
      for (const s of c.endRawContains ?? []) assert.ok(raw.includes(s), `file contains ${JSON.stringify(s)}`);
      for (const s of c.endRawNotContains ?? []) assert.ok(!raw.includes(s), `file lacks ${JSON.stringify(s)}`);
      if (c.start === 'stray-temp') assert.equal(fs.readFileSync(`${file}.tmp-999-abc`, 'utf8'), 'junk');
      const leftovers = fs.readdirSync(dir).filter((n) => n.includes('.tmp-') && n !== 'todo.json.tmp-999-abc');
      assert.deepEqual(leftovers, [], 'no temp file left');
    }));
  }
});

test('AC-10: a CLI-written file loads through loadStore to the same tasks', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  assert.equal(run(['add', 'buy', 'milk'], file, dir).status, 0);
  assert.equal(run(['add', 'call the bank'], file, dir).status, 0);
  assert.equal(run(['done', '2'], file, dir).status, 0);
  const store = loadStore(file);
  assert.deepEqual(store.tasks.map((x) => [x.id, x.title, x.done]), [[1, 'buy milk', false], [2, 'call the bank', true]]);
  assert.equal(store.tasks[1].doneAt === null, false);
  assert.equal(typeof store.tasks[1].done, 'boolean');
  assert.equal(store.nextId, 3);
}));

test('AC-10: a hand-written fixture is listed by the CLI', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-unsorted.json'), file);
  const r = run(['list'], file, dir);
  assert.equal(r.status, 0);
  const want = loadStore(file).tasks.map((x) => `${x.id}. [${x.done ? 'x' : ' '}] ${x.title}\n`).join('');
  assert.equal(r.stdout, want);
}));

test('AC-11: done twice leaves the file bytes of step 2 unchanged', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  assert.equal(run(['add', 'a'], file, dir).status, 0);
  assert.equal(run(['done', '1'], file, dir).status, 0);
  const after2 = fs.readFileSync(file);
  const r = run(['done', '1'], file, dir);
  assert.equal(r.stdout, 'Task 1 is already done.\n');
  assert.ok(fs.readFileSync(file).equals(after2));
}));

test('AC-12: list leaves bytes and mtime unchanged', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-bom.json'), file);
  const old = new Date('2026-01-01T00:00:00.000Z');
  fs.utimesSync(file, old, old);
  const before = fs.readFileSync(file);
  const mtime = fs.statSync(file).mtimeMs;
  for (const args of [['list'], ['help'], ['done', '99'], ['frob']]) run(args, file, dir);
  assert.equal(fs.statSync(file).mtimeMs, mtime);
  assert.ok(fs.readFileSync(file).equals(before));
}));

test('E_ID_LIMIT message passes the path through safeText (Lead note 1)', () => withTempDir(async (dir) => {
  const name = process.platform === 'win32' ? 'bad\u202Ename.json' : 'bad\u001b\nname.json';
  const file = path.join(dir, name);
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-nextid-exhausted.json'), file);
  let out = '';
  let err = '';
  const io = { env: { TODO_FILE: file }, cwd: dir, homedir: dir, stdout: { write: (s) => { out += s; } }, stderr: { write: (s) => { err += s; } } };
  const code = await main(['add', 'x'], io);
  assert.equal(code, 3);
  assert.equal(out, '');
  const shown = path.join(dir, process.platform === 'win32' ? 'bad?name.json' : 'bad??name.json');
  assert.equal(err, `todo: the task file ${shown} has run out of task numbers. Nothing was changed.\n`);
}));

test('AC-21: a non-TodoError ends main with exit 1 and exactly todo: internal error.', () => withTempDir(async (dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-two.json'), file);
  let err = '';
  const io = {
    env: { TODO_FILE: file }, cwd: dir, homedir: dir,
    stdout: { write: () => { throw new Error('stdout broke'); } },
    stderr: { write: (s) => { err += s; } },
  };
  assert.equal(await main(['list'], io), 1);
  assert.equal(err, 'todo: internal error.\n');
}));

test('AC-24: a reader that stops early: exit 0, empty stderr', (t) => withTempDir(async (dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-1000-long.json'), file);
  const child = spawn(process.execPath, [BIN, 'list'], { env: childEnv(file), cwd: dir });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (s) => { stderr += s; });
  let exitedEarly = false;
  const exited = new Promise((resolve) => child.on('close', (code) => resolve(code)));
  child.on('exit', () => { exitedEarly = exitedEarly || !destroyed; });
  let destroyed = false;
  await new Promise((resolve) => {
    let buf = '';
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      if (!destroyed && buf.includes('\n')) {
        destroyed = true;
        child.stdout.destroy();
        resolve();
      }
    });
    child.stdout.on('end', resolve);
  });
  const code = await exited;
  if (exitedEarly) {
    t.skip('child exited before the pipe was destroyed: no EPIPE happened');
    return;
  }
  assert.equal(code, 0, `stderr=${JSON.stringify(stderr)}`);
  assert.equal(stderr, '');
}));
