import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURES = path.join(ROOT, 'contract', 'fixtures');

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-web-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function fixtureCopy(t, name) {
  const copy = path.join(tempDir(t), 'tasks.json');
  fs.copyFileSync(path.join(FIXTURES, name), copy);
  return copy;
}

async function start(t, file) {
  const server = createServer({ file });
  assert.ok(server instanceof http.Server);
  assert.equal(server.listening, false, 'createServer does not listen by itself');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (p, init) => {
    const res = await fetch(base + p, init);
    return { status: res.status, type: res.headers.get('content-type'), body: await res.text() };
  };
}

const items = (html) => [...html.matchAll(/<li([^>]*)>([\s\S]*?)<\/li>/g)].map((m) => ({ attrs: m[1], inner: m[2] }));

test('AC-07 page shows every task with done ones marked (valid-two.json)', async (t) => {
  const file = fixtureCopy(t, 'valid-two.json');
  const before = fs.readFileSync(file);
  const get = await start(t, file);
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.type, /^text\/html/);
  assert.match(r.body, /^<!doctype html>/i);
  assert.match(r.body, /<html lang="en">/);
  assert.match(r.body, /<meta name="viewport"/);
  assert.match(r.body, /<title>Tasklet<\/title>/);
  assert.match(r.body, /<h1>Tasklet<\/h1>/);
  assert.match(r.body, /1 open, 1 done/);
  assert.match(r.body, /<ol>/);
  assert.doesNotMatch(r.body, /No tasks yet\./);

  const li = items(r.body);
  assert.equal(li.length, 2);
  assert.ok(li[0].inner.startsWith('#1 Buy milk'));
  assert.doesNotMatch(li[0].attrs, /done/);
  assert.doesNotMatch(li[0].inner, /Done/);
  assert.ok(li[1].inner.startsWith('#2 Call Sam'));
  assert.match(li[1].attrs, /class="done"/);
  assert.match(li[1].inner, /Done/);

  // read-only: no buttons, forms, scripts or outside resources
  assert.doesNotMatch(r.body, /<(button|form|input|script|link|img|iframe|a)\b/i);
  assert.doesNotMatch(r.body, /https?:\/\//);
  assert.ok(before.equals(fs.readFileSync(file)), 'the web never writes the file');
});

test('AC-07 empty list shows No tasks yet. and 0 open, 0 done (valid-empty.json)', async (t) => {
  const get = await start(t, fixtureCopy(t, 'valid-empty.json'));
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.body, /No tasks yet\./);
  assert.match(r.body, /0 open, 0 done/);
  assert.equal(items(r.body).length, 0);
});

test('AC-07 a missing file is an empty list, not an error', async (t) => {
  const file = path.join(tempDir(t), 'nothing-here.json');
  const get = await start(t, file);
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.body, /No tasks yet\./);
  const api = await get('/api/tasks');
  assert.equal(api.status, 200);
  assert.deepEqual(JSON.parse(api.body), { tasks: [] });
  assert.equal(fs.existsSync(file), false, 'the web does not create the file');
});

test('AC-07 known-bad: titles are text, never markup (valid-markup-title.json)', async (t) => {
  const get = await start(t, fixtureCopy(t, 'valid-markup-title.json'));
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.doesNotMatch(r.body, /<script/i);
  assert.doesNotMatch(r.body, /<\/script/i);
  assert.ok(r.body.includes('#1 &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;'));
  assert.match(r.body, /1 open, 0 done/);

  const api = await get('/api/tasks');
  assert.equal(JSON.parse(api.body).tasks[0].title, '<script>alert(1)</script> & "quotes"');
});

test('single quotes in titles are escaped too', async (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  fs.writeFileSync(
    file,
    JSON.stringify({ version: 1, nextId: 2, tasks: [{ id: 1, title: "it's <b>bold</b>", done: true, created: 'x' }] }),
  );
  const get = await start(t, file);
  const r = await get('/');
  assert.ok(r.body.includes('#1 it&#39;s &lt;b&gt;bold&lt;/b&gt;'));
  assert.doesNotMatch(r.body, /<b>/);
});

test('AC-06 bad file: 500 with Cannot read tasks file, no stack trace, no path, file untouched', async (t) => {
  const file = fixtureCopy(t, 'invalid-not-json.json');
  const before = fs.readFileSync(file);
  const get = await start(t, file);

  const r = await get('/');
  assert.equal(r.status, 500);
  assert.match(r.body, /Cannot read tasks file/);
  assert.doesNotMatch(r.body, /SyntaxError|JSON|\bat .+:\d+|node:|\.mjs/);
  assert.ok(!r.body.includes(file) && !r.body.includes(path.dirname(file)));
  assert.equal(items(r.body).length, 0);

  const api = await get('/api/tasks');
  assert.equal(api.status, 500);
  assert.match(api.type, /^application\/json/);
  assert.deepEqual(JSON.parse(api.body), { error: 'Cannot read tasks file' });
  assert.equal(api.body, '{"error":"Cannot read tasks file"}');

  assert.ok(before.equals(fs.readFileSync(file)));
});

test('AC-05 the web reader accepts every valid fixture and refuses every invalid one', async (t) => {
  const expected = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'expected.json'), 'utf8'));
  const names = Object.keys(expected);
  assert.ok(names.length > 0);
  for (const name of names) {
    const verdict = expected[name];
    assert.ok(verdict === 'valid' || verdict === 'invalid', `verdict for ${name}`);
    const get = await start(t, path.join(FIXTURES, name)); // the web never writes, so no copy is needed
    const want = verdict === 'valid' ? 200 : 500;
    assert.equal((await get('/')).status, want, `GET / for ${name}`);
    assert.equal((await get('/api/tasks')).status, want, `GET /api/tasks for ${name}`);
  }
});

test('GET /api/tasks returns {"tasks":[...]} with exactly the four task fields', async (t) => {
  const get = await start(t, fixtureCopy(t, 'valid-unknown-fields.json'));
  const r = await get('/api/tasks');
  assert.equal(r.status, 200);
  assert.match(r.type, /^application\/json/);
  const body = JSON.parse(r.body);
  assert.deepEqual(Object.keys(body), ['tasks']);
  assert.deepEqual(body.tasks, [
    { id: 1, title: 'Has an extra field', done: false, created: '2026-11-13T09:00:00.000Z' },
  ]);

  const two = await (await start(t, fixtureCopy(t, 'valid-two.json')))('/api/tasks?x=1');
  assert.equal(two.status, 200);
  assert.deepEqual(
    JSON.parse(two.body).tasks.map((x) => [x.id, x.done]),
    [
      [1, false],
      [2, true],
    ],
  );
});

test('page and API list tasks in id order even when the file is not', async (t) => {
  const file = path.join(tempDir(t), 'tasks.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      version: 1,
      nextId: 8,
      tasks: [
        { id: 7, title: 'seven', done: true, created: 'a' },
        { id: 3, title: 'three', done: false, created: 'b' },
      ],
    }),
  );
  const get = await start(t, file);
  const li = items((await get('/')).body);
  assert.ok(li[0].inner.startsWith('#3 three'));
  assert.ok(li[1].inner.startsWith('#7 seven'));
  assert.deepEqual(JSON.parse((await get('/api/tasks')).body).tasks.map((x) => x.id), [3, 7]);
});

test('any other path is 404 plain text; any other method on a known path is 405 plain text', async (t) => {
  const file = fixtureCopy(t, 'valid-two.json');
  const before = fs.readFileSync(file);
  const get = await start(t, file);
  for (const p of ['/nope', '/api', '/api/tasks/', '/api/tasks/1', '/index.html']) {
    const r = await get(p);
    assert.equal(r.status, 404, p);
    assert.match(r.type, /^text\/plain/, p);
  }
  for (const p of ['/', '/api/tasks']) {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const r = await get(p, { method, body: 'x' });
      assert.equal(r.status, 405, `${method} ${p}`);
      assert.match(r.type, /^text\/plain/, `${method} ${p}`);
    }
  }
  assert.equal((await get('/nope', { method: 'POST', body: 'x' })).status, 404);
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('the file is read fresh on every request (no cache)', async (t) => {
  const file = fixtureCopy(t, 'valid-empty.json');
  const get = await start(t, file);
  assert.match((await get('/')).body, /No tasks yet\./);

  fs.copyFileSync(path.join(FIXTURES, 'valid-two.json'), file);
  const second = await get('/');
  assert.match(second.body, /#1 Buy milk/);
  assert.match(second.body, /1 open, 1 done/);
  assert.equal(JSON.parse((await get('/api/tasks')).body).tasks.length, 2);

  fs.copyFileSync(path.join(FIXTURES, 'invalid-not-json.json'), file);
  assert.equal((await get('/')).status, 500);

  fs.copyFileSync(path.join(FIXTURES, 'valid-gap-ids.json'), file);
  const fourth = await get('/');
  assert.equal(fourth.status, 200);
  assert.match(fourth.body, /#5 Ids have gaps/);
});

test('web/server.mjs does not import from cli/', () => {
  const src = fs.readFileSync(path.join(ROOT, 'web', 'server.mjs'), 'utf8');
  const specs = [...src.matchAll(/\bimport\b[^'"]*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.ok(specs.length > 0);
  for (const s of specs) assert.match(s, /^node:/, `import of ${s}`);
});
