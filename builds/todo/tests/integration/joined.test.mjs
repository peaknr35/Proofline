// Joined-only checks (AC-08, AC-09). Real CLI process, real web server, one file. No fakes.
// JOINED_WRONG_FILE=1 points the server at a different file: AC-08 must then fail (the known-bad case).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cliPath = join(root, 'cli', 'todo.mjs');
const fixtures = join(root, 'contract', 'fixtures');
const { createServer } = await import(pathToFileURL(join(root, 'web', 'server.mjs')).href);

function cli(file, ...args) {
  return spawnSync(process.execPath, [cliPath, ...args, '--file', file], { encoding: 'utf8' });
}

async function withServer(file, fn) {
  const server = createServer({ file });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn(base); } finally { await new Promise((ok) => server.close(ok)); }
}

test('AC-08: a task added and finished by the CLI shows up in the web view', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tasklet-joined-'));
  const file = join(dir, 'tasks.json');
  const served = process.env.JOINED_WRONG_FILE ? join(dir, 'other.json') : file;
  try {
    const added = cli(file, 'add', 'Joined check task');
    assert.equal(added.status, 0, added.stderr);

    await withServer(served, async (base) => {
      const api = await fetch(`${base}/api/tasks`);
      assert.equal(api.status, 200);
      const body = await api.json();
      assert.equal(body.tasks.length, 1, 'the web API must see the task the CLI added');
      assert.equal(body.tasks[0].title, 'Joined check task');
      assert.equal(body.tasks[0].done, false);
      const id = body.tasks[0].id;

      const page = await (await fetch(`${base}/`)).text();
      assert.match(page, /Joined check task/);
      assert.match(page, /1 open, 0 done/);

      const finished = cli(file, 'done', String(id));
      assert.equal(finished.status, 0, finished.stderr);

      const after = await (await fetch(`${base}/api/tasks`)).json();
      assert.equal(after.tasks[0].done, true, 'the web API must see done:true after the CLI marks it done');
      const pageAfter = await (await fetch(`${base}/`)).text();
      assert.match(pageAfter, /0 open, 1 done/);
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('AC-09: every valid fixture, rewritten by the CLI, is still accepted by the web reader', async () => {
  const expected = JSON.parse(readFileSync(join(fixtures, 'expected.json'), 'utf8'));
  const valid = readdirSync(fixtures).filter((f) => expected[f] === 'valid');
  assert.ok(valid.length >= 5, 'expected at least five valid fixtures');
  for (const name of valid) {
    const dir = mkdtempSync(join(tmpdir(), 'tasklet-rewrite-'));
    const file = join(dir, 'tasks.json');
    try {
      copyFileSync(join(fixtures, name), file);
      const before = JSON.parse(readFileSync(file, 'utf8'));
      const change = before.tasks.length
        ? cli(file, 'done', String(before.tasks[0].id))
        : cli(file, 'add', 'Added to an empty fixture');
      assert.equal(change.status, 0, `${name}: ${change.stderr}`);
      await withServer(file, async (base) => {
        const api = await fetch(`${base}/api/tasks`);
        assert.equal(api.status, 200, `${name}: web reader refused a file the CLI wrote`);
        const body = await api.json();
        assert.equal(body.tasks.length, Math.max(before.tasks.length, 1), name);
        // The fields must survive the rewrite, not only the count (QA finding F-09).
        const byId = new Map(body.tasks.map((t) => [t.id, t]));
        for (const [i, old] of before.tasks.entries()) {
          const now = byId.get(old.id);
          assert.ok(now, `${name}: task #${old.id} lost in the rewrite`);
          assert.equal(now.title, old.title, `${name}: title of #${old.id} changed`);
          assert.equal(now.created, old.created, `${name}: created of #${old.id} changed`);
          assert.equal(now.done, i === 0 ? true : old.done, `${name}: done of #${old.id} is wrong`);
          assert.deepEqual(Object.keys(now).sort(), ['created', 'done', 'id', 'title'], `${name}: unexpected fields on #${old.id}`);
        }
        const rewritten = JSON.parse(readFileSync(file, 'utf8'));
        assert.ok(rewritten.nextId >= before.nextId, `${name}: nextId went down`);
      });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});
