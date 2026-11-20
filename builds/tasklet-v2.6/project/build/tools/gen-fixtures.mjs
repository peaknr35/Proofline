// Lead-owned. Regenerates contract/fixtures/ from the decisions in SPEC.md.
// Run from the project root: node build/tools/gen-fixtures.mjs
// Builders never run or edit this; they read the generated fixtures.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', 'contract', 'fixtures');
rmSync(root, { recursive: true, force: true });
mkdirSync(join(root, 'stores'), { recursive: true });
const w = (p, s) => writeFileSync(join(root, p), s);
const j = (v) => JSON.stringify(v, null, 2) + '\n';
const T1 = '2026-11-15T09:00:00.000Z', T3 = '2026-11-15T10:00:00.000Z';
const r = (s, n) => s.repeat(n);

// ---------- titles ----------
const titles = {
  rule: 'SPEC 6.2: join args with one space -> NFC -> trim (String.prototype.trim) -> refused-character check -> empty check -> length check (Unicode code points, after NFC and trim, max 200).',
  cases: [
    { name: 'two words joined', args: ['buy', 'milk'], title: 'buy milk' },
    { name: 'one quoted arg', args: ['buy milk'], title: 'buy milk' },
    { name: 'outer spaces trimmed', args: ['  buy milk  '], title: 'buy milk' },
    { name: 'inner spaces kept', args: ['buy  milk'], title: 'buy  milk' },
    { name: 'empty middle arg keeps both joins', args: ['a', '', 'b'], title: 'a  b' },
    { name: 'no-break space trimmed', args: ['\u00a0x\u00a0'], title: 'x' },
    { name: 'ideographic space trimmed', args: ['\u3000x'], title: 'x' },
    { name: 'leading dashes are title text', args: ['--port', '5'], title: '--port 5' },
    { name: 'decomposed e-acute stored as one code point', args: ['cafe\u0301'], title: 'caf\u00e9' },
    { name: 'empty string', args: [''], error: 'E_TITLE_EMPTY' },
    { name: 'only spaces', args: ['   '], error: 'E_TITLE_EMPTY' },
    { name: 'only tab and newline (trimmed away)', args: [' \t\n '], error: 'E_TITLE_EMPTY' },
    { name: 'inner tab', args: ['a\tb'], error: 'E_TITLE_CONTROL' },
    { name: 'inner newline', args: ['a\nb'], error: 'E_TITLE_CONTROL' },
    { name: 'inner carriage return', args: ['a\rb'], error: 'E_TITLE_CONTROL' },
    { name: 'null byte', args: ['a\u0000b'], error: 'E_TITLE_CONTROL' },
    { name: 'escape (terminal colour codes)', args: ['\u001b[31mred'], error: 'E_TITLE_CONTROL' },
    { name: 'delete char', args: ['a\u007fb'], error: 'E_TITLE_CONTROL' },
    { name: 'C1 control', args: ['a\u0085b'], error: 'E_TITLE_CONTROL' },
    { name: 'line separator', args: ['a\u2028b'], error: 'E_TITLE_CONTROL' },
    { name: 'paragraph separator', args: ['a\u2029b'], error: 'E_TITLE_CONTROL' },
    { name: 'bidi override', args: ['\u202eabc'], error: 'E_TITLE_CONTROL' },
    { name: 'bidi isolate', args: ['a\u2066b'], error: 'E_TITLE_CONTROL' },
    { name: 'lone high surrogate (broken character)', args: ['a' + String.fromCharCode(0xd800) + 'b'], error: 'E_TITLE_CONTROL' },
    { name: 'lone low surrogate alone', args: [String.fromCharCode(0xdc00)], error: 'E_TITLE_CONTROL' },
    { name: 'control and too long: control wins', args: [r('a', 250) + '\t' + 'b'], error: 'E_TITLE_CONTROL' },
    { name: '199 ascii (under limit)', args: [r('a', 199)], title: r('a', 199) },
    { name: '200 ascii (at limit)', args: [r('a', 200)], title: r('a', 200) },
    { name: '201 ascii (over limit)', args: [r('a', 201)], error: 'E_TITLE_TOO_LONG', count: 201 },
    { name: '200 ascii plus outer spaces (trim first)', args: ['  ' + r('a', 200) + '  '], title: r('a', 200) },
    { name: '100 + 99 joined by a space = 200', args: [r('a', 100), r('b', 99)], title: r('a', 100) + ' ' + r('b', 99) },
    { name: '100 + 100 joined by a space = 201', args: [r('a', 100), r('b', 100)], error: 'E_TITLE_TOO_LONG', count: 201 },
    { name: 'one emoji is one code point', args: ['\u{1F389}'], title: '\u{1F389}' },
    { name: '200 emoji (at limit, 400 UTF-16 units)', args: [r('\u{1F389}', 200)], title: r('\u{1F389}', 200) },
    { name: '201 emoji (over limit)', args: [r('\u{1F389}', 201)], error: 'E_TITLE_TOO_LONG', count: 201 },
    { name: 'thumbs up with skin tone counts 2', args: [r('a', 198) + '\u{1F44D}\u{1F3FD}'], title: r('a', 198) + '\u{1F44D}\u{1F3FD}' },
    { name: 'thumbs up with skin tone over limit', args: [r('a', 199) + '\u{1F44D}\u{1F3FD}'], error: 'E_TITLE_TOO_LONG', count: 201 },
    { name: 'zero width joiner allowed (family emoji, 5 code points)', args: ['\u{1F468}\u200d\u{1F469}\u200d\u{1F467}'], title: '\u{1F468}\u200d\u{1F469}\u200d\u{1F467}' },
    { name: '200 decomposed e-acute = 400 before NFC, 200 after (at limit)', args: [r('e\u0301', 200)], title: r('\u00e9', 200) },
    { name: '201 decomposed e-acute (over limit after NFC)', args: [r('e\u0301', 201)], error: 'E_TITLE_TOO_LONG', count: 201 },
    { name: 'html characters are plain text', args: ['<b>&"\''], title: '<b>&"\'' },
  ],
};
w('titles.json', j(titles));

// ---------- ids ----------
const ids = {
  rule: 'SPEC 6.3: an id argument must match ^[1-9][0-9]*$ and be <= 9007199254740991; otherwise E_ID_INVALID.',
  cases: [
    { arg: '1', id: 1 }, { arg: '42', id: 42 },
    { arg: '9007199254740990', id: 9007199254740990 },
    { arg: '9007199254740991', id: 9007199254740991 },
    { arg: '9007199254740992', error: 'E_ID_INVALID' },
    { arg: '0', error: 'E_ID_INVALID' }, { arg: '-1', error: 'E_ID_INVALID' },
    { arg: '01', error: 'E_ID_INVALID' }, { arg: '1.0', error: 'E_ID_INVALID' },
    { arg: '1e3', error: 'E_ID_INVALID' }, { arg: 'abc', error: 'E_ID_INVALID' },
    { arg: ' 1', error: 'E_ID_INVALID' }, { arg: '1 ', error: 'E_ID_INVALID' },
    { arg: '', error: 'E_ID_INVALID' }, { arg: '\uff11', error: 'E_ID_INVALID' },
    { arg: '0x1', error: 'E_ID_INVALID' }, { arg: '+1', error: 'E_ID_INVALID' },
  ],
};
w('ids.json', j(ids));

// ---------- stores ----------
const task = (id, title, done, doneAt = null, extra = {}) => ({ id, title, done, createdAt: T1, doneAt, ...extra });
const stores = {
  'valid-empty.json': { version: 1, nextId: 1, tasks: [] },
  'valid-two.json': { version: 1, nextId: 4, tasks: [task(1, 'buy milk', false), task(3, 'call the bank', true, T3)] },
  'valid-unsorted.json': { version: 1, nextId: 4, tasks: [task(3, 'call the bank', true, T3), task(1, 'buy milk', false)] },
  'valid-unknown-fields.json': { version: 1, nextId: 2, note: 'kept', tasks: [task(1, 'buy milk', false, null, { color: 'blue' })] },
  'valid-html-chars.json': { version: 1, nextId: 3, tasks: [task(1, '<b>&"\'', false), task(2, '<script>alert(1)</script>', true, T3)] },
  'valid-nextid-gap.json': { version: 1, nextId: 10, tasks: [task(2, 'b', false)] },
  'valid-title-200.json': { version: 1, nextId: 2, tasks: [task(1, r('a', 200), false)] },
  'valid-nextid-max.json': { version: 1, nextId: 9007199254740991, tasks: [] },
  'valid-nextid-exhausted.json': { version: 1, nextId: 9007199254740992, tasks: [task(9007199254740991, 'last', false)] },
  // both sections out of file order (v0.5, IR-48)
  'valid-sections-unsorted.json': { version: 1, nextId: 6, tasks: [task(5, 'e', false), task(4, 'd', true, T3), task(2, 'b', false), task(1, 'a', true, T3)] },
  // about 200 KB of list output: more than an OS pipe buffer, so a reader that closes early causes EPIPE (AC-24)
  'valid-1000-long.json': { version: 1, nextId: 1001, tasks: Array.from({ length: 1000 }, (_, i) => task(i + 1, 'task ' + (i + 1) + ' ' + r('x', 180), false)) },
  'valid-1000.json': { version: 1, nextId: 1001, tasks: Array.from({ length: 1000 }, (_, i) => task(i + 1, 'task ' + (i + 1), i % 2 === 1, i % 2 === 1 ? T3 : null)) },
  'invalid-version-2.json': { version: 2, nextId: 1, tasks: [] },
  'invalid-version-string.json': { version: '1', nextId: 1, tasks: [] },
  'invalid-version-missing.json': { nextId: 1, tasks: [] },
  'invalid-nextid-missing.json': { version: 1, tasks: [] },
  'invalid-nextid-zero.json': { version: 1, nextId: 0, tasks: [] },
  'invalid-nextid-low.json': { version: 1, nextId: 3, tasks: [task(3, 'x', false)] },
  'invalid-tasks-not-array.json': { version: 1, nextId: 1, tasks: {} },
  'invalid-dup-id.json': { version: 1, nextId: 3, tasks: [task(1, 'a', false), task(1, 'b', false)] },
  'invalid-id-zero.json': { version: 1, nextId: 2, tasks: [task(0, 'a', false)] },
  'invalid-id-string.json': { version: 1, nextId: 2, tasks: [task('1', 'a', false)] },
  'invalid-title-control.json': { version: 1, nextId: 2, tasks: [task(1, 'a\u001b[31mb', false)] },
  'invalid-title-untrimmed.json': { version: 1, nextId: 2, tasks: [task(1, ' a', false)] },
  'invalid-title-empty.json': { version: 1, nextId: 2, tasks: [task(1, '', false)] },
  'invalid-title-not-nfc.json': { version: 1, nextId: 2, tasks: [task(1, 'cafe\u0301', false)] },
  'invalid-title-201.json': { version: 1, nextId: 2, tasks: [task(1, r('a', 201), false)] },
  'invalid-done-not-boolean.json': { version: 1, nextId: 2, tasks: [task(1, 'a', 'yes')] },
  'invalid-done-without-doneAt.json': { version: 1, nextId: 2, tasks: [task(1, 'a', true, null)] },
  'invalid-open-with-doneAt.json': { version: 1, nextId: 2, tasks: [task(1, 'a', false, T3)] },
  'invalid-createdAt-format.json': { version: 1, nextId: 2, tasks: [{ ...task(1, 'a', false), createdAt: '2026-11-15 09:00' }] },
  'invalid-createdAt-impossible.json': { version: 1, nextId: 2, tasks: [{ ...task(1, 'a', false), createdAt: '2026-02-30T09:00:00.000Z' }] },
  'invalid-task-missing-field.json': { version: 1, nextId: 2, tasks: [{ id: 1, title: 'a', done: false, createdAt: T1 }] },
  'invalid-task-not-object.json': { version: 1, nextId: 2, tasks: ['a'] },
};
for (const [f, v] of Object.entries(stores)) w('stores/' + f, j(v));
w('stores/valid-bom.json', '\ufeff' + j(stores['valid-two.json']));
w('stores/invalid-not-json.json', '{not json\n');
w('stores/invalid-empty-file.json', '');
w('stores/invalid-top-array.json', '[]\n');
w('stores/invalid-truncated.json', j(stores['valid-two.json']).slice(0, 40));

// Raw-text files: content JSON.stringify cannot produce. BS = one backslash character.
const BS = String.fromCharCode(92);
const head = '{\n  "version": 1,\n  "nextId": ';
const raw = {
  'invalid-nextid-over.json': [head + '9007199254741000,\n  "tasks": []\n}\n', { error: 'E_FILE_DAMAGED' }],
  'invalid-nextid-huge.json': [head + '1e300,\n  "tasks": []\n}\n', { error: 'E_FILE_DAMAGED' }],
  'invalid-title-lone-surrogate.json': [head + '2,\n  "tasks": [{"id": 1, "title": "a' + BS + 'ud800b", "done": false, "createdAt": "' + T1 + '", "doneAt": null}]\n}\n', { error: 'E_FILE_DAMAGED' }],
  'valid-proto-key.json': [head + '1,\n  "__proto__": {"x": 1},\n  "tasks": []\n}\n', { ok: true, ids: [], nextId: 1 }],
  'valid-unknown-bignum.json': [head + '1,\n  "big": 12345678901234567890,\n  "tasks": []\n}\n', { ok: true, ids: [], nextId: 1 }],
  'valid-dup-key.json': [head + '1,\n  "note": "first",\n  "note": "second",\n  "tasks": []\n}\n', { ok: true, ids: [], nextId: 1 }],
  'valid-escaped-title.json': [head + '2,\n  "tasks": [{"id": 1, "title": "caf' + BS + 'u00e9", "done": false, "createdAt": "' + T1 + '", "doneAt": null}]\n}\n', { ok: true, ids: [1], nextId: 2 }],
};
for (const [f, [text]] of Object.entries(raw)) w('stores/' + f, text);
// two leading BOMs: the decoder drops one, the second makes JSON.parse fail
raw['invalid-double-bom.json'] = [null, { error: 'E_FILE_DAMAGED' }];
writeFileSync(join(root, 'stores', 'invalid-double-bom.json'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf, 0xef, 0xbb, 0xbf]), Buffer.from(j(stores['valid-two.json']))]));
// invalid UTF-8: the bytes C3 28 are not a valid UTF-8 sequence
writeFileSync(join(root, 'stores', 'invalid-bad-utf8.json'), Buffer.concat([Buffer.from(head + '2,\n  "tasks": [{"id": 1, "title": "a'), Buffer.from([0xc3, 0x28]), Buffer.from('b", "done": false, "createdAt": "' + T1 + '", "doneAt": null}]\n}\n')]));

const idx = { rule: 'SPEC 6.1. For valid files: "ids" = task ids in display order (ascending), "nextId" as loaded. Every invalid file must produce the named error and its bytes must be unchanged afterwards.', files: {} };
const all = [...Object.keys(stores), 'valid-bom.json', 'invalid-not-json.json', 'invalid-empty-file.json', 'invalid-top-array.json', 'invalid-truncated.json', 'invalid-bad-utf8.json', ...Object.keys(raw)].sort();
for (const f of all) {
  if (raw[f]) idx.files[f] = raw[f][1];
  else if (f === 'invalid-bad-utf8.json') idx.files[f] = { error: 'E_FILE_DAMAGED' };
  else if (f.startsWith('valid-')) {
    const s = f === 'valid-bom.json' ? stores['valid-two.json'] : stores[f];
    idx.files[f] = { ok: true, ids: s.tasks.map((t) => t.id).sort((a, b) => a - b), nextId: s.nextId };
  } else idx.files[f] = f === 'invalid-version-2.json' ? { error: 'E_FILE_VERSION', fileVersion: 2 } : { error: 'E_FILE_DAMAGED' };
}
w('stores/index.json', j(idx));

// ---------- help ----------
const help = [
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
w('help.txt', help);

// ---------- cli cases ----------
const ISO = '<ISO>';
const ok = (args, stdout) => ({ args, exit: 0, stdout, stderr: '' });
const err = (args, exit, stderr) => ({ args, exit, stdout: '', stderr });
const M = {
  unknown: 'todo: unknown command. Run "todo help" for usage.\n',
  missTitle: 'todo: add needs a task title. Example: todo add buy milk\n',
  missId: (c) => `todo: ${c} needs a task number. Example: todo ${c} 3\n`,
  extra: (c) => `todo: too many arguments for ${c}. Run "todo help" for usage.\n`,
  badId: 'todo: a task number must be a whole number from 1 up.\n',
  notFound: (n) => `todo: there is no task ${n}.\n`,
  damaged: 'todo: the task file <FILE> is damaged and was not changed. Fix or move it, then try again.\n',
  version: (v) => `todo: the task file <FILE> was written by a different version of todo (file version ${v}). It was not changed.\n`,
  ctrl: 'todo: the task title contains a character that is not allowed (a control, direction or broken character, such as a line break or tab).\n',
  idLimit: 'todo: the task file <FILE> has run out of task numbers. Nothing was changed.\n',
  port: 'todo: --port needs a whole number from 1 to 65535.\n',
  option: 'todo: unknown option for serve. Run "todo help" for usage.\n',
};
const cli = {
  rule: 'SPEC 7.1 and 8.1. Each case runs its steps in order against one TODO_FILE in a fresh temp folder. start "none" = no file; "directory" = TODO_FILE is an existing empty folder; "missing-parent" = TODO_FILE is <temp>/missing/todo.json and <temp>/missing does not exist; "stray-temp" = valid-two.json copied to TODO_FILE plus a file <TODO_FILE>.tmp-999-abc containing "junk" (it must still exist, unchanged, after the case); otherwise a stores/ fixture copied byte for byte. end "directory" = still an empty folder. An "end" object is compared as BYTES: replace each placeholder with the actual value found at that place in the file (after checking it matches), then the file must equal JSON.stringify(end, null, 2) + "\\n" exactly, so key order is part of the contract (SPEC 6.1 key order). When a case has no "end", only "endRawContains" / "endRawNotContains" apply: substrings of the final file text. A step with "stdoutLineCount" checks the number of lines and the first and last line instead of the whole stdout. Placeholders: <FILE> = path.resolve(TODO_FILE); <HELP> = exact contents of help.txt; in "end", <ISO> = any value matching the timestamp rule in SPEC 6.1, <SAME:n> = the value this field had in the file after step n (1-based). end "absent" = no file at TODO_FILE; "unchanged" = byte-identical to the start fixture.',
  cases: [
    { name: 'list with no file', start: 'none', steps: [ok(['list'], 'No tasks.\n')], end: 'absent' },
    { name: 'list empty store', start: 'valid-empty.json', steps: [ok(['list'], 'No tasks.\n')], end: 'unchanged' },
    { name: 'list two tasks, sorted by id', start: 'valid-unsorted.json', steps: [ok(['list'], '1. [ ] buy milk\n3. [x] call the bank\n')], end: 'unchanged' },
    { name: 'list does not rewrite a BOM file', start: 'valid-bom.json', steps: [ok(['list'], '1. [ ] buy milk\n3. [x] call the bank\n')], end: 'unchanged' },
    { name: 'add creates the file', start: 'none', steps: [ok(['add', 'buy', 'milk'], 'Added 1: buy milk\n')],
      end: { version: 1, nextId: 2, tasks: [{ id: 1, title: 'buy milk', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'full journey', start: 'none', steps: [
      ok(['add', 'buy milk'], 'Added 1: buy milk\n'),
      ok(['add', 'call', 'the', 'bank'], 'Added 2: call the bank\n'),
      ok(['list'], '1. [ ] buy milk\n2. [ ] call the bank\n'),
      ok(['done', '1'], 'Done 1: buy milk\n'),
      ok(['list'], '1. [x] buy milk\n2. [ ] call the bank\n'),
      ok(['remove', '2'], 'Removed 2: call the bank\n'),
      ok(['list'], '1. [x] buy milk\n'),
      err(['remove', '2'], 4, M.notFound(2)),
    ], end: { version: 1, nextId: 3, tasks: [{ id: 1, title: 'buy milk', done: true, createdAt: ISO, doneAt: ISO }] } },
    { name: 'ids are never reused', start: 'none', steps: [
      ok(['add', 'a'], 'Added 1: a\n'), ok(['add', 'b'], 'Added 2: b\n'),
      ok(['remove', '2'], 'Removed 2: b\n'), ok(['add', 'c'], 'Added 3: c\n'),
      ok(['remove', '1'], 'Removed 1: a\n'), ok(['remove', '3'], 'Removed 3: c\n'),
      ok(['list'], 'No tasks.\n'), ok(['add', 'd'], 'Added 4: d\n'),
    ], end: { version: 1, nextId: 5, tasks: [{ id: 4, title: 'd', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'nextId gap is respected', start: 'valid-nextid-gap.json', steps: [ok(['add', 'x'], 'Added 10: x\n')],
      end: { version: 1, nextId: 11, tasks: [{ id: 2, title: 'b', done: false, createdAt: T1, doneAt: null }, { id: 10, title: 'x', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'done twice: second is a no-op and keeps doneAt', start: 'none', steps: [
      ok(['add', 'a'], 'Added 1: a\n'), ok(['done', '1'], 'Done 1: a\n'), ok(['done', '1'], 'Task 1 is already done.\n'),
    ], end: { version: 1, nextId: 2, tasks: [{ id: 1, title: 'a', done: true, createdAt: '<SAME:2>', doneAt: '<SAME:2>' }] } },
    { name: 'unknown fields survive a write', start: 'valid-unknown-fields.json', steps: [ok(['add', 'x'], 'Added 2: x\n')],
      end: { version: 1, nextId: 3, note: 'kept', tasks: [{ id: 1, title: 'buy milk', done: false, createdAt: T1, doneAt: null, color: 'blue' }, { id: 2, title: 'x', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'BOM file is accepted and written back without BOM', start: 'valid-bom.json', steps: [ok(['done', '1'], 'Done 1: buy milk\n')],
      end: { version: 1, nextId: 4, tasks: [{ id: 1, title: 'buy milk', done: true, createdAt: T1, doneAt: ISO }, { id: 3, title: 'call the bank', done: true, createdAt: T1, doneAt: T3 }] } },
    { name: 'title at limit is accepted', start: 'none', steps: [ok(['add', r('a', 200)], 'Added 1: ' + r('a', 200) + '\n')],
      end: { version: 1, nextId: 2, tasks: [{ id: 1, title: r('a', 200), done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'title too long', start: 'none', steps: [err(['add', r('a', 201)], 2, 'todo: the task title is longer than 200 characters (it has 201).\n')], end: 'absent' },
    { name: 'title empty', start: 'none', steps: [err(['add', '  '], 2, 'todo: the task title is empty.\n')], end: 'absent' },
    { name: 'title control', start: 'none', steps: [err(['add', 'a\nb'], 2, M.ctrl)], end: 'absent' },
    { name: 'no arguments prints help', start: 'none', steps: [ok([], '<HELP>')], end: 'absent' },
    { name: 'help', start: 'none', steps: [ok(['help'], '<HELP>')], end: 'absent' },
    { name: '--help', start: 'none', steps: [ok(['--help'], '<HELP>')], end: 'absent' },
    { name: '-h', start: 'none', steps: [ok(['-h'], '<HELP>')], end: 'absent' },
    { name: 'help with extra', start: 'none', steps: [err(['help', 'x'], 2, M.extra('help'))], end: 'absent' },
    { name: 'unknown command', start: 'none', steps: [err(['frob'], 2, M.unknown)], end: 'absent' },
    { name: 'unknown command is not echoed', start: 'none', steps: [err(['\u001b[2J'], 2, M.unknown)], end: 'absent' },
    { name: 'commands are case sensitive', start: 'none', steps: [err(['LIST'], 2, M.unknown)], end: 'absent' },
    { name: 'add without title', start: 'none', steps: [err(['add'], 2, M.missTitle)], end: 'absent' },
    { name: 'done without id', start: 'none', steps: [err(['done'], 2, M.missId('done'))], end: 'absent' },
    { name: 'remove without id', start: 'none', steps: [err(['remove'], 2, M.missId('remove'))], end: 'absent' },
    { name: 'done with two ids', start: 'valid-two.json', steps: [err(['done', '1', '3'], 2, M.extra('done'))], end: 'unchanged' },
    { name: 'list with an argument', start: 'valid-two.json', steps: [err(['list', '--all'], 2, M.extra('list'))], end: 'unchanged' },
    { name: 'remove bad id', start: 'valid-two.json', steps: [err(['remove', 'abc'], 2, M.badId)], end: 'unchanged' },
    { name: 'done unknown id', start: 'valid-two.json', steps: [err(['done', '2'], 4, M.notFound(2))], end: 'unchanged' },
    { name: 'damaged file: add refused, bytes unchanged', start: 'invalid-not-json.json', steps: [err(['add', 'x'], 3, M.damaged)], end: 'unchanged' },
    { name: 'damaged file: list refused', start: 'invalid-truncated.json', steps: [err(['list'], 3, M.damaged)], end: 'unchanged' },
    { name: 'damaged file: control char in stored title', start: 'invalid-title-control.json', steps: [err(['list'], 3, M.damaged)], end: 'unchanged' },
    { name: 'newer version refused', start: 'invalid-version-2.json', steps: [err(['add', 'x'], 3, M.version(2))], end: 'unchanged' },
    { name: 'two errors: bad id beats damaged file', start: 'invalid-not-json.json', steps: [err(['done', 'abc'], 2, M.badId)], end: 'unchanged' },
    { name: 'two errors: bad title beats damaged file', start: 'invalid-not-json.json', steps: [err(['add', 'a\tb'], 2, M.ctrl)], end: 'unchanged' },
    { name: 'two errors: damaged file beats unknown id', start: 'invalid-not-json.json', steps: [err(['done', '99'], 3, M.damaged)], end: 'unchanged' },
    { name: 'two errors: usage beats damaged file', start: 'invalid-not-json.json', steps: [err(['done', '1', '2'], 2, M.extra('done'))], end: 'unchanged' },
    { name: 'task file is a directory', start: 'directory', steps: [err(['list'], 3, 'todo: cannot read the task file <FILE>.\n')], end: 'directory' },
    { name: 'task file is a directory: add', start: 'directory', steps: [err(['add', 'x'], 3, 'todo: cannot read the task file <FILE>.\n')], end: 'directory' },
    { name: 'parent folder missing: list is empty', start: 'missing-parent', steps: [ok(['list'], 'No tasks.\n')], end: 'absent' },
    { name: 'parent folder missing: add cannot save', start: 'missing-parent', steps: [err(['add', 'x'], 3, 'todo: could not save the task file <FILE>. Nothing was changed.\n')], end: 'absent' },
    { name: 'serve port zero', start: 'none', steps: [err(['serve', '--port', '0'], 2, M.port)], end: 'absent' },
    { name: 'serve port too high', start: 'none', steps: [err(['serve', '--port', '65536'], 2, M.port)], end: 'absent' },
    { name: 'serve port not a number', start: 'none', steps: [err(['serve', '--port', '80a'], 2, M.port)], end: 'absent' },
    { name: 'serve port leading zero', start: 'none', steps: [err(['serve', '--port', '080'], 2, M.port)], end: 'absent' },
    { name: 'serve port missing value', start: 'none', steps: [err(['serve', '--port'], 2, M.port)], end: 'absent' },
    { name: 'serve port equals form not supported', start: 'none', steps: [err(['serve', '--port=8080'], 2, M.option)], end: 'absent' },
    { name: 'serve unknown option', start: 'none', steps: [err(['serve', '--open'], 2, M.option)], end: 'absent' },
    { name: 'serve port given twice', start: 'none', steps: [err(['serve', '--port', '8080', '--port', '8081'], 2, M.extra('serve'))], end: 'absent' },
    { name: 'serve: left to right, bad port seen first', start: 'none', steps: [err(['serve', '--port', '0', '--open'], 2, M.port)], end: 'absent' },
    { name: 'serve: left to right, unknown option seen first', start: 'none', steps: [err(['serve', '--open', '--port', '0'], 2, M.option)], end: 'absent' },
    { name: 'serve: --port takes the next arg as its value', start: 'none', steps: [err(['serve', '--port', '--port'], 2, M.port)], end: 'absent' },
    { name: 'serve: bad first value beats the repeat', start: 'none', steps: [err(['serve', '--port', '0', '--port', '1'], 2, M.port)], end: 'absent' },
    { name: '--help with extra', start: 'none', steps: [err(['--help', 'x'], 2, M.extra('help'))], end: 'absent' },
    { name: '-h with extra', start: 'none', steps: [err(['-h', 'x'], 2, M.extra('help'))], end: 'absent' },
    { name: 'write sorts tasks by id', start: 'valid-unsorted.json', steps: [ok(['add', 'x'], 'Added 4: x\n')],
      end: { version: 1, nextId: 5, tasks: [{ id: 1, title: 'buy milk', done: false, createdAt: T1, doneAt: null }, { id: 3, title: 'call the bank', done: true, createdAt: T1, doneAt: T3 }, { id: 4, title: 'x', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'last task number is usable', start: 'valid-nextid-max.json', steps: [ok(['add', 'x'], 'Added 9007199254740991: x\n')],
      end: { version: 1, nextId: 9007199254740992, tasks: [{ id: 9007199254740991, title: 'x', done: false, createdAt: ISO, doneAt: null }] } },
    { name: 'no task numbers left: add refused', start: 'valid-nextid-exhausted.json', steps: [err(['add', 'x'], 3, M.idLimit)], end: 'unchanged' },
    { name: 'no task numbers left: other commands still work', start: 'valid-nextid-exhausted.json', steps: [ok(['done', '9007199254740991'], 'Done 9007199254740991: last\n')],
      end: { version: 1, nextId: 9007199254740992, tasks: [{ id: 9007199254740991, title: 'last', done: true, createdAt: T1, doneAt: ISO }] } },
    { name: 'nextId above the limit is damaged', start: 'invalid-nextid-over.json', steps: [err(['list'], 3, M.damaged)], end: 'unchanged' },
    { name: 'invalid UTF-8 is damaged, not repaired', start: 'invalid-bad-utf8.json', steps: [err(['add', 'x'], 3, M.damaged)], end: 'unchanged' },
    { name: 'two leading BOMs are damaged', start: 'invalid-double-bom.json', steps: [err(['list'], 3, M.damaged)], end: 'unchanged' },
    { name: 'lone surrogate in stored title is damaged', start: 'invalid-title-lone-surrogate.json', steps: [err(['list'], 3, M.damaged)], end: 'unchanged' },
    { name: 'escaped title in file is read as its character', start: 'valid-escaped-title.json', steps: [ok(['list'], '1. [ ] caf' + String.fromCharCode(0xe9) + '\n')], end: 'unchanged' },
    { name: 'unknown __proto__ key kept as a plain field', start: 'valid-proto-key.json', steps: [ok(['add', 'x'], 'Added 1: x\n')],
      endRawContains: ['"__proto__": {\n    "x": 1\n  }', '"nextId": 2'] },
    { name: 'unknown fields keep their parsed value (big number loses precision)', start: 'valid-unknown-bignum.json', steps: [ok(['add', 'x'], 'Added 1: x\n')],
      endRawContains: ['"big": 12345678901234567000'] },
    { name: 'duplicate unknown key: last one kept', start: 'valid-dup-key.json', steps: [ok(['add', 'x'], 'Added 1: x\n')],
      endRawContains: ['"note": "second"'], endRawNotContains: ['"first"'] },
    { name: 'list sorts across open and done', start: 'valid-sections-unsorted.json', steps: [ok(['list'], '1. [x] a\n2. [ ] b\n4. [x] d\n5. [ ] e\n')], end: 'unchanged' },
    { name: 'stray temp file is never read', start: 'stray-temp', steps: [ok(['list'], '1. [ ] buy milk\n3. [x] call the bank\n')], end: 'unchanged' },
    { name: '1000 tasks are listed', start: 'valid-1000.json', steps: [{ args: ['list'], exit: 0, stdoutLineCount: 1000, stdoutFirstLine: '1. [ ] task 1', stdoutLastLine: '1000. [x] task 1000', stderr: '' }], end: 'unchanged' },
  ],
};
w('cli-cases.json', j(cli));

// ---------- web ----------
const html = 'text/html; charset=utf-8', text = 'text/plain; charset=utf-8';
const web = {
  rule: 'SPEC 7.2 and 8.2. Each case: copy the start fixture to TODO_FILE (or none), start `todo serve --port <free port>`, wait for the startup line, send one request with Host: 127.0.0.1:<PORT> unless "host" is given, check status, content-type, commonHeaders on every response, then the body checks, then "end" (default "unchanged" or "absent"; the server never writes the file).',
  commonHeaders: {
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store',
  },
  cases: [
    { name: 'page with two tasks', start: 'valid-two.json', method: 'GET', path: '/', status: 200, contentType: html,
      mustContain: ['<!doctype html>', '<html lang="en">', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">', '<title>To-do</title>', '<h1>To-do</h1>',
        '<section id="open">', '<h2>Open (1)</h2>', '<li data-id="1">buy milk</li>', '<section id="done">', '<h2>Done (1)</h2>', '<li data-id="3">call the bank</li>'],
      mustNotContain: ['<script', ' src=', '<link', 'http://', 'https://', 'class="empty"', '<form', '<a ', '<img', '<iframe', 'href='],
      inOrder: ['<section id="open">', '<li data-id="1">', '<section id="done">', '<li data-id="3">'] },
    { name: 'empty list', start: 'valid-empty.json', method: 'GET', path: '/', status: 200, contentType: html,
      mustContain: ['<h2>Open (0)</h2>', '<h2>Done (0)</h2>'], mustNotContain: ['<li', '<ul'], countOf: { '<p class="empty">None.</p>': 2 } },
    { name: 'no file at all', start: 'none', method: 'GET', path: '/', status: 200, contentType: html, mustContain: ['<h2>Open (0)</h2>', '<h2>Done (0)</h2>'], end: 'absent' },
    { name: 'html in titles is escaped', start: 'valid-html-chars.json', method: 'GET', path: '/', status: 200, contentType: html,
      mustContain: ['<li data-id="1">&lt;b&gt;&amp;&quot;&#39;</li>', '<li data-id="2">&lt;script&gt;alert(1)&lt;/script&gt;</li>'], mustNotContain: ['<script', '<b>'] },
    { name: 'tasks sorted by id within each section', start: 'valid-unsorted.json', method: 'GET', path: '/', status: 200, contentType: html, inOrder: ['<section id="open">', '<li data-id="1">buy milk</li>', '<section id="done">', '<li data-id="3">call the bank</li>'] },
    { name: 'query string ignored', start: 'valid-two.json', method: 'GET', path: '/?x=1', status: 200, contentType: html, mustContain: ['<h2>Open (1)</h2>'] },
    { name: 'HEAD gives headers, no body', start: 'valid-two.json', method: 'HEAD', path: '/', status: 200, contentType: html, body: '' },
    { name: 'localhost host header allowed', start: 'valid-two.json', method: 'GET', path: '/', host: 'localhost:<PORT>', status: 200, contentType: html, mustContain: ['<h2>Open (1)</h2>'] },
    { name: 'other host header refused (DNS rebinding)', start: 'valid-two.json', method: 'GET', path: '/', host: 'evil.example:<PORT>', status: 403, contentType: text, body: 'Forbidden\n' },
    { name: 'right name, wrong port refused', start: 'valid-two.json', method: 'GET', path: '/', host: '127.0.0.1:1', status: 403, contentType: text, body: 'Forbidden\n' },
    { name: 'each section sorted by id', start: 'valid-sections-unsorted.json', method: 'GET', path: '/', status: 200, contentType: html,
      inOrder: ['<section id="open">', '<li data-id="2">b</li>', '<li data-id="5">e</li>', '<section id="done">', '<li data-id="1">a</li>', '<li data-id="4">d</li>'] },
    { name: 'absolute-form target is not found', start: 'valid-two.json', method: 'GET', path: 'http://127.0.0.1:<PORT>/', status: 404, contentType: text, body: 'Not found\n',
      note: 'the client sends this exact request target (http.request with path set to it sends it unchanged); Host header as usual' },
    { name: 'unknown path', start: 'valid-two.json', method: 'GET', path: '/tasks.json', status: 404, contentType: text, body: 'Not found\n' },
    { name: 'index.html is not an alias', start: 'valid-two.json', method: 'GET', path: '/index.html', status: 404, contentType: text, body: 'Not found\n' },
    { name: 'path traversal is just an unknown path', start: 'valid-two.json', method: 'GET', path: '/../todo.json', status: 404, contentType: text, body: 'Not found\n' },
    { name: 'POST refused', start: 'valid-two.json', method: 'POST', path: '/', status: 405, contentType: text, body: 'Method not allowed\n', headers: { allow: 'GET, HEAD' } },
    { name: 'DELETE on unknown path: method checked first', start: 'valid-two.json', method: 'DELETE', path: '/x', status: 405, contentType: text, body: 'Method not allowed\n', headers: { allow: 'GET, HEAD' } },
    { name: 'damaged file', start: 'invalid-not-json.json', method: 'GET', path: '/', status: 500, contentType: text, body: 'The task file <FILE> is damaged and was not changed. Fix or move it, then try again.\n' },
    { name: 'newer version file', start: 'invalid-version-2.json', method: 'GET', path: '/', status: 500, contentType: text, body: 'The task file <FILE> was written by a different version of todo (file version 2). It was not changed.\n' },
  ],
};
web.startupCases = [
  { name: 'startup line', args: ['serve', '--port', '<PORT>'], stdoutFirstLine: 'Serving your list at http://127.0.0.1:<PORT>/ (press Ctrl+C to stop)', listensOn: '127.0.0.1 only' },
  { name: 'default port', args: ['serve'], stdoutFirstLine: 'Serving your list at http://127.0.0.1:7070/ (press Ctrl+C to stop)', note: 'skip if 7070 is busy on the test machine; record SKIPPED, not PASS' },
  { name: 'port in use', args: ['serve', '--port', '<BUSY>'], exit: 5, stdout: '', stderr: 'todo: port <BUSY> is already in use. Try another one with --port.\n' },
];
web.cases.push({ name: 'task file is a directory', start: 'directory', method: 'GET', path: '/', status: 500, contentType: text, body: 'Cannot read the task file <FILE>.\n', end: 'directory' });
web.cases.push(
  { name: 'host header is case-insensitive', start: 'valid-two.json', method: 'GET', path: '/', host: 'LOCALHOST:<PORT>', status: 200, contentType: html, mustContain: ['<h2>Open (1)</h2>'] },
  { name: 'style sets no font sizes and no pixel widths', start: 'valid-two.json', method: 'GET', path: '/', status: 200, contentType: html,
    countOf: { '<style>': 1 }, mustNotMatch: ['font-size', '(?:min-|max-)?width\\s*:\\s*[0-9.]+px'] },
  { name: '1000 tasks', start: 'valid-1000.json', method: 'GET', path: '/', status: 200, contentType: html,
    mustContain: ['<h2>Open (500)</h2>', '<h2>Done (500)</h2>', '<li data-id="1000">task 1000</li>'], countOf: { '<li data-id=': 1000 } },
);
web.rule += ' "mustNotMatch" entries are JavaScript regular expressions (no flags) that must not match the body. <PORT> is replaced by the real port wherever it appears: in "host", in "path" and in expected text (v0.6, IR-49).';
w('web-cases.json', j(web));
console.log('fixtures written to', root);
