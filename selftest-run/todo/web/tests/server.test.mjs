// AC-06 (web side), AC-07 and the routes of SPEC section 7, against the real server.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createServer } from '../server.mjs';
import {
  fixture, copyFixture, tempDir, tempFile, start, request, task, listItems, textOf,
} from './helpers.mjs';

test('createServer({ file }) returns an http.Server that is not yet listening', (t) => {
  const server = createServer({ file: path.join(tempDir(t), 'tasks.json') });
  assert.ok(server instanceof http.Server);
  assert.equal(server.listening, false);
  assert.equal(server.address(), null);
});

test('createServer without a file is refused', () => {
  assert.throws(() => createServer({}), TypeError);
  assert.throws(() => createServer(), TypeError);
});

test('AC-07 valid-two.json: every task shown, done one marked, counts line', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-two.json'));
  const res = await request(port, '/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /^text\/html/);
  assert.match(res.body, /<html lang="en">/);
  assert.match(res.body, /<h1>Tasklet<\/h1>/);
  assert.match(res.body, /<ol[\s>]/);
  assert.ok(textOf(res.body).includes('1 open, 1 done'));
  assert.ok(!res.body.includes('No tasks yet.'));

  const items = listItems(res.body);
  assert.equal(items.length, 2);
  assert.equal(textOf(items[0]), '#1 Buy milk');
  assert.doesNotMatch(items[0], /class="done"/);
  assert.equal(textOf(items[1]), '#2 Call Sam Done');
  assert.match(items[1], /^<li class="done">/);
});

test('AC-07 valid-empty.json: empty state and 0 open, 0 done', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-empty.json'));
  const res = await request(port, '/');
  assert.equal(res.status, 200);
  const text = textOf(res.body);
  assert.ok(text.includes('No tasks yet.'));
  assert.ok(text.includes('0 open, 0 done'));
  assert.match(res.body, /<h1>Tasklet<\/h1>/);
  assert.equal(listItems(res.body).length, 0);
});

test('AC-07 valid-markup-title.json: the title is shown as text, never as markup', async (t) => {
  const file = copyFixture(t, 'valid-markup-title.json');
  const title = JSON.parse(fs.readFileSync(file, 'utf8')).tasks[0].title;
  assert.ok(title.includes('<script>'), 'the fixture carries the known-bad title');
  const { port } = await start(t, file);
  const res = await request(port, '/');
  assert.equal(res.status, 200);
  assert.ok(!/<script/i.test(res.body), 'no script element anywhere in the page');
  assert.ok(!res.body.includes(title), 'the raw title does not appear unescaped');
  assert.ok(res.body.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;'));
  const items = listItems(res.body);
  assert.equal(items.length, 1);
  assert.equal(textOf(items[0]), `#1 ${title}`);
  assert.ok(textOf(res.body).includes('1 open, 0 done'));
});

test('AC-07 escaping on a temp file: tags, attributes and entities in titles stay text', async (t) => {
  const titles = ['<img src=x onerror=alert(1)>', '"><b>bold</b>', "it's &amp; <!-- c -->", '</li></ol><h1>x</h1>'];
  const data = { version: 1, nextId: 5, tasks: titles.map((s, i) => task(i + 1, s, i % 2 === 1)) };
  const { port } = await start(t, tempFile(t, data));
  const res = await request(port, '/');
  assert.equal(res.status, 200);
  for (const s of titles) assert.ok(!res.body.includes(s), `raw title absent: ${s}`);
  assert.ok(!/<img|<b>|<!-- c -->/.test(res.body));
  assert.equal((res.body.match(/<h1>/g) || []).length, 1);
  const items = listItems(res.body);
  assert.equal(items.length, 4);
  items.forEach((item, i) => {
    assert.equal(textOf(item), `#${i + 1} ${titles[i]}${i % 2 === 1 ? ' Done' : ''}`);
  });
});

test('I-05 id order with open and done mixed; gaps in ids are kept (valid-gap-ids.json)', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-gap-ids.json'));
  const res = await request(port, '/');
  const items = listItems(res.body).map(textOf);
  assert.deepEqual(items, ['#2 Kept after a remove', '#5 Ids have gaps Done']);
  assert.ok(textOf(res.body).includes('1 open, 1 done'));
});

test('I-05 a file whose tasks are out of id order is shown in id order', async (t) => {
  const data = { version: 1, nextId: 10, tasks: [task(7, 'seven', true), task(2, 'two'), task(4, 'four', true)] };
  const { port } = await start(t, tempFile(t, data));
  const page = await request(port, '/');
  assert.deepEqual(listItems(page.body).map(textOf), ['#2 two', '#4 four Done', '#7 seven Done']);
  assert.ok(textOf(page.body).includes('1 open, 2 done'));
  const api = JSON.parse((await request(port, '/api/tasks')).body);
  assert.deepEqual(api.tasks.map((x) => x.id), [2, 4, 7]);
});

test('I-04 the page is read-only: no forms, buttons, inputs, links or scripts', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-two.json'));
  const res = await request(port, '/');
  assert.ok(!/<(form|button|input|select|textarea|script|a)[\s>]/i.test(res.body));
  assert.match(res.body, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
});

test('GET /api/tasks: 200, application/json, {"tasks":[...]} with the file task fields', async (t) => {
  const file = copyFixture(t, 'valid-two.json');
  const { port } = await start(t, file);
  const res = await request(port, '/api/tasks');
  assert.equal(res.status, 200);
  assert.equal(res.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(res.body), { tasks: JSON.parse(fs.readFileSync(file, 'utf8')).tasks });
});

test('GET /api/tasks: valid-empty.json gives {"tasks":[]}', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-empty.json'));
  const res = await request(port, '/api/tasks');
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body), { tasks: [] });
});

test('GET /api/tasks: unknown fields are not passed on (valid-unknown-fields.json)', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-unknown-fields.json'));
  const body = JSON.parse((await request(port, '/api/tasks')).body);
  assert.deepEqual(body, {
    tasks: [{ id: 1, title: 'Has an extra field', done: false, created: '2026-11-13T09:00:00.000Z' }],
  });
});

test('GET /api/tasks: a markup title comes back as the same string', async (t) => {
  const file = copyFixture(t, 'valid-markup-title.json');
  const { port } = await start(t, file);
  const body = JSON.parse((await request(port, '/api/tasks')).body);
  assert.equal(body.tasks[0].title, JSON.parse(fs.readFileSync(file, 'utf8')).tasks[0].title);
});

test('AC-06 invalid-not-json.json: page answers 500 with the message, no stack trace, file untouched', async (t) => {
  const file = copyFixture(t, 'invalid-not-json.json');
  const before = fs.readFileSync(file);
  const dirBefore = fs.readdirSync(path.dirname(file));
  const { port } = await start(t, file);

  const page = await request(port, '/');
  assert.equal(page.status, 500);
  assert.ok(textOf(page.body).includes('Cannot read tasks file'));
  assert.match(page.body, /<h1>Tasklet<\/h1>/);

  const api = await request(port, '/api/tasks');
  assert.equal(api.status, 500);
  assert.equal(api.headers['content-type'], 'application/json');
  assert.equal(api.body, '{"error":"Cannot read tasks file"}');

  for (const body of [page.body, api.body]) {
    assert.ok(!/SyntaxError|JSON\.parse|Unexpected|position \d|\bat .*\(|node:|\.mjs|cut off/.test(body), 'no stack trace or parser detail');
    assert.ok(!body.includes(file) && !body.includes(path.dirname(file)), 'no file path');
  }
  assert.ok(before.equals(fs.readFileSync(file)), 'bad file is byte-identical');
  assert.deepEqual(fs.readdirSync(path.dirname(file)), dirBefore, 'nothing written next to it');
});

test('AC-06 a path that is a folder answers 500 the same way', async (t) => {
  const { port } = await start(t, tempDir(t));
  const page = await request(port, '/');
  assert.equal(page.status, 500);
  assert.ok(page.body.includes('Cannot read tasks file'));
  const api = await request(port, '/api/tasks');
  assert.equal(api.status, 500);
  assert.deepEqual(JSON.parse(api.body), { error: 'Cannot read tasks file' });
});

test('a missing file is an empty list on both routes and is never created', async (t) => {
  const dir = tempDir(t);
  const file = path.join(dir, 'tasks.json');
  const { port } = await start(t, file);
  const page = await request(port, '/');
  assert.equal(page.status, 200);
  assert.ok(page.body.includes('No tasks yet.'));
  assert.ok(textOf(page.body).includes('0 open, 0 done'));
  const api = await request(port, '/api/tasks');
  assert.equal(api.status, 200);
  assert.deepEqual(JSON.parse(api.body), { tasks: [] });
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('the file is read fresh on every request (no cache), including bad then good again', async (t) => {
  const file = tempFile(t, { version: 1, nextId: 2, tasks: [task(1, 'first')] });
  const { port } = await start(t, file);
  assert.deepEqual(listItems((await request(port, '/')).body).map(textOf), ['#1 first']);

  fs.writeFileSync(file, JSON.stringify({ version: 1, nextId: 3, tasks: [task(1, 'first', true), task(2, 'second')] }));
  assert.deepEqual(listItems((await request(port, '/')).body).map(textOf), ['#1 first Done', '#2 second']);
  const api = JSON.parse((await request(port, '/api/tasks')).body);
  assert.deepEqual(api.tasks.map((x) => [x.id, x.done]), [[1, true], [2, false]]);

  fs.writeFileSync(file, '{ broken');
  assert.equal((await request(port, '/')).status, 500);
  assert.equal((await request(port, '/api/tasks')).status, 500);

  fs.writeFileSync(file, JSON.stringify({ version: 1, nextId: 3, tasks: [] }));
  const page = await request(port, '/');
  assert.equal(page.status, 200);
  assert.ok(page.body.includes('No tasks yet.'));
  assert.equal(page.headers['cache-control'], 'no-store');
});

test('the server reads the file it was given, not another one', async (t) => {
  const a = tempFile(t, { version: 1, nextId: 2, tasks: [task(1, 'only in A')] });
  const b = tempFile(t, { version: 1, nextId: 2, tasks: [task(1, 'only in B')] });
  const sa = await start(t, a);
  const sb = await start(t, b);
  assert.ok((await request(sa.port, '/')).body.includes('only in A'));
  assert.ok(!(await request(sa.port, '/')).body.includes('only in B'));
  assert.ok((await request(sb.port, '/')).body.includes('only in B'));
});

test('any other path answers 404 in plain text', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-two.json'));
  for (const p of ['/nope', '/api', '/api/tasks/1', '/api/tasks/', '/index.html', '/favicon.ico']) {
    const res = await request(port, p);
    assert.equal(res.status, 404, p);
    assert.match(res.headers['content-type'], /^text\/plain/, p);
    assert.ok(!res.body.includes('Buy milk'), p);
  }
});

test('any other method answers 405 in plain text and changes nothing', async (t) => {
  const file = copyFixture(t, 'valid-two.json');
  const before = fs.readFileSync(file);
  const { port } = await start(t, file);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
    for (const p of ['/', '/api/tasks']) {
      const res = await request(port, p, method);
      assert.equal(res.status, 405, `${method} ${p}`);
      assert.match(res.headers['content-type'], /^text\/plain/, `${method} ${p}`);
      assert.equal(res.headers.allow, 'GET');
    }
  }
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('a query string does not change the route', async (t) => {
  const { port } = await start(t, copyFixture(t, 'valid-two.json'));
  assert.equal((await request(port, '/?x=1')).status, 200);
  assert.equal((await request(port, '/api/tasks?x=1')).status, 200);
});

test('serving every route never changes a valid data file', async (t) => {
  const file = copyFixture(t, 'valid-unknown-fields.json');
  const before = fs.readFileSync(file);
  const stat = fs.statSync(file);
  const { port } = await start(t, file);
  await request(port, '/');
  await request(port, '/api/tasks');
  await request(port, '/nope');
  assert.ok(before.equals(fs.readFileSync(file)));
  assert.equal(fs.statSync(file).mtimeMs, stat.mtimeMs);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['tasks.json']);
});

test('the golden fixtures folder is used read-only by these tests', () => {
  assert.ok(fs.existsSync(fixture('expected.json')));
});
