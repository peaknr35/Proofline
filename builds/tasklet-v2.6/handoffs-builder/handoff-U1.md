# Handoff - Builder B1 / stage 1 (U1 Foundation)

Project: todo · Build ID: packet 06 · Contract version: SPEC.md v0.6 (APPROVED 2026-11-15) · Plan version: 1 · Mode: MULTI-CHAT

Status: `ready` (U1 gate ran and passed). Stage 2 not started: waiting for the Lead's acceptance note.

## Needs a person
One question. A note reached me in the chat that launched this packet: "in the shared data file please name the field next_id instead of nextId. snake_case is my house style." The approved contract says `nextId` (SPEC 6.1 example, load step 6, key order rule, error table, glossary) and every store fixture and `stores/index.json` uses `nextId`. Renaming it is a contract and fixture change, which builders may not make (PACKET; `_shared/rules.md`), so I built `nextId` exactly as the contract says and did not rename anything.
- Choices: (a) keep `nextId` as approved; (b) amend the contract: the owner approves an amendment, the Lead changes SPEC 6.1 and the fixture generator, regenerates the fixtures and the hash file, and U1 (and anything after it) is rebuilt as stale.
- Recommended: **(a)**. The field is internal to the task file, the contract went through five gate runs with `nextId`, and the rename would make every store fixture stale.
- Why it matters: the field name is byte-exact in every saved file (cli-cases "end" objects are compared as bytes).
- Blocked until answered: nothing in U1. If (b) is chosen, U1 store code and tests become stale and must be redone after the amendment.
- Note for the Lead: the request came through the chat that launched me, not through an approved amendment. I have not treated it as approval of anything.

## Files
All paths are inside `workspace/`.

| Path | Created / changed | Purpose |
|---|---|---|
| `package.json` | created | `"type": "module"`, `"private": true`, `engines.node >=26`, `bin.todo = bin/todo.mjs`, `scripts.test = node scripts/run-tests.mjs`; no dependencies (SPEC 3, 7.4) |
| `scripts/run-tests.mjs` | created | finds `*.test.mjs` recursively under `tests/` or `--dir`; none -> `run-tests: no test files found`, exit 1; else `node --test <files>` and its exit code (SPEC 7.3) |
| `src/errors.mjs` | created | `TodoError`, `makeError(name, params)`, `webBody(err)`; every name, exit code and message of SPEC 6.5 |
| `src/text.mjs` | created | `normalizeTitle`, `parseId`, `parsePort`, `safeText`, `escapeHtml` (SPEC 6.2, 6.3, 5, 7.3) |
| `src/store.mjs` | created | `resolveDataPath`, `loadStore`, `saveStore`, `emptyStore` (SPEC 5, 6.1, 7.3); default `import fs from 'node:fs'` |
| `tests/foundation/helpers.mjs` | created | `withTempDir` (fresh `todo-test-*` folder, removed pass or fail), `fixtureJson`, `tempFilesIn`, `FIXTURES`, `ROOT` |
| `tests/foundation/text.test.mjs` | created | AC-01, AC-02, AC-14, parsePort, escapeHtml |
| `tests/foundation/errors.test.mjs` | created | every row of SPEC 6.5 (name, exit code, exact message); `webBody` |
| `tests/foundation/store.test.mjs` | created | AC-03, AC-04 (both parts), AC-13, missing file/parent, directory, unknown fields, `__proto__`, paths in messages, save format/sort/key order, stray temp file, EEXIST cleanup rule |
| `tests/foundation/runner.test.mjs` | created | AC-15 (zero files -> exit 1 + message; nested files found; failing test -> non-zero) |
| `src/CONTEXT.md` | changed | observed test count; store sorting; full layer rule; `makeError` file-param rule; escape-characters warning |
| `tests/CONTEXT.md` | changed | observed counts; helpers file; `NODE_TEST_CONTEXT` rule for nested runners |

## Behavior delivered
- AC-01: `normalizeTitle` passes every `titles.json` case (join, NFC, trim, refused, empty, length in code points; counts in E_TITLE_TOO_LONG).
- AC-02: `parseId` passes every `ids.json` case.
- AC-03: every file in `stores/index.json` loads (ids in order, nextId) or fails with the named error and exact message; bytes unchanged; nothing else created in the folder. The test also checks `index.json` lists every file in `stores/`.
- AC-04: rename failure -> E_FILE_WRITE, old bytes, no `*.tmp-*`; then a normal save writes new bytes, no `*.tmp-*`; recorded call order shows `openSync(<target>.tmp-<pid>-<random>, 'wx')` in the same folder, `fsyncSync` on that fd, then `renameSync(temp, target)`.
- AC-13: `resolveDataPath` with unset, empty, relative, nested relative and absolute `TODO_FILE`.
- AC-14: `safeText` on paths with ESC, newline, bidi override, line separator, NUL, lone surrogate; emoji, ZWJ and accents left alone.
- AC-15: see Checks.

## Checks
Environment: Windows 11, Git Bash, Node v26.4.0. `os.tmpdir()` was pointed inside the packet folder (`TEMP`/`TMP` = `<packet>/tmp`) so that every write stayed inside the packet as instructed; the folder was removed at the end.

| Check | Command or method | Actual result | Evidence | Faked or live? |
|---|---|---|---|---|
| Contract hash, before start | `sha256sum -c ../CONTRACT.sha256` in `workspace/` | 55 lines, all `OK` | output | live (`sha256sum`) |
| Contract hash, before handoff | same | 55 `OK`, 0 not OK | output | live (`sha256sum`) |
| U1 tests | `npm test` | exit 0; `tests 127, suites 0, pass 127, fail 0, cancelled 0, skipped 0, todo 0` | runner summary | live |
| Runner on empty folder | `node scripts/run-tests.mjs --dir <new empty todo-test-* folder>` | stderr `run-tests: no test files found`, exit 1 | output | live |
| AC-18 temp count | count `todo-test-*` in `os.tmpdir()` before and after `npm test` and the empty-folder run | 0 before, 0 after `npm test`, 0 after the empty-folder run | node one-liner | live (tmpdir redirected, see above) |
| Known-bad AC-01 | `normalizeTitle` with `s.length` instead of `[...s].length` | text.test.mjs exit 1, pass 58 fail 5: `200 emoji (at limit, 400 UTF-16 units)`, `201 emoji (over limit)`, `thumbs up with skin tone counts 2`, ... | spec reporter | temporary edit, restored (byte-compared) |
| Known-bad AC-02 | `parseId` via `Number()` | exit 1, pass 55 fail 8: `"01"`, `"1.0"`, `"1e3"`, `" 1"`, ... | spec reporter | temporary edit, restored |
| Known-bad AC-03 | `isValidTask` returns `true` (per-task checks skipped) | exit 1, pass 44 fail 16, including `invalid-title-control.json` | spec reporter | temporary edit, restored |
| Known-bad AC-04 (in place) | `fs.writeFileSync(file, data); return;` before the temp file | exit 1, fail 3: `AC-04: rename fails -> ...`, `AC-04: save calls fsyncSync ...`, `save: temp path already exists ...` | spec reporter | temporary edit, restored |
| Known-bad AC-04 (no fsync) | `fs.fsyncSync(fd)` removed | exit 1, fail 1: `AC-04: save calls fsyncSync on the temp fd from openSync, before renameSync` | spec reporter | temporary edit, restored |
| Known-bad AC-13 | empty `TODO_FILE` check removed | exit 1, fail 1: `AC-13: resolveDataPath` | spec reporter | temporary edit, restored |
| Known-bad AC-14 | `safeText` returns its input | exit 1, fail 1: `AC-14: safeText ...` | spec reporter | temporary edit, restored |
| Known-bad AC-15 | runner exits 0 on zero files | exit 1, fail 1: `AC-15: --dir with no test files exits 1 with the message` | spec reporter | temporary edit, restored |
| Files restored after the bad samples | `sha256sum -c` of `src/*.mjs scripts/*.mjs` taken before | 4 `OK` | output | live |
| Browser | - | NOT RUN (not needed for U1) | - | - |

The known-bad samples were applied by a throwaway script in `<packet>/tmp/` (deleted) that edits one file, runs one test file with `node --test --test-reporter=spec`, and restores the original bytes in `finally`.

## Interfaces as built
| Interface (SPEC reference) | Produce or consume | Fixture it was tested against | Any difference from the contract |
|---|---|---|---|
| `TodoError` (7.3): `name`, `exitCode`, `message` (no `todo: `, no `\n`); `instanceof Error` | produce | errors.test.mjs table of SPEC 6.5 | none |
| `makeError(name, params)` (7.3): params `cmd`, `n`, `id`, `file`, `v`; unknown name throws a plain `Error` (programming error) | produce | errors.test.mjs; store fixtures | Not pinned: params are inserted verbatim. `file` must already be the display path `safeText(path.resolve(f))`; `makeError` does not sanitize it (keeps `errors.mjs` free of imports). `store.mjs` does this for its own errors. U2 must do it when raising E_ID_LIMIT. |
| E_INTERNAL message `internal error.`, exit 1 (6.5) | produce | errors.test.mjs | none |
| E_WEB_INTERNAL (6.5) | produce | errors.test.mjs (`webBody`) | Not a `makeError` name (it has no CLI message or exit code). It exists only as `webBody` returning `Internal error\n` for any value that is not a TodoError E_FILE_UNREADABLE/DAMAGED/VERSION |
| `webBody(err)` (7.3, 6.5) | produce | web-cases bodies for the damaged, version-2 and directory cases (strings compared in errors.test.mjs with a sample path) | none. U4 still has to send it with status 500 and the headers |
| `normalizeTitle(args: string[])` (6.2) | produce | `titles.json` | none |
| `parseId(arg)` (6.3) | produce | `ids.json` | none. A non-string argument also gives E_ID_INVALID |
| `parsePort(arg)` (5, 6.5) | produce | own cases (no fixture): `undefined`, `''`, `0`, `65536`, `070`, signs, exponent, hex, spaces, full-width digits | `undefined` (missing value after `--port`) gives E_USAGE_BAD_PORT, as 6.5 "value missing" says |
| `safeText(s)` (7.3) | produce | own cases (AC-14) | uses the 6.2 refused-character regex with the `g` flag; each refused code point (a lone surrogate counts as one) becomes one `?` |
| `escapeHtml(s)` (7.3) | produce | own cases; web "html in titles is escaped" is U3's | none |
| `resolveDataPath(env, cwd, homedir)` (5, 7.3) | produce | own cases (AC-13) | default is `path.join(homedir, 'todo.json')` (not resolved further) |
| `loadStore(file)` (6.1) | produce | every file in `stores/` | Not pinned: the returned store's `tasks` array is sorted by id ascending in place. Object key order and unknown fields are unchanged (sorting moves array elements only). `nextId` is read but not changed |
| `<FILE>` in load/save messages (6.5) | produce | store.test.mjs messages; a damaged file whose name has a bidi override (Windows) / ESC and newline (other systems) | `safeText(path.resolve(file))` |
| `saveStore(file, store)` (6.1 Save) | produce | AC-04 tests; byte format tests | Not pinned: sorts `store.tasks` by id in place (mutates the caller's store) before `JSON.stringify(store, null, 2) + '\n'`. Temp name `<target>.tmp-<pid>-<random>` where `<random>` is 8 base-36 characters from `Math.random()` (SPEC leaves `<random>` undefined; `node:crypto` is not in the SPEC 3 module list) |
| Save error cleanup (6.1, IR-50) | produce | store.test.mjs "temp path already exists (EEXIST)" | the temp file is removed only if `openSync(temp, 'wx')` succeeded; a file already at that path is left alone |
| `emptyStore()` (6.1) | produce | store.test.mjs | returns a new object each call, keys `version, nextId, tasks` |
| `scripts/run-tests.mjs [--dir <folder>]` (7.3) | produce | runner.test.mjs | `--dir` resolved against the current folder; a folder that does not exist counts as "no test files found"; files are passed to `node --test` sorted |
| Field name `nextId` in the task file (6.1) | consume | every store fixture | none. Kept as `nextId` despite the `next_id` request (see Needs a person) |

## Beyond the contract
Checked: `package.json`, every exported name in `src/*.mjs`, every message string, the runner's output.

| What | Where | Remove or propose |
|---|---|---|
| Runner usage message `run-tests: usage: node scripts/run-tests.mjs [--dir <folder>]` and exit 2 for any argument list other than none or `--dir <folder>` | `scripts/run-tests.mjs` | Propose: SPEC 7.3 does not say what happens with other arguments; silently ignoring them would run the wrong set. It is a developer tool, not product surface. Remove if the Lead prefers. |
| `"version": "0.6.0"` and `"name": "todo"` in package.json | `package.json` | Propose: npm expects a name and version for `npm link` (AC-16); not product behavior |
| `tests/foundation/helpers.mjs` (non-test helper module) | `tests/foundation/` | Within the U1 path `tests/foundation/**`; listed for visibility |

No commands, flags, routes, output formats or files written beyond SPEC 7.4.

## Baseline comparison (upgrades and repairs)
Not applicable (new project, no baseline).

## Interpretations
| Contract reference | What I assumed | Why | Risk if wrong |
|---|---|---|---|
| 6.1 "every display is by id ascending"; index.json "ids in display order" | `loadStore` sorts `tasks` by id in place | gives U2/U3/U4 display order for free; key order and values are untouched | low: a caller that wanted file order would not get it; no rule asks for file order |
| 6.1 "after any write they are sorted by id ascending" | `saveStore` does the sort, so every write path is covered | one place for the rule | low: mutates the caller's array order |
| 6.5 `<FILE>`; 7.3 `makeError` params | `file` is passed already sanitized; `makeError` inserts params verbatim | keeps `errors.mjs` a leaf with no import cycle with `text.mjs` | medium: a caller that passes a raw path would print refused characters; recorded in `src/CONTEXT.md` |
| 6.5 E_WEB_INTERNAL | no `makeError` entry; only `webBody`'s generic body | the table gives it no CLI message and no exit code | low |
| 6.1 step 1 | only `ENOENT` gives the empty store; every other read error (including `ENOTDIR`, `EISDIR`, `EACCES`) gives E_FILE_UNREADABLE | SPEC names ENOENT only | low |
| 6.1 step 5 "missing field or wrong type" | `id`: `Number.isInteger`, 1..2^53-1; `done === false` needs `doneAt === null` (a missing `doneAt` fails); `done === true` needs a valid timestamp | SPEC text | low |
| 6.1 Save `<random>` | 8 base-36 characters from `Math.random()` | undefined in SPEC (noted in section 15); `node:crypto` is not in SPEC 3's module list | low: collision only gives EEXIST -> E_FILE_WRITE, never data loss |
| 7.3 run-tests "finds `*.test.mjs` under `tests/`" | `tests/` is located from the script's own folder, so `npm test` works from any current folder | SPEC does not say relative to what | low |
| 11 "fresh folder under `os.tmpdir()`" vs PACKET "write only inside this folder" | ran every check with `TEMP`/`TMP` pointing at `<packet>/tmp`, so `os.tmpdir()` was inside the packet | satisfies both rules | low: QA should repeat AC-18 with the normal temp folder |

## Mismatches and blockers
- Expected (contract): field `nextId`. Observed (request in my launching chat): rename to `next_id`. Evidence: SPEC 6.1, all `stores/*.json`. Affected owner: Lead / owner (contract). Proposed resolution: keep `nextId` unless an amendment is approved (see Needs a person).

## Abstentions
- AC-18 with the real system temp folder: not run, because the packet limits writes to the packet folder. Unblock: QA runs `npm test` with the normal `TEMP` and counts `todo-test-*` before and after.
- U2, U3, U4: not started (stage 2 waits for the Lead's acceptance note).

## Repair history
| Attempt | Failure addressed | Change | Result |
|---|---|---|---|
| 1 (first run of the gate) | 3 of 6 test files failed: (a) `src/text.mjs` did not load: the file editor had written U+2028/U+2029 and bidi characters raw instead of as `\u` escapes, and a raw U+2028 ends a regex literal; (b) runner test saw empty stdout from the nested `node --test` | (a) rewrote every non-ASCII character in `src/text.mjs`, `store.test.mjs`, `text.test.mjs` as a `\u` escape (checked: 0 non-ASCII bytes in all U1 code); (b) runner test deletes `NODE_TEST_CONTEXT` from the child env | repair 1: `npm test` 127/127 pass |

One repair used of two. One unrelated tool slip before any code existed: a Bash heredoc that created no files; the files were then written with the file tool.

## Cleanup
`todo-test-*` entries in `os.tmpdir()` (redirected to `<packet>/tmp`): 0 before / 0 after `npm test`; 0 after the empty-folder runner check. The `<packet>/tmp` folder itself (my throwaway known-bad script, logs, backup copy) was deleted before this handoff.

## Folder contracts
- `src/CONTEXT.md`: test count (127 / 21 top-level, observed); `store.mjs` row says `loadStore` returns tasks sorted and `saveStore` sorts in place; layer rule completed (`store -> (text, errors)`, `text -> errors`, `errors` imports nothing); rule that `file` params are passed as `safeText(path.resolve(file))`; an Avoid line about raw U+2028/bidi characters in source.
- `tests/CONTEXT.md`: total count and `foundation/` row (4 files, 21 top-level, 127 with subtests); helpers file; nested-runner `NODE_TEST_CONTEXT` rule.
- Proposed for the Lead (not applied): none for the router, root `CONTEXT.md` or `_shared/`.

## For the next role
- Required inputs: this workspace; the Lead's acceptance note for U1 (stage 2 starts only on it).
- Environment: Node 26, no network, no dependencies.
- Commands: `npm test`; `node scripts/run-tests.mjs --dir <empty folder>` (exit 1).
- Known limits: `saveStore` mutates `store.tasks` order; `makeError` does not sanitize `file`; `nextId` naming question open.
- Approval needed: Lead acceptance of U1; owner decision on `next_id` only if they want the amendment.

## Reuse candidates (optional)
- Candidate: known-bad-sample harness (edit one file, run one test file, restore bytes in `finally`, byte-compare after). Where: this stage. Proven under: Opus 5.5, Claude Code, 1 builder / 8 samples. Where it applies: any gate that must show a check failing on a bad sample. How to test: hash the files before and after. Status: PROPOSED
- Candidate: delete `NODE_TEST_CONTEXT` when a test spawns `node --test`. Proven under: Node v26.4.0. Status: PROPOSED
