// SPEC 6.5 error table and 7.3 errors.mjs interface.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TodoError, makeError, webBody } from '../../src/errors.mjs';

const F = 'C:\\x\\todo.json';
const TABLE = [
  ['E_USAGE_UNKNOWN_COMMAND', {}, 2, 'unknown command. Run "todo help" for usage.'],
  ['E_USAGE_MISSING_TITLE', {}, 2, 'add needs a task title. Example: todo add buy milk'],
  ['E_USAGE_MISSING_ID', { cmd: 'done' }, 2, 'done needs a task number. Example: todo done 3'],
  ['E_USAGE_MISSING_ID', { cmd: 'remove' }, 2, 'remove needs a task number. Example: todo remove 3'],
  ['E_USAGE_EXTRA_ARGS', { cmd: 'help' }, 2, 'too many arguments for help. Run "todo help" for usage.'],
  ['E_USAGE_BAD_PORT', {}, 2, '--port needs a whole number from 1 to 65535.'],
  ['E_USAGE_UNKNOWN_OPTION', {}, 2, 'unknown option for serve. Run "todo help" for usage.'],
  ['E_TITLE_EMPTY', {}, 2, 'the task title is empty.'],
  ['E_TITLE_TOO_LONG', { n: 201 }, 2, 'the task title is longer than 200 characters (it has 201).'],
  ['E_TITLE_CONTROL', {}, 2, 'the task title contains a character that is not allowed (a control, direction or broken character, such as a line break or tab).'],
  ['E_ID_INVALID', {}, 2, 'a task number must be a whole number from 1 up.'],
  ['E_NOT_FOUND', { id: 7 }, 4, 'there is no task 7.'],
  ['E_FILE_UNREADABLE', { file: F }, 3, `cannot read the task file ${F}.`],
  ['E_FILE_DAMAGED', { file: F }, 3, `the task file ${F} is damaged and was not changed. Fix or move it, then try again.`],
  ['E_FILE_VERSION', { file: F, v: 2 }, 3, `the task file ${F} was written by a different version of todo (file version 2). It was not changed.`],
  ['E_ID_LIMIT', { file: F }, 3, `the task file ${F} has run out of task numbers. Nothing was changed.`],
  ['E_FILE_WRITE', { file: F }, 3, `could not save the task file ${F}. Nothing was changed.`],
  ['E_PORT_IN_USE', { n: 7070 }, 5, 'port 7070 is already in use. Try another one with --port.'],
  ['E_SERVE_FAILED', {}, 5, 'could not start the web view.'],
  ['E_INTERNAL', {}, 1, 'internal error.'],
];

test('every error in SPEC 6.5 has its exit code and exact message', () => {
  for (const [name, params, exitCode, message] of TABLE) {
    const err = makeError(name, params);
    assert.ok(err instanceof TodoError);
    assert.ok(err instanceof Error);
    assert.equal(err.name, name);
    assert.equal(err.exitCode, exitCode, name);
    assert.equal(err.message, message, name);
  }
});

test('webBody: file errors upper-cased with newline; anything else is generic', () => {
  assert.equal(webBody(makeError('E_FILE_DAMAGED', { file: F })), `The task file ${F} is damaged and was not changed. Fix or move it, then try again.\n`);
  assert.equal(webBody(makeError('E_FILE_VERSION', { file: F, v: 2 })), `The task file ${F} was written by a different version of todo (file version 2). It was not changed.\n`);
  assert.equal(webBody(makeError('E_FILE_UNREADABLE', { file: F })), `Cannot read the task file ${F}.\n`);
  assert.equal(webBody(new Error('SECRET-DETAIL')), 'Internal error\n');
  assert.equal(webBody(makeError('E_FILE_WRITE', { file: F })), 'Internal error\n');
  assert.equal(webBody('a string'), 'Internal error\n');
});
