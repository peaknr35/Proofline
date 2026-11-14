// Tasklet web view: a read-only page and JSON route over the data file.
// Contract: SPEC.md sections 5, 6, 7, 8 and 14. Node built-ins only.
// This file has its own reader of the data file. It never imports from cli/
// and it never writes the data file.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOST = '127.0.0.1';
export const DEFAULT_PORT = 4173;
export const DEFAULT_FILE = './tasks.json';
export const READ_ERROR = 'Cannot read tasks file';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Validate a parsed data file against SPEC section 6.
 * Returns { ok: true, nextId, tasks } with tasks reduced to the four contract
 * fields and sorted by id, or { ok: false, reason }.
 */
export function validateData(data) {
  if (!isObject(data)) return { ok: false, reason: 'top level is not an object' };
  if (data.version !== 1) return { ok: false, reason: 'version is not 1' };
  if (!Number.isInteger(data.nextId) || data.nextId < 1) {
    return { ok: false, reason: 'nextId is not an integer of at least 1' };
  }
  if (!Array.isArray(data.tasks)) return { ok: false, reason: 'tasks is not an array' };

  const seen = new Set();
  const tasks = [];
  for (let i = 0; i < data.tasks.length; i += 1) {
    const t = data.tasks[i];
    const where = `task at index ${i}`;
    if (!isObject(t)) return { ok: false, reason: `${where} is not an object` };
    if (!Number.isInteger(t.id) || t.id < 1) {
      return { ok: false, reason: `${where}: id is not a positive integer` };
    }
    if (seen.has(t.id)) return { ok: false, reason: `${where}: duplicate id ${t.id}` };
    seen.add(t.id);
    if (t.id >= data.nextId) {
      return { ok: false, reason: `${where}: nextId is not greater than id ${t.id}` };
    }
    if (typeof t.title !== 'string') return { ok: false, reason: `${where}: title is not a string` };
    const length = [...t.title.trim()].length;
    if (length < 1 || length > 200) {
      return { ok: false, reason: `${where}: title is not 1-200 characters after trimming` };
    }
    if (typeof t.done !== 'boolean') return { ok: false, reason: `${where}: done is not a boolean` };
    if (typeof t.created !== 'string') return { ok: false, reason: `${where}: created is not a string` };
    tasks.push({ id: t.id, title: t.title, done: t.done, created: t.created });
  }
  tasks.sort((a, b) => a.id - b.id);
  return { ok: true, nextId: data.nextId, tasks };
}

/**
 * Read and validate the data file. A missing file is an empty list.
 * Never throws and never writes.
 */
export function readTasks(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return { ok: true, nextId: 1, tasks: [] };
    return { ok: false, reason: `cannot read file (${(err && err.code) || 'error'})` };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not valid JSON' };
  }
  return validateData(data);
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLE = `
  body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 0 auto; padding: 1rem; max-width: 40rem; }
  h1 { margin: 0 0 0.5rem; }
  ol { list-style: none; margin: 0; padding: 0; }
  li { padding: 0.5rem 0; border-top: 1px solid #ccc; overflow-wrap: anywhere; word-break: break-word; }
  .id { color: #555; }
  li.done .title { text-decoration: line-through; }
  .state { font-weight: bold; }
`;

function page(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tasklet</title>
<style>${STYLE}</style>
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
  const done = tasks.filter((t) => t.done).length;
  const open = tasks.length - done;
  const summary = `<p id="summary">${open} open, ${done} done</p>`;
  if (tasks.length === 0) {
    return page(`${summary}\n<p id="empty">No tasks yet.</p>`);
  }
  const items = tasks.map((t) => {
    const cls = t.done ? ' class="done"' : '';
    const state = t.done ? ' <span class="state">Done</span>' : '';
    return `<li${cls}><span class="id">#${t.id}</span> <span class="title">${escapeHtml(t.title)}</span>${state}</li>`;
  });
  return page(`${summary}\n<ol id="tasks">\n${items.join('\n')}\n</ol>`);
}

export function renderErrorPage() {
  return page(`<p id="error" role="alert">${READ_ERROR}</p>`);
}

function send(res, status, type, body, extra = {}) {
  res.writeHead(status, {
    'content-type': type,
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extra,
  });
  res.end(body);
}

const HTML = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json';
const TEXT = 'text/plain; charset=utf-8';

/**
 * Create the web view server for one data file. The server is returned not
 * yet listening; the file is read fresh on every request and never written.
 */
export function createServer({ file } = {}) {
  if (typeof file !== 'string' || file === '') {
    throw new TypeError('createServer({ file }) needs the path of the data file');
  }
  return http.createServer((req, res) => {
    try {
      if (req.method !== 'GET') {
        send(res, 405, TEXT, 'Method Not Allowed\n', { allow: 'GET' });
        return;
      }
      const pathname = String(req.url || '/').split('?')[0].split('#')[0];
      if (pathname === '/') {
        const result = readTasks(file);
        if (!result.ok) send(res, 500, HTML, renderErrorPage());
        else send(res, 200, HTML, renderPage(result.tasks));
        return;
      }
      if (pathname === '/api/tasks') {
        const result = readTasks(file);
        if (!result.ok) send(res, 500, JSON_TYPE, JSON.stringify({ error: READ_ERROR }));
        else send(res, 200, JSON_TYPE, JSON.stringify({ tasks: result.tasks }));
        return;
      }
      send(res, 404, TEXT, 'Not Found\n');
    } catch {
      // Never leak a stack trace.
      if (!res.headersSent) send(res, 500, TEXT, `${READ_ERROR}\n`);
      else res.end();
    }
  });
}

/** Parse command-line settings (SPEC section 5). Throws Error with a usage message. */
export function parseArgs(argv, env = {}) {
  let file;
  let port = DEFAULT_PORT;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') {
      const value = argv[i + 1];
      if (value === undefined || value === '') throw new Error('--file needs a path');
      file = value;
      i += 1;
    } else if (arg === '--port') {
      const value = argv[i + 1];
      if (value === undefined || !/^[0-9]+$/.test(value)) {
        throw new Error('--port needs an integer from 1 to 65535');
      }
      port = Number(value);
      if (port < 1 || port > 65535) throw new Error('--port needs an integer from 1 to 65535');
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (file === undefined) file = env.TODO_FILE ? env.TODO_FILE : DEFAULT_FILE;
  return { file, port };
}

function isMain() {
  if (!process.argv[1]) return false;
  try {
    let a = fs.realpathSync(path.resolve(process.argv[1]));
    let b = fs.realpathSync(fileURLToPath(import.meta.url));
    if (process.platform === 'win32') {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return a === b;
  } catch {
    return false;
  }
}

if (isMain()) {
  let settings;
  try {
    settings = parseArgs(process.argv.slice(2), process.env);
  } catch (err) {
    process.stderr.write(`${err.message}\nUsage: node web/server.mjs [--file path] [--port 4173]\n`);
    process.exit(1);
  }
  const server = createServer({ file: settings.file });
  server.on('error', (err) => {
    const reason = err && err.code === 'EADDRINUSE' ? 'port already in use' : (err && err.code) || 'error';
    process.stderr.write(`Cannot start web view on ${HOST}:${settings.port}: ${reason}\n`);
    process.exit(1);
  });
  server.listen(settings.port, HOST, () => {
    process.stdout.write(`Tasklet web view: http://${HOST}:${server.address().port}\n`);
  });
}
