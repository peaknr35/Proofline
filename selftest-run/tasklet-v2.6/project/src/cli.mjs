// The command line (SPEC 7.1, 6.5). main(argv, io) -> Promise<exit code>.
import path from 'node:path';
import { TodoError, makeError } from './errors.mjs';
import { normalizeTitle, parseId, parsePort, safeText } from './text.mjs';
import { resolveDataPath, loadStore, saveStore } from './store.mjs';
import { startServer } from './serve.mjs';

const ID_CEILING = 9007199254740992; // 2^53 (SPEC 6.1 step 6)
const DEFAULT_PORT = 7070;

const HELP = [
  'todo - a small to-do list kept in a JSON file',
  '',
  'Usage:',
  '  todo add <title...>      add a task',
  '  todo list                show all tasks',
  '  todo done <number>       mark a task done',
  '  todo remove <number>     delete a task (cannot be undone)',
  '  todo serve [--port <n>]  show the list as a web page at http://127.0.0.1:<n>/ (default 7070)',
  '  todo help                show this help',
  '',
  'Tasks are kept in todo.json in your home folder, or in the file named by TODO_FILE.',
  '',
].join('\n');

function dataFile(io) {
  return resolveDataPath(io.env, io.cwd, io.homedir);
}

function findTask(store, id) {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw makeError('E_NOT_FOUND', { id });
  return task;
}

// done/remove: usage -> input -> file -> lookup (SPEC 6.5 precedence).
function idArg(argv, cmd) {
  if (argv.length < 2) throw makeError('E_USAGE_MISSING_ID', { cmd });
  if (argv.length > 2) throw makeError('E_USAGE_EXTRA_ARGS', { cmd });
  return parseId(argv[1]);
}

const commands = {
  async help(argv, io) {
    if (argv.length > 1) throw makeError('E_USAGE_EXTRA_ARGS', { cmd: 'help' });
    io.stdout.write(HELP);
    return 0;
  },

  async add(argv, io) {
    if (argv.length < 2) throw makeError('E_USAGE_MISSING_TITLE');
    const title = normalizeTitle(argv.slice(1));
    const file = dataFile(io);
    const store = loadStore(file);
    if (store.nextId >= ID_CEILING) {
      throw makeError('E_ID_LIMIT', { file: safeText(path.resolve(file)) });
    }
    const id = store.nextId;
    store.tasks.push({ id, title, done: false, createdAt: new Date().toISOString(), doneAt: null });
    store.nextId = id + 1;
    saveStore(file, store);
    io.stdout.write(`Added ${id}: ${title}\n`);
    return 0;
  },

  async list(argv, io) {
    if (argv.length > 1) throw makeError('E_USAGE_EXTRA_ARGS', { cmd: 'list' });
    const store = loadStore(dataFile(io));
    const tasks = [...store.tasks].sort((a, b) => a.id - b.id);
    const out = tasks.length === 0
      ? 'No tasks.\n'
      : tasks.map((t) => `${t.id}. [${t.done ? 'x' : ' '}] ${t.title}\n`).join('');
    io.stdout.write(out);
    return 0;
  },

  async done(argv, io) {
    const id = idArg(argv, 'done');
    const file = dataFile(io);
    const store = loadStore(file);
    const task = findTask(store, id);
    if (task.done) {
      io.stdout.write(`Task ${id} is already done.\n`);
      return 0;
    }
    task.done = true;
    task.doneAt = new Date().toISOString();
    saveStore(file, store);
    io.stdout.write(`Done ${id}: ${task.title}\n`);
    return 0;
  },

  async remove(argv, io) {
    const id = idArg(argv, 'remove');
    const file = dataFile(io);
    const store = loadStore(file);
    const task = findTask(store, id);
    store.tasks.splice(store.tasks.indexOf(task), 1);
    saveStore(file, store);
    io.stdout.write(`Removed ${id}: ${task.title}\n`);
    return 0;
  },

  async serve(argv, io) {
    // Left to right, first problem wins; --port always takes the next arg (SPEC 6.5, IR-29).
    let port = DEFAULT_PORT;
    let seenPort = false;
    for (let i = 1; i < argv.length; i += 1) {
      if (argv[i] !== '--port') throw makeError('E_USAGE_UNKNOWN_OPTION');
      if (seenPort) throw makeError('E_USAGE_EXTRA_ARGS', { cmd: 'serve' });
      seenPort = true;
      port = parsePort(argv[i + 1]);
      i += 1;
    }
    const { server, url } = await startServer({ file: dataFile(io), port });
    io.stdout.write(`Serving your list at ${url} (press Ctrl+C to stop)\n`);
    await new Promise((resolve) => server.once('close', resolve));
    return 0;
  },
};
commands['--help'] = commands.help;
commands['-h'] = commands.help;

export async function main(argv, io) {
  try {
    const name = argv.length === 0 ? 'help' : argv[0];
    if (!Object.hasOwn(commands, name)) throw makeError('E_USAGE_UNKNOWN_COMMAND');
    return await commands[name](argv.length === 0 ? ['help'] : argv, io);
  } catch (err) {
    const known = err instanceof TodoError;
    try {
      io.stderr.write(known ? `todo: ${err.message}\n` : `todo: ${makeError('E_INTERNAL').message}\n`);
    } catch {
      return known ? err.exitCode : 1;
    }
    return known ? err.exitCode : 1;
  }
}
