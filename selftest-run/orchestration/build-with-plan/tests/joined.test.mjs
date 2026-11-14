// Joined checks: the real CLI (as a child process) and the real web server (port 0) on one data file.
// JOINED_SPLIT=1 hands the server a different file from the CLI's; it exists only to prove
// these checks fail when the two parts are not joined.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from '../web/server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CLI = path.join(ROOT, 'cli', 'todo.mjs');
const FIXTURES = path.join(ROOT, 'contract', 'fixtures');
const SPLIT = process.env.JOINED_SPLIT === '1';

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-joined-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// The file the server is given: the CLI's file, unless JOINED_SPLIT=1.
const serverFileFor = (cliFile) => (SPLIT ? path.join(path.dirname(cliFile), 'split-other.json') : cliFile);

function cli(file, args) {
  const env = { ...process.env };
  delete env.TODO_FILE;
  const r = spawnSync(process.execPath, [CLI, ...args, '--file', file], { encoding: 'utf8', env, input: '' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

async function start(t, file) {
  const server = createServer({ file });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (p) => {
    const res = await fetch(base + p);
    return { status: res.status, body: await res.text() };
  };
}

const items = (html) => [...html.matchAll(/<li([^>]*)>([\s\S]*?)<\/li>/g)].map((m) => ({ attrs: m[1], inner: m[2] }));

test('J1 add and done on the command line show up on the same running web server', async (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  const get = await start(t, serverFileFor(file));

  const add = cli(file, ['add', 'Buy milk']);
  assert.deepEqual([add.code, add.out], [0, 'Added #1: Buy milk\n']);

  const first = await get('/');
  assert.equal(first.status, 200);
  assert.ok(first.body.includes('#1 Buy milk'), 'page lists #1 Buy milk');
  assert.ok(first.body.includes('1 open, 0 done'));
  assert.doesNotMatch(items(first.body)[0].attrs, /done/);

  const done = cli(file, ['done', '1']);
  assert.deepEqual([done.code, done.out], [0, 'Done #1\n']);

  const second = await get('/');
  assert.equal(second.status, 200);
  const li = items(second.body);
  assert.equal(li.length, 1);
  assert.ok(li[0].inner.startsWith('#1 Buy milk'));
  assert.match(li[0].attrs, /class="done"/);
  assert.match(li[0].inner, /Done/);
  assert.ok(second.body.includes('0 open, 1 done'));

  const api = await get('/api/tasks');
  assert.equal(api.status, 200);
  const listed = cli(file, ['list', '--json']);
  assert.equal(listed.code, 0);
  const fromCli = JSON.parse(listed.out);
  assert.equal(fromCli.length, 1);
  assert.deepEqual(JSON.parse(api.body).tasks, fromCli);
});

test('J2 CLI and web agree with expected.json on every fixture', async (t) => {
  const dir = tempDir(t);
  const expected = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'expected.json'), 'utf8'));
  const names = Object.keys(expected);
  assert.ok(names.length > 0);
  for (const name of names) {
    const verdict = expected[name];
    assert.ok(verdict === 'valid' || verdict === 'invalid', `verdict for ${name}`);
    const copy = path.join(dir, name);
    fs.copyFileSync(path.join(FIXTURES, name), copy);
    const get = await start(t, SPLIT ? path.join(dir, `split-${name}`) : copy);
    assert.equal(cli(copy, ['list']).code, verdict === 'valid' ? 0 : 3, `CLI list for ${name}`);
    assert.equal((await get('/')).status, verdict === 'valid' ? 200 : 500, `GET / for ${name}`);
  }
});

test('J3 unknown fields dropped, removed id never reused, web shows what the CLI wrote', async (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, 'valid-unknown-fields.json'), file);
  const get = await start(t, serverFileFor(file));

  const idOf = (r) => {
    assert.equal(r.code, 0, r.err);
    return Number(/^Added #(\d+): /.exec(r.out)[1]);
  };
  const a = idOf(cli(file, ['add', 'A']));
  const b = idOf(cli(file, ['add', 'B']));
  assert.equal(cli(file, ['remove', String(a), '--yes']).code, 0);
  const c = idOf(cli(file, ['add', 'C']));
  assert.ok(c > a, 'C does not reuse the removed id');
  assert.ok(c > b);

  const page = await get('/');
  assert.equal(page.status, 200);
  const texts = items(page.body).map((x) => x.inner);
  assert.ok(texts.some((x) => x.startsWith(`#${b} B`)), 'web lists B');
  assert.ok(texts.some((x) => x.startsWith(`#${c} C`)), 'web lists C');
  assert.ok(!texts.some((x) => x.startsWith(`#${a} `)), 'web does not list the removed A');

  const api = JSON.parse((await get('/api/tasks')).body);
  assert.deepEqual(api.tasks, JSON.parse(cli(file, ['list', '--json']).out));

  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(onDisk), ['version', 'nextId', 'tasks']);
  for (const task of onDisk.tasks) assert.deepEqual(Object.keys(task), ['id', 'title', 'done', 'created']);
  assert.equal(onDisk.nextId, c + 1);
  assert.deepEqual(onDisk.tasks, api.tasks);
});

test('P2 a bad file is refused by both parts and stays byte-identical', async (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, 'invalid-not-json.json'), file);
  const original = fs.readFileSync(path.join(FIXTURES, 'invalid-not-json.json'));
  const get = await start(t, serverFileFor(file));

  for (const args of [['add', 'x'], ['list'], ['done', '1'], ['remove', '1', '--yes']]) {
    const r = cli(file, args);
    assert.equal(r.code, 3, `cli ${args.join(' ')}`);
    assert.ok(r.err.startsWith(`Cannot read ${file}: `), r.err);
  }
  const page = await get('/');
  assert.equal(page.status, 500);
  assert.ok(page.body.includes('Cannot read tasks file'));
  const api = await get('/api/tasks');
  assert.equal(api.status, 500);
  assert.deepEqual(JSON.parse(api.body), { error: 'Cannot read tasks file' });

  assert.ok(original.equals(fs.readFileSync(file)), 'file is byte-identical to the original');
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json'], 'nothing else was written beside it');
});
