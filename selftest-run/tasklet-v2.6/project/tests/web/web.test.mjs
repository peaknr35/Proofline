// U4: AC-08, AC-09, AC-20 (web part), AC-22. Real `todo serve` child processes, HTTP to 127.0.0.1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, FIXTURES, fixtureJson, withTempDir } from '../foundation/helpers.mjs';
import { bodyChecks } from './checks.mjs';

const BIN = path.join(ROOT, 'bin', 'todo.mjs');
const SERVE = path.join(ROOT, 'src', 'serve.mjs');
const web = fixtureJson('web-cases.json');

function childEnv(file) {
  const env = { ...process.env, TODO_FILE: file };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

// Starts a child; resolves with its first stdout line, or with its exit if it ends first.
function startChild(args, file, cwd) {
  const child = spawn(process.execPath, [BIN, ...args], { env: childEnv(file), cwd });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (s) => { stderr += s; });
  const closed = new Promise((resolve) => child.on('close', (code) => resolve(code)));
  const ready = new Promise((resolve) => {
    child.stdout.on('data', (s) => {
      stdout += s;
      if (stdout.includes('\n')) resolve({ firstLine: stdout.split('\n')[0] });
    });
    closed.then((code) => resolve({ exit: code }));
  });
  return {
    child, ready, closed,
    out: () => stdout,
    err: () => stderr,
    stop: async () => { child.kill(); await closed; },
  };
}

function request(port, { method = 'GET', path: target = '/', host }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: target, headers: { host: host ?? `127.0.0.1:${port}` }, agent: false }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (s) => { body += s; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function prepare(start, dir) {
  const file = path.join(dir, 'todo.json');
  if (start === 'none') return { file, bytes: null };
  if (start === 'directory') {
    fs.mkdirSync(file);
    return { file, bytes: null };
  }
  fs.copyFileSync(path.join(FIXTURES, 'stores', start), file);
  return { file, bytes: fs.readFileSync(file) };
}

test('AC-08/AC-20: every web-cases.json case against a real todo serve', async (t) => {
  assert.ok(web.cases.length > 0);
  for (const c of web.cases) {
    await t.test(c.name, () => withTempDir(async (dir) => {
      const { file, bytes } = prepare(c.start, dir);
      const port = await freePort();
      const srv = startChild(['serve', '--port', String(port)], file, dir);
      try {
        const r = await srv.ready;
        assert.ok(r.firstLine, `server started; stderr=${srv.err()}`);
        const sub = (s) => s.replaceAll('<PORT>', String(port)).replaceAll('<FILE>', path.resolve(file));
        const res = await request(port, { method: c.method, path: sub(c.path), host: c.host && sub(c.host) });
        assert.equal(res.status, c.status, 'status');
        assert.equal(res.headers['content-type'], c.contentType, 'content-type');
        for (const [k, v] of Object.entries(web.commonHeaders)) assert.equal(res.headers[k], v, k);
        for (const [k, v] of Object.entries(c.headers ?? {})) assert.equal(res.headers[k], v, k);
        bodyChecks(c, res.body, sub);
      } finally {
        await srv.stop();
      }
      const end = c.end ?? (c.start === 'none' ? 'absent' : 'unchanged');
      if (end === 'absent') assert.ok(!fs.existsSync(file));
      else if (end === 'directory') assert.deepEqual(fs.readdirSync(file), []);
      else assert.ok(fs.readFileSync(file).equals(bytes), 'file unchanged');
      assert.equal(srv.err(), '', 'nothing on stderr');
    }));
  }
});

test('startup: first line, and listens on 127.0.0.1 only', () => withTempDir(async (dir) => {
  const c = web.startupCases.find((x) => x.name === 'startup line');
  const port = await freePort();
  const args = c.args.map((a) => a.replaceAll('<PORT>', String(port)));
  const srv = startChild(args, path.join(dir, 'todo.json'), dir);
  try {
    const r = await srv.ready;
    assert.equal(r.firstLine, c.stdoutFirstLine.replaceAll('<PORT>', String(port)));
    const v6 = await new Promise((resolve) => {
      const s = net.connect({ host: '::1', port }, () => { s.destroy(); resolve('connected'); });
      s.on('error', (e) => resolve(e.code));
    });
    assert.notEqual(v6, 'connected', 'not reachable on ::1');
  } finally {
    await srv.stop();
  }
}));

test('startup: default port 7070', (t) => withTempDir(async (dir) => {
  const c = web.startupCases.find((x) => x.name === 'default port');
  const busy = await new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(true));
    s.listen(7070, '127.0.0.1', () => s.close(() => resolve(false)));
  });
  if (busy) {
    t.skip('port 7070 is busy on this machine');
    return;
  }
  const srv = startChild(c.args, path.join(dir, 'todo.json'), dir);
  try {
    const r = await srv.ready;
    assert.equal(r.firstLine, c.stdoutFirstLine);
  } finally {
    await srv.stop();
  }
}));

test('startup: port in use gives exit 5 and the message', () => withTempDir(async (dir) => {
  const c = web.startupCases.find((x) => x.name === 'port in use');
  const blocker = net.createServer();
  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const busy = String(blocker.address().port);
  try {
    const args = c.args.map((a) => a.replaceAll('<BUSY>', busy));
    const r = spawnSync(process.execPath, [BIN, ...args], { env: childEnv(path.join(dir, 'todo.json')), cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, c.exit);
    assert.equal(r.stdout, c.stdout);
    assert.equal(r.stderr, c.stderr.replaceAll('<BUSY>', busy));
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
}));

test('AC-09: CLI and web view agree on one file', () => withTempDir(async (dir) => {
  const file = path.join(dir, 'todo.json');
  const port = await freePort();
  const srv = startChild(['serve', '--port', String(port)], file, dir);
  const cli = (...args) => spawnSync(process.execPath, [BIN, ...args], { env: childEnv(file), cwd: dir, encoding: 'utf8' });
  try {
    assert.ok((await srv.ready).firstLine);
    const before = await request(port, {});
    assert.ok(before.body.includes('<h2>Open (0)</h2>'));
    assert.equal(cli('add', 'x').status, 0);
    let page = (await request(port, {})).body;
    bodyChecks({ inOrder: ['<section id="open">', '<li data-id="1">x</li>', '<section id="done">'] }, page);
    assert.equal(cli('done', '1').status, 0);
    page = (await request(port, {})).body;
    bodyChecks({ inOrder: ['<section id="open">', '<section id="done">', '<li data-id="1">x</li>'], mustContain: ['<h2>Done (1)</h2>'] }, page);
    assert.equal(cli('remove', '1').status, 0);
    page = (await request(port, {})).body;
    assert.ok(!page.includes('data-id="1"'));
    assert.ok(page.includes('<h2>Done (0)</h2>'));
  } finally {
    await srv.stop();
  }
}));

test('AC-22: an unexpected error answers 500 Internal error and reveals nothing', () => withTempDir(async (dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-two.json'), file);
  const script = [
    `import { startServer } from ${JSON.stringify(pathToFileURL(SERVE).href)};`,
    `const { server } = await startServer({ file: ${JSON.stringify(file)}, port: 0, render: () => { throw new Error('SECRET-DETAIL'); } });`,
    'process.stdout.write(server.address().port + "\\n");',
  ].join('\n');
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env, cwd: dir });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (s) => { stderr += s; });
  const closed = new Promise((resolve) => child.on('close', resolve));
  try {
    const port = await new Promise((resolve, reject) => {
      child.stdout.on('data', (s) => {
        stdout += s;
        if (stdout.includes('\n')) resolve(Number(stdout.trim()));
      });
      closed.then(() => reject(new Error(`helper exited: ${stderr}`)));
    });
    const res = await request(port, {});
    assert.equal(res.status, 500);
    assert.equal(res.headers['content-type'], 'text/plain; charset=utf-8');
    for (const [k, v] of Object.entries(web.commonHeaders)) assert.equal(res.headers[k], v, k);
    assert.equal(res.body, 'Internal error\n');
    assert.ok(!JSON.stringify(res.headers).includes('SECRET'));
  } finally {
    child.kill();
    await closed;
  }
  assert.equal(stdout, stdout.split('\n')[0] + '\n', 'only the port line on stdout');
  assert.ok(!stdout.includes('SECRET') && !stderr.includes('SECRET'));
  assert.equal(stderr, '');
}));
