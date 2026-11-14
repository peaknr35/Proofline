// store.mjs - reads, validates and writes the data file (SPEC sections 5 and 6).
// This module never prints. It throws StoreError; todo.mjs decides what to show.

import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_FILE = './tasks.json';
export const TITLE_MAX = 200;

/** A data file that cannot be read, is not valid, or cannot be written. */
export class StoreError extends Error {
  constructor(reason, kind = 'read') {
    super(reason);
    this.name = 'StoreError';
    this.reason = reason;
    this.kind = kind; // 'read' | 'write'
  }
}

/** Setting "data file": --file wins, then env TODO_FILE, then ./tasks.json. */
export function resolveFile(flagValue, env = process.env) {
  if (typeof flagValue === 'string' && flagValue !== '') return flagValue;
  if (typeof env.TODO_FILE === 'string' && env.TODO_FILE !== '') return env.TODO_FILE;
  return DEFAULT_FILE;
}

export function emptyStore() {
  return { version: 1, nextId: 1, tasks: [] };
}

/** Title rule shared by the reader and by `add`: 1-200 characters after trimming. */
export function titleProblem(title) {
  if (typeof title !== 'string') return 'title is not a string';
  const len = title.trim().length;
  if (len < 1) return 'title is empty';
  if (len > TITLE_MAX) return `title is longer than ${TITLE_MAX} characters`;
  return null;
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Checks every rule of SPEC section 6. Returns a clean store (known fields only,
 * tasks in id order) or throws StoreError with the first rule broken.
 */
export function validate(data) {
  if (!isPlainObject(data)) throw new StoreError('top level is not an object');
  if (data.version !== 1) throw new StoreError('version is not 1');
  if (!Number.isInteger(data.nextId) || data.nextId < 1) {
    throw new StoreError('nextId is not an integer of at least 1');
  }
  if (!Array.isArray(data.tasks)) throw new StoreError('tasks is not an array');

  const seen = new Set();
  const tasks = [];
  data.tasks.forEach((t, i) => {
    const where = `task at index ${i}`;
    if (!isPlainObject(t)) throw new StoreError(`${where} is not an object`);
    if (!Number.isInteger(t.id) || t.id < 1) {
      throw new StoreError(`${where}: id is not a positive integer`);
    }
    if (seen.has(t.id)) throw new StoreError(`duplicate task id ${t.id}`);
    seen.add(t.id);
    const tp = titleProblem(t.title);
    if (tp) throw new StoreError(`task #${t.id}: ${tp}`);
    if (typeof t.done !== 'boolean') {
      throw new StoreError(`task #${t.id}: done is not a boolean`);
    }
    if (typeof t.created !== 'string') {
      throw new StoreError(`task #${t.id}: created is not a string`);
    }
    if (t.id >= data.nextId) {
      throw new StoreError(`nextId ${data.nextId} is not greater than task id ${t.id}`);
    }
    tasks.push({ id: t.id, title: t.title, done: t.done, created: t.created });
  });
  tasks.sort((a, b) => a.id - b.id);
  return { version: 1, nextId: data.nextId, tasks };
}

/** Text of a data file -> clean store, or StoreError. */
export function parseStore(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new StoreError('not valid JSON');
  }
  return validate(data);
}

/** Reads the data file. A missing file is an empty list (nextId 1). */
export function loadStore(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return emptyStore();
    throw new StoreError(`file cannot be opened (${(err && err.code) || 'error'})`);
  }
  return parseStore(text);
}

/** The exact bytes the CLI writes: two-space JSON, known fields only, trailing newline. */
export function serialize(store) {
  const clean = validate(store);
  return JSON.stringify(clean, null, 2) + '\n';
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const RETRY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES']);

/**
 * Writes the store: a temp file in the SAME folder, then a rename over the data
 * file. The data file is never opened for writing, so a failed write leaves the
 * previous file intact (AC-10). `fsImpl` exists so tests can make a step fail.
 */
export function saveStore(file, store, { fsImpl = fs } = {}) {
  const text = serialize(store); // refuses to write an invalid store
  const dir = path.dirname(file);
  const tmp = path.join(
    dir,
    `.${path.basename(file)}.${process.pid}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.tmp`,
  );
  try {
    fsImpl.writeFileSync(tmp, text, { encoding: 'utf8', flag: 'wx' });
    // On Windows a rename can fail briefly while another process reads the target.
    for (let attempt = 0; ; attempt++) {
      try {
        fsImpl.renameSync(tmp, file);
        break;
      } catch (err) {
        if (attempt < 5 && err && RETRY_CODES.has(err.code)) {
          sleepMs(20 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* nothing more to do */
    }
    throw new StoreError(`write failed (${(err && err.code) || (err && err.message) || 'error'})`, 'write');
  }
}
