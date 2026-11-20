#!/usr/bin/env node
// Tasklet CLI: a to-do list stored in one JSON file.
// Usage: node cli/todo.mjs <add|list|done|remove> [args] [--file <path>]
// Exit codes: 0 ok, 1 bad usage, 2 no such task, 3 unreadable or invalid data file.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const MAX_TITLE = 200;
const USAGE = [
  'Usage: node cli/todo.mjs <command> [args] [--file <path>]',
  '  add "<title>"        add a task',
  '  list [--json]        show all tasks',
  '  done <id>            mark a task done',
  '  remove <id> [--yes]  remove a task (asks for the word yes)',
].join('\n');

class CliError extends Error {
  constructor(code, message) {
    super(message);
    this.exitCode = code;
  }
}

const titleLength = (s) => [...s].length;

/** Validate parsed JSON against the data contract. Returns normalised store or throws Error(reason). */
export function validateStore(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('top level must be an object');
  }
  if (data.version !== 1) throw new Error('version must be exactly 1');
  if (!Number.isInteger(data.nextId) || data.nextId < 1) {
    throw new Error('nextId must be an integer of at least 1');
  }
  if (!Array.isArray(data.tasks)) throw new Error('tasks must be an array');
  const seen = new Set();
  const tasks = data.tasks.map((t, i) => {
    const where = `task at index ${i}`;
    if (t === null || typeof t !== 'object' || Array.isArray(t)) {
      throw new Error(`${where} must be an object`);
    }
    if (!Number.isInteger(t.id) || t.id < 1) throw new Error(`${where}: id must be a positive integer`);
    if (seen.has(t.id)) throw new Error(`duplicate task id ${t.id}`);
    seen.add(t.id);
    if (typeof t.title !== 'string') throw new Error(`task #${t.id}: title must be a string`);
    const len = titleLength(t.title.trim());
    if (len < 1 || len > MAX_TITLE) {
      throw new Error(`task #${t.id}: title must be 1-${MAX_TITLE} characters after trimming`);
    }
    if (typeof t.done !== 'boolean') throw new Error(`task #${t.id}: done must be a boolean`);
    if (typeof t.created !== 'string') throw new Error(`task #${t.id}: created must be a string`);
    if (t.id >= data.nextId) throw new Error(`nextId must be greater than every task id (#${t.id})`);
    return { id: t.id, title: t.title, done: t.done, created: t.created };
  });
  tasks.sort((a, b) => a.id - b.id);
  return { version: 1, nextId: data.nextId, tasks };
}

/** Parse and validate the text of a data file. Throws Error(reason) when invalid. */
export function parseStore(text) {
  let data;
  try {
    data = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    throw new Error('not valid JSON');
  }
  return validateStore(data);
}

/** Read the data file. A missing file is an empty list. Throws CliError(3) when unreadable or invalid. */
export function readStore(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return { version: 1, nextId: 1, tasks: [] };
    throw new CliError(3, `Cannot read ${file}: ${err && err.code ? err.code : 'read failed'}`);
  }
  try {
    return parseStore(text);
  } catch (err) {
    throw new CliError(3, `Cannot read ${file}: ${err.message}`);
  }
}

/**
 * Write the store atomically: save a temp file in the same folder, then rename it
 * over the data file. The data file is never truncated in place.
 */
export function writeStore(file, store, fsApi = fs) {
  const dir = path.dirname(path.resolve(file));
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  const out = {
    version: 1,
    nextId: store.nextId,
    tasks: [...store.tasks]
      .sort((a, b) => a.id - b.id)
      .map((t) => ({ id: t.id, title: t.title, done: t.done, created: t.created })),
  };
  const text = JSON.stringify(out, null, 2) + '\n';
  try {
    fsApi.mkdirSync(dir, { recursive: true });
    fsApi.writeFileSync(tmp, text, 'utf8');
    fsApi.renameSync(tmp, file);
  } catch (err) {
    try {
      fsApi.unlinkSync(tmp);
    } catch {
      /* nothing to clean up */
    }
    throw err;
  }
}

function save(file, store) {
  try {
    writeStore(file, store);
  } catch (err) {
    throw new CliError(3, `Cannot write ${file}: ${err && err.code ? err.code : err.message}`);
  }
}

function parseArgs(argv) {
  const opts = { file: undefined, yes: false, json: false, positional: [] };
  let literal = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (literal || !a.startsWith('--')) {
      opts.positional.push(a);
    } else if (a === '--') {
      literal = true;
    } else if (a === '--file') {
      i++;
      if (i >= argv.length || argv[i] === '') throw new CliError(1, '--file needs a path');
      opts.file = argv[i];
    } else if (a.startsWith('--file=')) {
      opts.file = a.slice('--file='.length);
      if (opts.file === '') throw new CliError(1, '--file needs a path');
    } else if (a === '--yes') {
      opts.yes = true;
    } else if (a === '--json') {
      opts.json = true;
    } else {
      throw new CliError(1, `Unknown option ${a}`);
    }
  }
  return opts;
}

function parseId(args, command) {
  if (args.length !== 1) throw new CliError(1, `Usage: ${command} <id>`);
  const raw = args[0];
  if (!/^[0-9]+$/.test(raw)) throw new CliError(1, `Task id must be a positive whole number, got "${raw}"`);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new CliError(1, `Task id must be a positive whole number, got "${raw}"`);
  }
  return id;
}

function readAnswer(stdin) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve(value);
    };
    const rl = readline.createInterface({ input: stdin, terminal: false });
    rl.once('line', (line) => finish(line));
    rl.once('close', () => finish(''));
    stdin.once('error', () => finish(''));
  });
}

/** Run the CLI. Returns the exit code. */
export async function main(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const stdin = io.stdin ?? process.stdin;
  const env = io.env ?? process.env;
  try {
    const opts = parseArgs(argv);
    const [command, ...args] = opts.positional;
    const file = opts.file ?? (env.TODO_FILE ? env.TODO_FILE : './tasks.json');
    if (command === undefined) throw new CliError(1, USAGE);

    if (command === 'add') {
      if (args.length === 0) throw new CliError(1, 'Usage: add "<title>"');
      const title = args.join(' ').trim();
      if (title === '') throw new CliError(1, 'Title must not be empty');
      if (titleLength(title) > MAX_TITLE) {
        throw new CliError(1, `Title must be at most ${MAX_TITLE} characters`);
      }
      const store = readStore(file);
      const id = store.nextId;
      store.tasks.push({ id, title, done: false, created: new Date().toISOString() });
      store.nextId = id + 1;
      save(file, store);
      stdout.write(`Added #${id}: ${title}\n`);
      return 0;
    }

    if (command === 'list') {
      if (args.length > 0) throw new CliError(1, 'Usage: list [--json]');
      const store = readStore(file);
      if (opts.json) {
        stdout.write(JSON.stringify(store.tasks, null, 2) + '\n');
      } else if (store.tasks.length === 0) {
        stdout.write('No tasks.\n');
      } else {
        stdout.write(store.tasks.map((t) => `[${t.done ? 'x' : ' '}] #${t.id} ${t.title}\n`).join(''));
      }
      return 0;
    }

    if (command === 'done') {
      const id = parseId(args, 'done');
      const store = readStore(file);
      const task = store.tasks.find((t) => t.id === id);
      if (!task) throw new CliError(2, `No task #${id}`);
      const already = task.done;
      task.done = true;
      save(file, store);
      stdout.write(already ? `Already done #${id}\n` : `Done #${id}\n`);
      return 0;
    }

    if (command === 'remove') {
      const id = parseId(args, 'remove');
      const store = readStore(file);
      const task = store.tasks.find((t) => t.id === id);
      if (!task) throw new CliError(2, `No task #${id}`);
      if (!opts.yes) {
        stdout.write(`Remove #${id} ${task.title}? Type yes to confirm:\n`);
        const answer = await readAnswer(stdin);
        if (answer.trim() !== 'yes') {
          stdout.write('Cancelled\n');
          return 0;
        }
      }
      store.tasks = store.tasks.filter((t) => t.id !== id);
      save(file, store);
      stdout.write(`Removed #${id}\n`);
      return 0;
    }

    throw new CliError(1, `Unknown command "${command}"\n${USAGE}`);
  } catch (err) {
    if (err instanceof CliError) {
      stderr.write(err.message + '\n');
      return err.exitCode;
    }
    stderr.write(`Unexpected error: ${err && err.message ? err.message : String(err)}\n`);
    return 1;
  }
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
  process.exitCode = await main(process.argv.slice(2));
}
