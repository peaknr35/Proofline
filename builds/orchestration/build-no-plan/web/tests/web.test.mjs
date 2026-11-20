import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer, parseTasks } from '../server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(here, '..', 'server.mjs');
const FIXTURES = path.resolve(here, '..', '..', 'contract', 'fixtures');
const fx = (name) => path.join(FIXTURES, name);

function request(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function withServer(file, fn) {
  const server = createServer({ file });
  assert.ok(server instanceof http.Server);
  assert.equal(server.listening, false);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    return await fn(server.address().port);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test('AC-07 page shows every task, done ones marked, counts line', async () => {
  await withServer(fx('valid-two.json'), async (port) => {
    const r = await request(port, '/');
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /^text\/html/);
    assert.match(r.body, /<html lang="en">/);
    assert.match(r.body, /<h1>Tasklet<\/h1>/);
    assert.match(r.body, /1 open, 1 done/);
    assert.match(r.body, /<ol>/);
    const items = r.body.match(/<li[\s\S]*?<\/li>/g);
    assert.equal(items.length, 2);
    assert.match(items[0], /^<li>/);
    assert.match(items[0], /#1 Buy milk/);
    assert.doesNotMatch(items[0], /Done/);
    assert.match(items[1], /^<li class="done">/);
    assert.match(items[1], /#2 Call Sam/);
    assert.match(items[1], /Done/);
    assert.doesNotMatch(r.body, /<(button|form|input|script)\b/i);
    assert.doesNotMatch(r.body, /No tasks yet\./);
  });
});

test('AC-07 empty state', async () => {
  await withServer(fx('valid-empty.json'), async (port) => {
    const r = await request(port, '/');
    assert.equal(r.status, 200);
    assert.match(r.body, /0 open, 0 done/);
    assert.match(r.body, /No tasks yet\./);
    assert.doesNotMatch(r.body, /<li/);
  });
});

test('AC-07 titles are shown as text, never markup', async () => {
  await withServer(fx('valid-markup-title.json'), async (port) => {
    const r = await request(port, '/');
    assert.equal(r.status, 200);
    assert.doesNotMatch(r.body, /<script/i);
    assert.ok(r.body.includes('#1 &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;'));
    const api = await request(port, '/api/tasks');
    assert.equal(JSON.parse(api.body).tasks[0].title, '<script>alert(1)</script> & "quotes"');
  });
});

test('gap ids render in id order', async () => {
  await withServer(fx('valid-gap-ids.json'), async (port) => {
    const r = await request(port, '/');
    assert.ok(r.body.indexOf('#2 Kept after a remove') < r.body.indexOf('#5 Ids have gaps'));
    assert.match(r.body, /1 open, 1 done/);
  });
});

test('GET /api/tasks returns the tasks with the file fields', async () => {
  await withServer(fx('valid-unknown-fields.json'), async (port) => {
    const r = await request(port, '/api/tasks');
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /^application\/json/);
    assert.deepEqual(JSON.parse(r.body), {
      tasks: [{ id: 1, title: 'Has an extra field', done: false, created: '2026-11-13T09:00:00.000Z' }],
    });
  });
});

test('AC-05 fixtures: reader accepts valid and refuses invalid', async () => {
  const expected = JSON.parse(fs.readFileSync(fx('expected.json'), 'utf8'));
  assert.equal(Object.keys(expected).length, 13);
  for (const [name, verdict] of Object.entries(expected)) {
    const text = fs.readFileSync(fx(name), 'utf8');
    if (verdict === 'valid') assert.doesNotThrow(() => parseTasks(text), name);
    else assert.throws(() => parseTasks(text), name);
    await withServer(fx(name), async (port) => {
      const want = verdict === 'valid' ? 200 : 500;
      assert.equal((await request(port, '/')).status, want, name);
      assert.equal((await request(port, '/api/tasks')).status, want, name);
    });
  }
});

test('AC-06 bad file: 500, Cannot read tasks file, no stack trace, file untouched', async () => {
  const file = fx('invalid-not-json.json');
  const before = fs.readFileSync(file);
  await withServer(file, async (port) => {
    const r = await request(port, '/');
    assert.equal(r.status, 500);
    assert.match(r.body, /Cannot read tasks file/);
    assert.doesNotMatch(r.body, /\bat .*\(|SyntaxError|Unexpected|\.mjs|node:/);
    assert.ok(!r.body.includes(file));
    const api = await request(port, '/api/tasks');
    assert.equal(api.status, 500);
    assert.match(api.headers['content-type'], /^application\/json/);
    assert.deepEqual(JSON.parse(api.body), { error: 'Cannot read tasks file' });
  });
  assert.ok(before.equals(fs.readFileSync(file)));
});

test('other paths 404, other methods 405, plain text', async () => {
  await withServer(fx('valid-two.json'), async (port) => {
    const notFound = await request(port, '/nope');
    assert.equal(notFound.status, 404);
    assert.match(notFound.headers['content-type'], /^text\/plain/);
    for (const [p, m] of [['/', 'POST'], ['/api/tasks', 'DELETE'], ['/', 'PUT']]) {
      const r = await request(port, p, m);
      assert.equal(r.status, 405, `${m} ${p}`);
      assert.match(r.headers['content-type'], /^text\/plain/);
    }
    assert.equal((await request(port, '/?x=1')).status, 200);
  });
});

test('reads fresh on every request, missing file is empty, never writes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-web-'));
  const file = path.join(dir, 'tasks.json');
  await withServer(file, async (port) => {
    assert.match((await request(port, '/')).body, /No tasks yet\./);
    assert.deepEqual(JSON.parse((await request(port, '/api/tasks')).body), { tasks: [] });
    assert.equal(fs.existsSync(file), false);
    fs.copyFileSync(fx('valid-two.json'), file);
    assert.match((await request(port, '/')).body, /#1 Buy milk/);
    fs.copyFileSync(fx('invalid-not-json.json'), file);
    assert.equal((await request(port, '/')).status, 500);
    fs.copyFileSync(fx('valid-empty.json'), file);
    assert.equal((await request(port, '/')).status, 200);
    assert.deepEqual(fs.readdirSync(dir), ['tasks.json']);
  });
});

test('run directly: listens on 127.0.0.1 and prints the address; bad port exits 1', async () => {
  const probe = http.createServer();
  await new Promise((r) => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));

  const child = spawn(process.execPath, [SERVER, '--port', String(port), '--file', fx('valid-two.json')]);
  try {
    const line = await new Promise((resolve, reject) => {
      let out = '';
      child.stdout.on('data', (c) => {
        out += c;
        if (out.includes('\n')) resolve(out);
      });
      child.on('exit', () => reject(new Error('server exited early')));
    });
    assert.equal(line, `Tasklet web view: http://127.0.0.1:${port}\n`);
    assert.equal((await request(port, '/')).status, 200);
  } finally {
    child.kill();
  }

  for (const bad of ['0', '65536', 'abc']) {
    const code = await new Promise((resolve) => {
      spawn(process.execPath, [SERVER, '--port', bad]).on('exit', resolve);
    });
    assert.equal(code, 1, bad);
  }
});
