// AC-05 (web reader): every golden fixture gets the verdict in expected.json,
// plus the section 6 rules on this test's own temp files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readTasks, validateData } from '../server.mjs';
import { FIXTURES, fixture, tempDir, tempFile, start, request, task } from './helpers.mjs';

const expected = JSON.parse(fs.readFileSync(fixture('expected.json'), 'utf8'));
const names = Object.keys(expected);

test('expected.json lists exactly the fixture files that exist', () => {
  const onDisk = fs.readdirSync(FIXTURES).filter((n) => n !== 'expected.json').sort();
  assert.deepEqual(onDisk, [...names].sort());
  assert.ok(names.length > 0);
  for (const name of names) assert.ok(['valid', 'invalid'].includes(expected[name]), name);
});

for (const name of names) {
  test(`AC-05 reader verdict: ${name} is ${expected[name]}`, () => {
    const result = readTasks(fixture(name));
    assert.equal(result.ok ? 'valid' : 'invalid', expected[name], result.reason);
    if (!result.ok) assert.equal(typeof result.reason, 'string');
  });

  test(`AC-05 over HTTP: ${name} answers ${expected[name] === 'valid' ? 200 : 500} on both routes`, async (t) => {
    const before = fs.readFileSync(fixture(name));
    const { port } = await start(t, fixture(name));
    const want = expected[name] === 'valid' ? 200 : 500;
    const pageRes = await request(port, '/');
    const apiRes = await request(port, '/api/tasks');
    assert.equal(pageRes.status, want);
    assert.equal(apiRes.status, want);
    if (want === 200) {
      const raw = JSON.parse(before.toString('utf8'));
      const body = JSON.parse(apiRes.body);
      assert.deepEqual(Object.keys(body), ['tasks']);
      assert.equal(body.tasks.length, raw.tasks.length);
    } else {
      assert.deepEqual(JSON.parse(apiRes.body), { error: 'Cannot read tasks file' });
      assert.ok(pageRes.body.includes('Cannot read tasks file'));
    }
    assert.ok(before.equals(fs.readFileSync(fixture(name))), 'fixture bytes unchanged');
  });
}

test('a missing file is an empty list with nextId 1, and is not created', (t) => {
  const file = path.join(tempDir(t), 'absent.json');
  assert.deepEqual(readTasks(file), { ok: true, nextId: 1, tasks: [] });
  assert.equal(fs.existsSync(file), false);
});

test('a path that cannot be read as a file is refused, not treated as missing', (t) => {
  const result = readTasks(tempDir(t));
  assert.equal(result.ok, false);
});

test('the SPEC section 6 example is valid', (t) => {
  const file = tempFile(t, {
    version: 1,
    nextId: 3,
    tasks: [
      { id: 1, title: 'Buy milk', done: false, created: '2026-11-13T09:00:00.000Z' },
      { id: 2, title: 'Call Sam', done: true, created: '2026-11-13T09:05:00.000Z' },
    ],
  });
  const result = readTasks(file);
  assert.equal(result.ok, true);
  assert.equal(result.nextId, 3);
  assert.deepEqual(result.tasks.map((x) => [x.id, x.title, x.done]), [[1, 'Buy milk', false], [2, 'Call Sam', true]]);
});

const good = () => ({ version: 1, nextId: 2, tasks: [task(1, 'ok')] });
const bad = {
  'top level is an array': [],
  'top level is null': null,
  'version missing': { nextId: 1, tasks: [] },
  'version is the string "1"': { version: '1', nextId: 1, tasks: [] },
  'nextId missing': { version: 1, tasks: [] },
  'nextId 0': { version: 1, nextId: 0, tasks: [] },
  'nextId not an integer': { version: 1, nextId: 1.5, tasks: [] },
  'nextId a string': { version: 1, nextId: '2', tasks: [task(1, 'ok')] },
  'nextId equal to an id': { version: 1, nextId: 1, tasks: [task(1, 'ok')] },
  'tasks missing': { version: 1, nextId: 1 },
  'task is not an object': { version: 1, nextId: 2, tasks: ['x'] },
  'task is null': { version: 1, nextId: 2, tasks: [null] },
  'id 0': { version: 1, nextId: 2, tasks: [task(0, 'ok')] },
  'id negative': { version: 1, nextId: 2, tasks: [task(-1, 'ok')] },
  'id not an integer': { version: 1, nextId: 3, tasks: [task(1.5, 'ok')] },
  'id a string': { version: 1, nextId: 2, tasks: [task('1', 'ok')] },
  'id missing': { version: 1, nextId: 2, tasks: [{ title: 'ok', done: false, created: 'x' }] },
  'title missing': { version: 1, nextId: 2, tasks: [{ id: 1, done: false, created: 'x' }] },
  'title not a string': { version: 1, nextId: 2, tasks: [task(1, 5)] },
  'title empty': { version: 1, nextId: 2, tasks: [task(1, '')] },
  'title of 201 characters': { version: 1, nextId: 2, tasks: [task(1, 'a'.repeat(201))] },
  'done is 1': { version: 1, nextId: 2, tasks: [{ ...task(1, 'ok'), done: 1 }] },
  'done is null': { version: 1, nextId: 2, tasks: [{ ...task(1, 'ok'), done: null }] },
  'flag named completed instead of done': {
    version: 1, nextId: 2, tasks: [{ id: 1, title: 'ok', completed: true, created: 'x' }],
  },
  'created missing': { version: 1, nextId: 2, tasks: [{ id: 1, title: 'ok', done: false }] },
  'created not a string': { version: 1, nextId: 2, tasks: [{ ...task(1, 'ok'), created: 5 }] },
};

for (const [label, data] of Object.entries(bad)) {
  test(`invalid on a temp file: ${label}`, (t) => {
    const result = readTasks(tempFile(t, data));
    assert.equal(result.ok, false);
  });
}

test('the baseline temp file used for the invalid cases is itself valid', (t) => {
  assert.equal(readTasks(tempFile(t, good())).ok, true);
});

test('title limits: 200 characters is valid, and length is counted after trimming', (t) => {
  const exact = { version: 1, nextId: 2, tasks: [task(1, 'a'.repeat(200))] };
  assert.equal(readTasks(tempFile(t, exact)).ok, true);
  const padded = { version: 1, nextId: 2, tasks: [task(1, `  ${'a'.repeat(200)}  `)] };
  assert.equal(readTasks(tempFile(t, padded)).ok, true);
});

test('I-08: any string is a valid created value', (t) => {
  const data = { version: 1, nextId: 2, tasks: [{ ...task(1, 'ok'), created: 'not a date' }] };
  assert.equal(readTasks(tempFile(t, data)).ok, true);
});

test('I-03: unknown fields are accepted and a done flag plus an extra completed field is still valid', (t) => {
  const data = { version: 1, nextId: 2, extra: true, tasks: [{ ...task(1, 'ok'), completed: true, tag: 'x' }] };
  const result = readTasks(tempFile(t, data));
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.tasks[0]), ['id', 'title', 'done', 'created']);
});

test('nextId may be far above the highest id (ids are never reused)', (t) => {
  assert.equal(readTasks(tempFile(t, { version: 1, nextId: 99, tasks: [task(3, 'ok')] })).ok, true);
  assert.equal(readTasks(tempFile(t, { version: 1, nextId: 7, tasks: [] })).ok, true);
});

test('validateData does not change its input', () => {
  const data = { version: 1, nextId: 3, tasks: [task(2, 'b'), task(1, 'a')] };
  const copy = structuredClone(data);
  validateData(data);
  assert.deepEqual(data, copy);
});
