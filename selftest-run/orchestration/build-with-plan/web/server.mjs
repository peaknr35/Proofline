#!/usr/bin/env node
// Tasklet read-only web view. Node built-ins only. Never writes the data file.
import fs from 'node:fs';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const MAX_TITLE = 200;
const READ_ERROR = 'Cannot read tasks file';

// ---------- data file reader (this part's own copy of the rule) ----------

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function checkData(data) {
  if (!isObject(data)) throw new Error('not an object');
  if (data.version !== 1) throw new Error('version');
  if (!Number.isSafeInteger(data.nextId) || data.nextId < 1) throw new Error('nextId');
  if (!Array.isArray(data.tasks)) throw new Error('tasks');
  const seen = new Set();
  const tasks = [];
  for (const t of data.tasks) {
    if (!isObject(t)) throw new Error('task');
    if (!Number.isSafeInteger(t.id) || t.id < 1) throw new Error('id');
    if (seen.has(t.id)) throw new Error('duplicate id');
    seen.add(t.id);
    if (t.id >= data.nextId) throw new Error('nextId too low');
    if (typeof t.title !== 'string') throw new Error('title');
    const len = t.title.trim().length;
    if (len < 1 || len > MAX_TITLE) throw new Error('title length');
    if (typeof t.done !== 'boolean') throw new Error('done');
    if (typeof t.created !== 'string') throw new Error('created');
    tasks.push({ id: t.id, title: t.title, done: t.done, created: t.created });
  }
  tasks.sort((a, b) => a.id - b.id);
  return tasks;
}

// Returns the tasks in id order; a missing file is an empty list; anything else bad throws.
export function readTasks(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return checkData(JSON.parse(text));
}

// ---------- page ----------

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLE =
  'body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5;margin:0 auto;' +
  'max-width:40rem;padding:1rem;color:#1a1a1a;background:#fff}' +
  'h1{font-size:1.6rem;margin:0 0 .5rem}' +
  'ol{padding-left:2rem;margin:0}' +
  'li,p,h1{overflow-wrap:anywhere;word-break:break-word}' +
  'li{margin:.35rem 0}' +
  'li.done{color:#555}' +
  '.status{font-weight:600;font-size:.85em;border:1px solid #555;border-radius:.25rem;padding:0 .35rem}';

function page(inner) {
  return (
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Tasklet</title>\n<style>' +
    STYLE +
    '</style>\n</head>\n<body>\n<main>\n<h1>Tasklet</h1>\n' +
    inner +
    '</main>\n</body>\n</html>\n'
  );
}

function renderTasks(tasks) {
  const done = tasks.filter((t) => t.done).length;
  let inner = `<p>${tasks.length - done} open, ${done} done</p>\n`;
  if (tasks.length === 0) {
    inner += '<p>No tasks yet.</p>\n';
  } else {
    inner += '<ol>\n';
    for (const t of tasks) {
      const text = `#${t.id} ${escapeHtml(t.title)}`;
      inner += t.done
        ? `<li class="done">${text} <span class="status">Done</span></li>\n`
        : `<li>${text}</li>\n`;
    }
    inner += '</ol>\n';
  }
  return page(inner);
}

// ---------- server ----------

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
const TEXT = 'text/plain; charset=utf-8';
const JSON_TYPE = 'application/json';

export function createServer({ file } = {}) {
  if (typeof file !== 'string' || file === '') throw new TypeError('createServer needs { file }');
  return http.createServer((req, res) => {
    const pathname = String(req.url || '').split('?')[0];
    const known = pathname === '/' || pathname === '/api/tasks';
    if (!known) {
      req.resume();
      return send(res, 404, TEXT, 'Not found\n');
    }
    if (req.method !== 'GET') {
      req.resume();
      return send(res, 405, TEXT, 'Method not allowed\n', { allow: 'GET' });
    }
    let tasks;
    try {
      tasks = readTasks(file); // fresh on every request, never cached
    } catch {
      if (pathname === '/') return send(res, 500, HTML, page(`<p role="alert">${READ_ERROR}</p>\n`));
      return send(res, 500, JSON_TYPE, JSON.stringify({ error: READ_ERROR }));
    }
    if (pathname === '/') return send(res, 200, HTML, renderTasks(tasks));
    return send(res, 200, JSON_TYPE, JSON.stringify({ tasks }));
  });
}

// ---------- run directly ----------

function parseArgs(argv) {
  const out = { file: undefined, port: 4173 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    let name = a;
    let value;
    const eq = a.indexOf('=');
    if (a.startsWith('--') && eq !== -1) {
      name = a.slice(0, eq);
      value = a.slice(eq + 1);
    }
    if (name === '--file' || name === '--port') {
      if (value === undefined) value = argv[++i];
      if (value === undefined || value === '') throw new Error(`${name} needs a value`);
      if (name === '--file') {
        out.file = value;
      } else {
        const n = /^\d+$/.test(value) ? Number(value) : NaN;
        if (!Number.isInteger(n) || n < 1 || n > 65535) {
          throw new Error(`--port must be a whole number from 1 to 65535: ${value}`);
        }
        out.port = n;
      }
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\nUsage: node web/server.mjs [--port <n>] [--file <path>]\n`);
    process.exitCode = 1;
    return;
  }
  const file = args.file ?? (process.env.TODO_FILE ? process.env.TODO_FILE : './tasks.json');
  const server = createServer({ file });
  server.on('error', (err) => {
    process.stderr.write(`Cannot start web view on port ${args.port}: ${err.code || err.message}\n`);
    process.exitCode = 1;
  });
  server.listen(args.port, '127.0.0.1', () => {
    process.stdout.write(`Tasklet web view: http://127.0.0.1:${server.address().port}\n`);
  });
}

function isRunDirectly() {
  if (!process.argv[1]) return false;
  try {
    if (import.meta.url === pathToFileURL(process.argv[1]).href) return true;
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isRunDirectly()) main();
