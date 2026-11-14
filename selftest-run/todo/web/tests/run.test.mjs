// Settings (SPEC section 5) and running web/server.mjs directly (SPEC section 7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from '../server.mjs';
import { SERVER_PATH, copyFixture, tempDir, request } from './helpers.mjs';

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

/** Kill a spawned server and wait until it has gone (it may hold a temp dir as its working folder). */
function stop(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
    child.once('close', resolve);
    child.kill();
  });
}

/** Spawn the server; resolves with the first stdout line, or with the exit result. */
function run(t, args, env = {}, cwd = undefined) {
  const child = spawn(process.execPath, [SERVER_PATH, ...args], {
    env: { ...process.env, TODO_FILE: '', ...env },
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Backup only: each test stops its child itself, before its temp dir is removed.
  t.after(() => stop(child));
  let out = '';
  let err = '';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout; stdout=${out} stderr=${err}`)), 15000);
    child.stdout.on('data', (c) => {
      out += c;
      if (out.includes('\n')) { clearTimeout(timer); resolve({ child, out, err, code: null }); }
    });
    child.stderr.on('data', (c) => { err += c; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ child, out, err, code }); });
  });
}

test('parseArgs: defaults are ./tasks.json and port 4173', () => {
  assert.deepEqual(parseArgs([], {}), { file: './tasks.json', port: 4173 });
});

test('parseArgs: --file wins, then TODO_FILE, then the default', () => {
  assert.equal(parseArgs(['--file', 'a.json'], { TODO_FILE: 'b.json' }).file, 'a.json');
  assert.equal(parseArgs([], { TODO_FILE: 'b.json' }).file, 'b.json');
  assert.equal(parseArgs([], { TODO_FILE: '' }).file, './tasks.json');
});

test('parseArgs: --port accepts 1-65535 only', () => {
  assert.equal(parseArgs(['--port', '1'], {}).port, 1);
  assert.equal(parseArgs(['--port', '65535'], {}).port, 65535);
  assert.equal(parseArgs(['--port', '8080', '--file', 'x.json'], {}).port, 8080);
  for (const badPort of ['0', '65536', '-1', 'abc', '80.5', '', '1e3']) {
    assert.throws(() => parseArgs(['--port', badPort], {}), /--port/, badPort);
  }
  assert.throws(() => parseArgs(['--port'], {}), /--port/);
  assert.throws(() => parseArgs(['--file'], {}), /--file/);
  assert.throws(() => parseArgs(['--bogus'], {}), /Unknown argument/);
});

test('run directly: listens on 127.0.0.1, prints the address line, serves --file', async (t) => {
  const file = copyFixture(t, 'valid-two.json');
  const port = await freePort();
  const { child, out, code } = await run(t, ['--file', file, '--port', String(port)]);
  assert.equal(code, null, 'still running');
  assert.equal(out, `Tasklet web view: http://127.0.0.1:${port}\n`);
  const page = await request(port, '/');
  assert.equal(page.status, 200);
  assert.ok(page.body.includes('Buy milk'));
  const api = await request(port, '/api/tasks');
  assert.equal(JSON.parse(api.body).tasks.length, 2);
  await stop(child);
});

test('run directly: TODO_FILE is used when --file is absent', async (t) => {
  const file = copyFixture(t, 'valid-gap-ids.json');
  const port = await freePort();
  const { child, out } = await run(t, ['--port', String(port)], { TODO_FILE: file });
  assert.equal(out, `Tasklet web view: http://127.0.0.1:${port}\n`);
  const page = await request(port, '/');
  await stop(child);
  assert.ok(page.body.includes('Ids have gaps'));
});

test('run directly: with no --file and no TODO_FILE it reads ./tasks.json of the working folder', async (t) => {
  const file = copyFixture(t, 'valid-two.json'); // named tasks.json in a fresh temp dir
  const port = await freePort();
  const { child } = await run(t, ['--port', String(port)], {}, path.dirname(file));
  const page = await request(port, '/');
  await stop(child);
  assert.ok(page.body.includes('Call Sam'));
});

test('run directly: a bad --port exits 1 with a message on stderr and nothing on stdout', async (t) => {
  const { out, err, code } = await run(t, ['--port', '70000', '--file', path.join(tempDir(t), 'x.json')]);
  assert.equal(code, 1);
  assert.equal(out, '');
  assert.match(err, /--port needs an integer from 1 to 65535/);
  assert.ok(!/\n\s+at /.test(err), 'no stack trace');
});

test('run directly: a port already in use exits 1 with a message and no stack trace', async (t) => {
  const blocker = net.createServer();
  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => blocker.close(resolve)));
  const { port } = blocker.address();
  const { out, err, code } = await run(t, ['--port', String(port), '--file', path.join(tempDir(t), 'x.json')]);
  assert.equal(code, 1);
  assert.equal(out, '');
  assert.match(err, /port already in use/);
  assert.ok(!/\n\s+at /.test(err), 'no stack trace');
});
