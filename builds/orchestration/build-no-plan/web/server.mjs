#!/usr/bin/env node
// Tasklet web view: a read-only page showing the tasks in the data file.
// Reads the file fresh on every request and never writes it.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const MAX_TITLE = 200;
const READ_ERROR = 'Cannot read tasks file';

/** Parse and validate the text of a data file. Returns the tasks in id order, or throws. */
export function parseTasks(text) {
  const data = JSON.parse(text.replace(/^﻿/, ''));
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
  if (data.version !== 1) throw new Error('bad version');
  if (!Number.isInteger(data.nextId) || data.nextId < 1) throw new Error('bad nextId');
  if (!Array.isArray(data.tasks)) throw new Error('tasks not an array');
  const seen = new Set();
  const tasks = data.tasks.map((t) => {
    if (t === null || typeof t !== 'object' || Array.isArray(t)) throw new Error('task not an object');
    if (!Number.isInteger(t.id) || t.id < 1) throw new Error('bad id');
    if (seen.has(t.id)) throw new Error('duplicate id');
    seen.add(t.id);
    if (t.id >= data.nextId) throw new Error('nextId too low');
    if (typeof t.title !== 'string') throw new Error('bad title');
    const len = [...t.title.trim()].length;
    if (len < 1 || len > MAX_TITLE) throw new Error('bad title length');
    if (typeof t.done !== 'boolean') throw new Error('bad done');
    if (typeof t.created !== 'string') throw new Error('bad created');
    return { id: t.id, title: t.title, done: t.done, created: t.created };
  });
  tasks.sort((a, b) => a.id - b.id);
  return tasks;
}

/** Read the tasks from the data file. A missing file is an empty list. Throws when unreadable or invalid. */
export function readTasks(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
  return parseTasks(text);
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tasklet</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 0 auto; padding: 1rem; max-width: 40rem; }
  h1 { margin: 0 0 0.5rem; }
  ol { list-style: none; padding: 0; margin: 1rem 0; }
  li { padding: 0.5rem 0; border-bottom: 1px solid #8884; overflow-wrap: anywhere; word-break: break-word; }
  li.done .title { text-decoration: line-through; }
  .badge { font-size: 0.85em; font-weight: 600; border: 1px solid currentColor; border-radius: 0.25rem; padding: 0 0.35rem; margin-left: 0.25rem; white-space: nowrap; }
</style>
</head>
<body>
<main>
<h1>Tasklet</h1>
${bodyHtml}
</main>
</body>
</html>
`;
}

export function renderPage(tasks) {
  const doneCount = tasks.filter((t) => t.done).length;
  const openCount = tasks.length - doneCount;
  const summary = `<p class="summary">${openCount} open, ${doneCount} done</p>`;
  if (tasks.length === 0) {
    return page(`${summary}\n<p class="empty">No tasks yet.</p>`);
  }
  const items = tasks
    .map((t) => {
      const text = `<span class="title">#${t.id} ${escapeHtml(t.title)}</span>`;
      return t.done
        ? `<li class="done">${text} <span class="badge">Done</span></li>`
        : `<li>${text}</li>`;
    })
    .join('\n');
  return page(`${summary}\n<h2>Tasks</h2>\n<ol>\n${items}\n</ol>`);
}

export function renderErrorPage() {
  return page(`<p class="error" role="alert">${READ_ERROR}</p>`);
}

function send(res, status, type, body, extra = {}) {
  const buf = Buffer.from(body, 'utf8');
  res.writeHead(status, {
    'content-type': type,
    'content-length': buf.length,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extra,
  });
  res.end(buf);
}

const HTML = 'text/html; charset=utf-8';
const TEXT = 'text/plain; charset=utf-8';
const JSON_TYPE = 'application/json';
const CSP = { 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" };

/** Create the web server (not yet listening). */
export function createServer({ file } = {}) {
  const dataFile = file ?? process.env.TODO_FILE ?? './tasks.json';
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    } catch {
      return send(res, 404, TEXT, 'Not found\n');
    }
    if (pathname !== '/' && pathname !== '/api/tasks') {
      return send(res, 404, TEXT, 'Not found\n');
    }
    if (req.method !== 'GET') {
      return send(res, 405, TEXT, 'Method not allowed\n', { allow: 'GET' });
    }
    let tasks;
    try {
      tasks = readTasks(dataFile);
    } catch {
      // Never leak the reason or a stack trace to the browser.
      if (pathname === '/') return send(res, 500, HTML, renderErrorPage(), CSP);
      return send(res, 500, JSON_TYPE, JSON.stringify({ error: READ_ERROR }));
    }
    if (pathname === '/') return send(res, 200, HTML, renderPage(tasks), CSP);
    return send(res, 200, JSON_TYPE, JSON.stringify({ tasks }));
  });
}

function parseCli(argv, env) {
  let file = env.TODO_FILE ? env.TODO_FILE : './tasks.json';
  let port = DEFAULT_PORT;
  const fail = (msg) => {
    throw new Error(msg);
  };
  const toPort = (raw) => {
    if (raw === undefined || !/^[0-9]+$/.test(raw)) fail('--port must be a whole number from 1 to 65535');
    const n = Number(raw);
    if (n < 1 || n > 65535) fail('--port must be a whole number from 1 to 65535');
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') {
      file = argv[++i];
      if (!file) fail('--file needs a path');
    } else if (a.startsWith('--file=')) {
      file = a.slice(7);
      if (!file) fail('--file needs a path');
    } else if (a === '--port') {
      port = toPort(argv[++i]);
    } else if (a.startsWith('--port=')) {
      port = toPort(a.slice(7));
    } else {
      fail(`Unknown argument ${a}`);
    }
  }
  return { file, port };
}

function isRunDirectly() {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(self);
  } catch {
    return path.resolve(process.argv[1]) === self;
  }
}

if (isRunDirectly()) {
  let opts;
  try {
    opts = parseCli(process.argv.slice(2), process.env);
  } catch (err) {
    process.stderr.write(`${err.message}\nUsage: node web/server.mjs [--port <n>] [--file <path>]\n`);
    process.exit(1);
  }
  const server = createServer({ file: opts.file });
  server.on('error', (err) => {
    process.stderr.write(`Cannot start web view: ${err.code ?? err.message}\n`);
    process.exitCode = 1;
  });
  server.listen(opts.port, HOST, () => {
    process.stdout.write(`Tasklet web view: http://${HOST}:${server.address().port}\n`);
  });
}
