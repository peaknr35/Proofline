// The task file (SPEC 6.1, 5). Synchronous; uses the default fs import so tests can mock it (AC-04).
import fs from 'node:fs';
import path from 'node:path';
import { makeError } from './errors.mjs';
import { normalizeTitle, safeText } from './text.mjs';

const ID_CEILING = 9007199254740992; // 2^53
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function emptyStore() {
  return { version: 1, nextId: 1, tasks: [] };
}

export function resolveDataPath(env, cwd, homedir) {
  const value = env.TODO_FILE;
  if (value === undefined || value === '') return path.join(homedir, 'todo.json');
  return path.resolve(cwd, value);
}

// <FILE> in messages (SPEC 6.5).
function shown(file) {
  return safeText(path.resolve(file));
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isTimestamp(v) {
  if (typeof v !== 'string' || !TIMESTAMP.test(v)) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && d.toISOString() === v;
}

function isValidTitle(v) {
  if (typeof v !== 'string') return false;
  try {
    return normalizeTitle([v]) === v;
  } catch {
    return false;
  }
}

function isValidTask(t) {
  if (!isPlainObject(t)) return false;
  if (!Number.isInteger(t.id) || t.id < 1 || t.id > Number.MAX_SAFE_INTEGER) return false;
  if (!isValidTitle(t.title)) return false;
  if (typeof t.done !== 'boolean') return false;
  if (!isTimestamp(t.createdAt)) return false;
  if (t.done) return isTimestamp(t.doneAt);
  return t.doneAt === null;
}

// Load steps 1-6 of SPEC 6.1. Returns the parsed store with `tasks` sorted by id ascending
// (display order); unknown fields and every object's key order are kept as JSON.parse made them.
export function loadStore(file) {
  let bytes;
  try {
    bytes = fs.readFileSync(file);
  } catch (err) {
    if (err && err.code === 'ENOENT') return emptyStore();
    throw makeError('E_FILE_UNREADABLE', { file: shown(file) });
  }
  const damaged = () => makeError('E_FILE_DAMAGED', { file: shown(file) });

  let store;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    store = JSON.parse(text);
  } catch {
    throw damaged();
  }
  if (!isPlainObject(store)) throw damaged();
  if (!Number.isInteger(store.version)) throw damaged();
  if (store.version !== 1) throw makeError('E_FILE_VERSION', { file: shown(file), v: store.version });
  if (!Array.isArray(store.tasks)) throw damaged();
  const ids = new Set();
  let maxId = 0;
  for (const t of store.tasks) {
    if (!isValidTask(t) || ids.has(t.id)) throw damaged();
    ids.add(t.id);
    if (t.id > maxId) maxId = t.id;
  }
  const n = store.nextId;
  if (!Number.isInteger(n) || n < 1 || n > ID_CEILING || n <= maxId) throw damaged();
  store.tasks.sort((a, b) => a.id - b.id);
  return store;
}

function tempName(file) {
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${file}.tmp-${process.pid}-${random}`;
}

// Atomic save (SPEC 6.1 "Save", IR-46, IR-50). Sorts store.tasks by id in place, then
// open 'wx' -> write -> fsync -> close -> rename. Any failure: E_FILE_WRITE, target untouched.
export function saveStore(file, store) {
  const temp = tempName(file);
  let fd;
  let created = false;
  try {
    store.tasks.sort((a, b) => a.id - b.id);
    const data = JSON.stringify(store, null, 2) + '\n';
    fd = fs.openSync(temp, 'wx');
    created = true;
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    const open = fd;
    fd = undefined;
    fs.closeSync(open);
    fs.renameSync(temp, file);
  } catch {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* already failing */ }
    }
    if (created) {
      try { fs.rmSync(temp, { force: true }); } catch { /* already failing */ }
    }
    throw makeError('E_FILE_WRITE', { file: shown(file) });
  }
}
