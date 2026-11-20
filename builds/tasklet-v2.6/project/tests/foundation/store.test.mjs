// AC-03 (stores/index.json), AC-04 (atomic save), AC-13 (resolveDataPath), SPEC 6.1 write rules.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadStore, saveStore, emptyStore, resolveDataPath } from '../../src/store.mjs';
import { TodoError, makeError } from '../../src/errors.mjs';
import { FIXTURES, fixtureJson, withTempDir, tempFilesIn } from './helpers.mjs';

const index = fixtureJson('stores/index.json');

function thrown(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return undefined;
}

test('AC-03: every stores/index.json file loads or fails as stated; bytes unchanged', async (t) => {
  const names = Object.keys(index.files);
  assert.ok(names.length > 0);
  const onDisk = fs.readdirSync(path.join(FIXTURES, 'stores')).filter((n) => n !== 'index.json').sort();
  assert.deepEqual([...names].sort(), onDisk, 'index.json lists every store fixture');
  for (const name of names) {
    const want = index.files[name];
    await t.test(name, () => withTempDir((dir) => {
      const file = path.join(dir, 'todo.json');
      fs.copyFileSync(path.join(FIXTURES, 'stores', name), file);
      const before = fs.readFileSync(file);
      if (want.ok) {
        const store = loadStore(file);
        assert.deepEqual(store.tasks.map((x) => x.id), want.ids);
        assert.equal(store.nextId, want.nextId);
      } else {
        const err = thrown(() => loadStore(file));
        assert.ok(err instanceof TodoError, 'expected a TodoError');
        assert.equal(err.name, want.error);
        if (want.fileVersion !== undefined) {
          assert.equal(err.message, makeError('E_FILE_VERSION', { file, v: want.fileVersion }).message);
        } else {
          assert.equal(err.message, makeError(want.error, { file }).message);
        }
      }
      assert.ok(fs.readFileSync(file).equals(before), 'file bytes unchanged');
      assert.deepEqual(fs.readdirSync(dir), ['todo.json'], 'nothing else created');
    }));
  }
});

test('load: missing file and missing parent give the empty store and create nothing', () => withTempDir((dir) => {
  assert.deepEqual(loadStore(path.join(dir, 'todo.json')), emptyStore());
  assert.deepEqual(loadStore(path.join(dir, 'missing', 'todo.json')), emptyStore());
  assert.deepEqual(fs.readdirSync(dir), []);
  assert.deepEqual(emptyStore(), { version: 1, nextId: 1, tasks: [] });
  assert.equal(JSON.stringify(Object.keys(emptyStore())), '["version","nextId","tasks"]');
}));

test('load: a directory is E_FILE_UNREADABLE', () => withTempDir((dir) => {
  const err = thrown(() => loadStore(dir));
  assert.ok(err instanceof TodoError);
  assert.equal(err.name, 'E_FILE_UNREADABLE');
  assert.equal(err.message, `cannot read the task file ${dir}.`);
}));

test('load: unknown fields kept at value level, __proto__ as own field, escapes decoded', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  for (const name of ['valid-unknown-fields.json', 'valid-proto-key.json', 'valid-dup-key.json', 'valid-unknown-bignum.json']) {
    fs.copyFileSync(path.join(FIXTURES, 'stores', name), file);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const store = loadStore(file);
    assert.equal(JSON.stringify(store), JSON.stringify(raw), name);
  }
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-proto-key.json'), file);
  const p = loadStore(file);
  assert.ok(Object.hasOwn(p, '__proto__'));
  assert.equal(Object.getPrototypeOf(p), Object.prototype);
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-escaped-title.json'), file);
  const e = loadStore(file);
  assert.equal(e.tasks[0].title, JSON.parse(fs.readFileSync(file, 'utf8')).tasks[0].title);
}));

test('message paths go through safeText(path.resolve(file))', () => withTempDir((dir) => {
  // Windows refuses control characters in file names, so use a bidi override there.
  const name = process.platform === 'win32' ? 'bad\u202Ename.json' : 'bad\u001b\nname.json';
  const file = path.join(dir, name);
  fs.writeFileSync(file, 'not json');
  const e2 = thrown(() => loadStore(file));
  assert.equal(e2.name, 'E_FILE_DAMAGED');
  assert.ok(!/[\u001b\n\u202E]/.test(e2.message));
  assert.ok(e2.message.includes(path.join(dir, process.platform === 'win32' ? 'bad?name.json' : 'bad??name.json')));
}));

test('save: sorted by id, 2-space JSON plus newline, no BOM, key order kept, no temp left', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-bom.json'), file);
  const store = loadStore(file);
  saveStore(file, store);
  const text = fs.readFileSync(file, 'utf8');
  assert.notEqual(text.charCodeAt(0), 0xfeff);
  assert.equal(text, JSON.stringify(store, null, 2) + '\n');
  assert.deepEqual(tempFilesIn(dir), []);

  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-unsorted.json'), file);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const s2 = loadStore(file);
  saveStore(file, s2);
  const back = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(back.tasks.map((x) => x.id), [...raw.tasks.map((x) => x.id)].sort((a, b) => a - b));
  assert.deepEqual(Object.keys(back), Object.keys(raw));

  const fresh = emptyStore();
  saveStore(file, fresh);
  assert.equal(fs.readFileSync(file, 'utf8'), '{\n  "version": 1,\n  "nextId": 1,\n  "tasks": []\n}\n');
  assert.deepEqual(tempFilesIn(dir), []);
}));

test('save: missing parent folder is E_FILE_WRITE and the folder is not created', () => withTempDir((dir) => {
  const file = path.join(dir, 'missing', 'todo.json');
  const err = thrown(() => saveStore(file, emptyStore()));
  assert.equal(err.name, 'E_FILE_WRITE');
  assert.equal(err.message, `could not save the task file ${file}. Nothing was changed.`);
  assert.deepEqual(fs.readdirSync(dir), []);
}));

test('save: a stray *.tmp-* next to the target is left alone', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  const stray = `${file}.tmp-999-abc`;
  fs.writeFileSync(stray, 'junk');
  saveStore(file, emptyStore());
  assert.equal(fs.readFileSync(stray, 'utf8'), 'junk');
  assert.deepEqual(fs.readdirSync(dir).sort(), ['todo.json', 'todo.json.tmp-999-abc']);
}));

test('AC-04: rename fails -> E_FILE_WRITE, old bytes kept, no temp; then a normal save works', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-two.json'), file);
  const before = fs.readFileSync(file);
  const store = loadStore(file);
  store.tasks[0].done = true;
  store.tasks[0].doneAt = '2026-11-15T11:00:00.000Z';
  const m = mock.method(fs, 'renameSync', () => {
    throw Object.assign(new Error('rename refused'), { code: 'EPERM' });
  });
  try {
    const err = thrown(() => saveStore(file, store));
    assert.ok(err instanceof TodoError);
    assert.equal(err.name, 'E_FILE_WRITE');
    assert.equal(m.mock.callCount(), 1);
  } finally {
    m.mock.restore();
  }
  assert.ok(fs.readFileSync(file).equals(before), 'old bytes kept');
  assert.deepEqual(tempFilesIn(dir), [], 'no temp file remains');

  saveStore(file, store);
  const after = fs.readFileSync(file);
  assert.ok(!after.equals(before), 'new bytes written');
  assert.equal(after.toString('utf8'), JSON.stringify(store, null, 2) + '\n');
  assert.deepEqual(tempFilesIn(dir), [], 'no temp file remains');
}));

test('AC-04: save calls fsyncSync on the temp fd from openSync, before renameSync', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.copyFileSync(path.join(FIXTURES, 'stores', 'valid-two.json'), file);
  const store = loadStore(file);
  const log = [];
  const real = { openSync: fs.openSync, fsyncSync: fs.fsyncSync, renameSync: fs.renameSync };
  const mocks = [
    mock.method(fs, 'openSync', (...a) => { const fd = real.openSync.apply(fs, a); log.push(['open', a[0], a[1], fd]); return fd; }),
    mock.method(fs, 'fsyncSync', (...a) => { log.push(['fsync', a[0]]); return real.fsyncSync.apply(fs, a); }),
    mock.method(fs, 'renameSync', (...a) => { log.push(['rename', a[0], a[1]]); return real.renameSync.apply(fs, a); }),
  ];
  try {
    saveStore(file, store);
  } finally {
    for (const m of mocks) m.mock.restore();
  }
  const openIdx = log.findIndex((e) => e[0] === 'open' && e[1].startsWith(`${file}.tmp-${process.pid}-`));
  assert.ok(openIdx >= 0, 'temp file opened in the same folder with the <target>.tmp-<pid>- name');
  const [, temp, flag, fd] = log[openIdx];
  assert.equal(flag, 'wx');
  assert.equal(path.dirname(temp), dir);
  const fsyncIdx = log.findIndex((e) => e[0] === 'fsync' && e[1] === fd);
  const renameIdx = log.findIndex((e) => e[0] === 'rename' && e[1] === temp && e[2] === file);
  assert.ok(fsyncIdx > openIdx, 'fsyncSync on the temp fd');
  assert.ok(renameIdx > fsyncIdx, 'renameSync after fsyncSync');
  assert.deepEqual(tempFilesIn(dir), []);
}));

test('save: temp path already exists (EEXIST) -> E_FILE_WRITE and that file is left alone', () => withTempDir((dir) => {
  const file = path.join(dir, 'todo.json');
  fs.writeFileSync(file, 'old');
  const real = fs.openSync;
  let temp;
  const m = mock.method(fs, 'openSync', (...a) => {
    temp = a[0];
    fs.writeFileSync(temp, 'someone else');
    return real.apply(fs, a);
  });
  try {
    const err = thrown(() => saveStore(file, emptyStore()));
    assert.equal(err.name, 'E_FILE_WRITE');
  } finally {
    m.mock.restore();
  }
  assert.equal(fs.readFileSync(temp, 'utf8'), 'someone else');
  assert.equal(fs.readFileSync(file, 'utf8'), 'old');
}));

test('AC-13: resolveDataPath', () => {
  const home = path.resolve('/home/owner');
  const cwd = path.resolve('/work/here');
  assert.equal(resolveDataPath({}, cwd, home), path.join(home, 'todo.json'));
  assert.equal(resolveDataPath({ TODO_FILE: '' }, cwd, home), path.join(home, 'todo.json'));
  assert.equal(resolveDataPath({ TODO_FILE: 'list.json' }, cwd, home), path.join(cwd, 'list.json'));
  assert.equal(resolveDataPath({ TODO_FILE: path.join('sub', 'l.json') }, cwd, home), path.join(cwd, 'sub', 'l.json'));
  const abs = path.resolve('/elsewhere/t.json');
  assert.equal(resolveDataPath({ TODO_FILE: abs }, cwd, home), abs);
});
