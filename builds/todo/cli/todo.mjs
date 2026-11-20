#!/usr/bin/env node
// todo.mjs - parses arguments and prints. All file work is in store.mjs.
// Exit codes (SPEC section 7): 0 ok, 1 bad usage, 2 no such task, 3 unreadable or invalid data file.

import readline from 'node:readline';
import { StoreError, loadStore, saveStore, resolveFile, titleProblem } from './store.mjs';

const USAGE = 'Usage: node cli/todo.mjs <add "title" | list [--json] | done <id> | remove <id> [--yes]> [--file path]';

class UsageError extends Error {}
class NoTaskError extends Error {}

const out = (s) => process.stdout.write(s + '\n');
const err = (s) => process.stderr.write(s + '\n');

function parseArgs(argv) {
  const positional = [];
  const flags = { file: undefined, yes: false, json: false };
  let literal = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (literal || !a.startsWith('--')) {
      positional.push(a);
    } else if (a === '--') {
      literal = true;
    } else if (a === '--file') {
      if (i + 1 >= argv.length) throw new UsageError('--file needs a path');
      flags.file = argv[++i];
      if (flags.file === '') throw new UsageError('--file needs a path');
    } else if (a.startsWith('--file=')) {
      flags.file = a.slice('--file='.length);
      if (flags.file === '') throw new UsageError('--file needs a path');
    } else if (a === '--yes') {
      flags.yes = true;
    } else if (a === '--json') {
      flags.json = true;
    } else {
      throw new UsageError(`Unknown option ${a}`);
    }
  }
  return { command: positional[0], args: positional.slice(1), flags };
}

function parseId(args, command) {
  if (args.length === 0) throw new UsageError(`${command} needs a task id`);
  if (args.length > 1) throw new UsageError(`${command} takes exactly one task id`);
  if (!/^\d+$/.test(args[0])) throw new UsageError(`Task id must be a positive whole number, got "${args[0]}"`);
  const id = Number(args[0]);
  if (!Number.isSafeInteger(id) || id < 1) throw new UsageError(`Task id must be a positive whole number, got "${args[0]}"`);
  return id;
}

function onlyFlags(flags, allowed, command) {
  for (const name of ['yes', 'json']) {
    if (flags[name] && !allowed.includes(name)) throw new UsageError(`--${name} is not an option of ${command}`);
  }
}

function findTask(store, id) {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new NoTaskError(`No task #${id}`);
  return task;
}

/** Reads one line from stdin; null when stdin is closed or empty (I-06). */
function askLine(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    let answered = false;
    rl.once('line', (line) => {
      answered = true;
      resolve(line);
      rl.close();
    });
    rl.once('close', () => {
      if (!answered) resolve(null);
    });
    process.stdin.once('error', () => rl.close());
    process.stderr.write(prompt);
  });
}

async function run(argv, env) {
  const { command, args, flags } = parseArgs(argv);
  if (command === undefined) throw new UsageError('No command given');
  const file = resolveFile(flags.file, env);

  if (command === 'add') {
    onlyFlags(flags, [], 'add');
    if (args.length === 0) throw new UsageError('add needs a title');
    const title = args.join(' ').trim();
    const problem = titleProblem(title);
    if (problem) throw new UsageError(`Cannot add: ${problem}`);
    const store = loadStore(file);
    const id = store.nextId;
    store.tasks.push({ id, title, done: false, created: new Date().toISOString() });
    store.nextId = id + 1;
    saveStore(file, store);
    out(`Added #${id}: ${title}`);
    return;
  }

  if (command === 'list') {
    onlyFlags(flags, ['json'], 'list');
    if (args.length > 0) throw new UsageError('list takes no arguments');
    const store = loadStore(file);
    if (flags.json) {
      out(JSON.stringify(store.tasks, null, 2));
    } else if (store.tasks.length === 0) {
      out('No tasks.');
    } else {
      for (const t of store.tasks) out(`[${t.done ? 'x' : ' '}] #${t.id} ${t.title}`);
    }
    return;
  }

  if (command === 'done') {
    onlyFlags(flags, [], 'done');
    const id = parseId(args, 'done');
    const store = loadStore(file);
    const task = findTask(store, id);
    const already = task.done;
    task.done = true;
    saveStore(file, store); // I-01: rewritten even when already done
    out(already ? `Already done #${id}` : `Done #${id}`);
    return;
  }

  if (command === 'remove') {
    onlyFlags(flags, ['yes'], 'remove');
    const id = parseId(args, 'remove');
    const store = loadStore(file);
    const task = findTask(store, id);
    if (!flags.yes) {
      const answer = await askLine(`Remove #${id} ${task.title}? Type yes to confirm: `);
      if (answer === null || answer.trim() !== 'yes') {
        out('Cancelled');
        return;
      }
    }
    store.tasks = store.tasks.filter((t) => t.id !== id); // nextId is left alone (I-02)
    saveStore(file, store);
    out(`Removed #${id}`);
    return;
  }

  throw new UsageError(`Unknown command "${command}"`);
}

async function main() {
  const argv = process.argv.slice(2);
  try {
    await run(argv, process.env);
    process.exitCode = 0;
  } catch (e) {
    if (e instanceof UsageError) {
      err(e.message);
      err(USAGE);
      process.exitCode = 1;
    } else if (e instanceof NoTaskError) {
      err(e.message);
      process.exitCode = 2;
    } else if (e instanceof StoreError) {
      let file = './tasks.json';
      try {
        file = resolveFile(parseArgs(argv).flags.file, process.env);
      } catch {
        /* unreachable: arguments parsed once already */
      }
      err(`Cannot ${e.kind === 'write' ? 'write' : 'read'} ${file}: ${e.reason}`);
      process.exitCode = 3;
    } else {
      err(`Unexpected error: ${e && e.message ? e.message : e}`);
      process.exitCode = 1;
    }
  }
}

await main();
