#!/usr/bin/env node
// Tasklet command line: add, list, done, remove. Node built-ins only.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_TITLE = 200;

export class UsageError extends Error {}
export class NoTaskError extends Error {}
export class DataFileError extends Error {}

const USAGE = 'Usage: node cli/todo.mjs <add|list|done|remove> [args] [--file <path>]';

// ---------- data file: validate ----------

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Returns the cleaned data ({version, nextId, tasks} in id order, known fields only)
// or throws an Error whose message is the reason the file is invalid.
export function validateData(data) {
  if (!isObject(data)) throw new Error('top level is not an object');
  if (data.version !== 1) throw new Error('version must be 1');
  if (!Number.isSafeInteger(data.nextId) || data.nextId < 1) {
    throw new Error('nextId must be an integer of at least 1');
  }
  if (!Array.isArray(data.tasks)) throw new Error('tasks must be an array');
  const seen = new Set();
  const tasks = [];
  for (const t of data.tasks) {
    if (!isObject(t)) throw new Error('a task is not an object');
    if (!Number.isSafeInteger(t.id) || t.id < 1) throw new Error('a task id is not a positive integer');
    if (seen.has(t.id)) throw new Error(`duplicate task id ${t.id}`);
    seen.add(t.id);
    if (typeof t.title !== 'string') throw new Error(`task ${t.id} title is not a string`);
    const len = t.title.trim().length;
    if (len < 1 || len > MAX_TITLE) throw new Error(`task ${t.id} title must be 1-${MAX_TITLE} characters`);
    if (typeof t.done !== 'boolean') throw new Error(`task ${t.id} done is not a boolean`);
    if (typeof t.created !== 'string') throw new Error(`task ${t.id} created is not a string`);
    if (t.id >= data.nextId) throw new Error('nextId must be greater than every task id');
    tasks.push({ id: t.id, title: t.title, done: t.done, created: t.created });
  }
  tasks.sort((a, b) => a.id - b.id);
  return { version: 1, nextId: data.nextId, tasks };
}

// ---------- data file: read ----------

export function loadData(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return { version: 1, nextId: 1, tasks: [] };
    throw new DataFileError(`Cannot read ${file}: ${(err && (err.code || err.message)) || 'read failed'}`);
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DataFileError(`Cannot read ${file}: not valid JSON`);
  }
  try {
    return validateData(parsed);
  } catch (err) {
    throw new DataFileError(`Cannot read ${file}: ${err.message}`);
  }
}

// ---------- data file: write (temp file in the same folder, then rename) ----------

export function serializeData(data) {
  const clean = {
    version: 1,
    nextId: data.nextId,
    tasks: [...data.tasks]
      .sort((a, b) => a.id - b.id)
      .map((t) => ({ id: t.id, title: t.title, done: t.done, created: t.created })),
  };
  return JSON.stringify(clean, null, 2) + '\n';
}

// `rename` is injectable so a test can force the last step to fail.
export function saveData(file, data, { rename = fs.renameSync } = {}) {
  const dir = path.dirname(file);
  const tmp = path.join(
    dir,
    `.${path.basename(file)}.${process.pid}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.tmp`,
  );
  try {
    fs.writeFileSync(tmp, serializeData(data), { encoding: 'utf8', flag: 'wx' });
    rename(tmp, file);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* nothing more to do */
    }
    throw new DataFileError(`Cannot write ${file}: ${(err && (err.code || err.message)) || 'write failed'}`);
  }
}

// ---------- arguments ----------

export function parseArgs(argv) {
  const out = { file: undefined, yes: false, json: false, positionals: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      out.positionals.push(...argv.slice(i + 1));
      break;
    } else if (a === '--file') {
      if (i + 1 >= argv.length || argv[i + 1] === '') throw new UsageError('--file needs a path');
      out.file = argv[++i];
    } else if (a.startsWith('--file=')) {
      out.file = a.slice('--file='.length);
      if (out.file === '') throw new UsageError('--file needs a path');
    } else if (a === '--yes') {
      out.yes = true;
    } else if (a === '--json') {
      out.json = true;
    } else if (a.startsWith('--')) {
      throw new UsageError(`Unknown option ${a}`);
    } else {
      out.positionals.push(a);
    }
  }
  return out;
}

function parseId(raw) {
  if (raw === undefined) throw new UsageError('Missing task id');
  if (!/^\d+$/.test(raw)) throw new UsageError(`Task id must be a positive whole number: ${raw}`);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) throw new UsageError(`Task id must be a positive whole number: ${raw}`);
  return id;
}

function parseTitle(words) {
  if (words.length === 0) throw new UsageError('Missing title');
  const title = words.join(' ').trim();
  if (title.length === 0) throw new UsageError('Title must not be empty');
  if (title.length > MAX_TITLE) throw new UsageError(`Title must be at most ${MAX_TITLE} characters`);
  return title;
}

// Reads one line from the stream. Closed, empty or failing input gives ''.
function readLine(stream) {
  return new Promise((resolve) => {
    let buf = '';
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      stream.off('data', onData);
      stream.off('end', finish);
      stream.off('close', finish);
      stream.off('error', finish);
      try {
        stream.pause();
        if (typeof stream.unref === 'function') stream.unref();
      } catch {
        /* ignore */
      }
      const nl = buf.indexOf('\n');
      resolve(nl === -1 ? buf : buf.slice(0, nl));
    };
    const onData = (chunk) => {
      buf += chunk;
      if (buf.includes('\n')) finish();
    };
    try {
      stream.setEncoding('utf8');
      stream.on('data', onData);
      stream.on('end', finish);
      stream.on('close', finish);
      stream.on('error', finish);
      stream.resume();
    } catch {
      finish();
    }
  });
}

// ---------- commands ----------

export async function run(argv, io = {}) {
  const env = io.env ?? process.env;
  const stdin = io.stdin ?? process.stdin;
  const out = io.out ?? ((s) => process.stdout.write(s));
  const err = io.err ?? ((s) => process.stderr.write(s));

  const args = parseArgs(argv);
  const [command, ...rest] = args.positionals;
  const file = args.file ?? (env.TODO_FILE ? env.TODO_FILE : './tasks.json');

  if (command === undefined) throw new UsageError('No command given');

  if (command === 'add') {
    const title = parseTitle(rest);
    const data = loadData(file);
    const id = data.nextId;
    data.tasks.push({ id, title, done: false, created: new Date().toISOString() });
    data.nextId = id + 1;
    saveData(file, data);
    out(`Added #${id}: ${title}\n`);
    return;
  }

  if (command === 'list') {
    const data = loadData(file);
    if (args.json) {
      out(JSON.stringify(data.tasks, null, 2) + '\n');
    } else if (data.tasks.length === 0) {
      out('No tasks.\n');
    } else {
      out(data.tasks.map((t) => `[${t.done ? 'x' : ' '}] #${t.id} ${t.title}\n`).join(''));
    }
    return;
  }

  if (command === 'done') {
    const id = parseId(rest[0]);
    const data = loadData(file);
    const task = data.tasks.find((t) => t.id === id);
    if (!task) throw new NoTaskError(`No task #${id}`);
    const already = task.done;
    task.done = true;
    saveData(file, data);
    out(`${already ? 'Already done' : 'Done'} #${id}\n`);
    return;
  }

  if (command === 'remove') {
    const id = parseId(rest[0]);
    const data = loadData(file);
    const task = data.tasks.find((t) => t.id === id);
    if (!task) throw new NoTaskError(`No task #${id}`);
    if (!args.yes) {
      err(`Remove #${id} ${task.title}? Type yes to confirm: `);
      const answer = (await readLine(stdin)).trim();
      if (answer !== 'yes') {
        out('Cancelled\n');
        return;
      }
    }
    data.tasks = data.tasks.filter((t) => t.id !== id);
    saveData(file, data);
    out(`Removed #${id}\n`);
    return;
  }

  throw new UsageError(`Unknown command: ${command}`);
}

export async function main(argv = process.argv.slice(2)) {
  try {
    await run(argv);
    process.exitCode = 0;
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n${USAGE}\n`);
      process.exitCode = 1;
    } else if (e instanceof NoTaskError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 2;
    } else if (e instanceof DataFileError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 3;
    } else {
      process.stderr.write(`Unexpected error: ${(e && e.message) || e}\n`);
      process.exitCode = 1;
    }
  }
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

if (isRunDirectly()) {
  await main();
}
