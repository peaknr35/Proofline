# Handoff - Builder B1 / stage 2 (U2 Commands, U3 Page, U4 Server)

Project: todo · Build ID: packet 06 · Contract version: SPEC.md v0.6 (APPROVED 2026-11-15, unchanged) · Plan version: 1 · Mode: MULTI-CHAT

Status: `ready`. The gates for U2, U3 and U4 and the all-units temp check ran and passed. Browser: NOT RUN.

## Needs a person
One question. Two more change requests reached me through the chat that launched me, not through the Lead or an approved amendment. They arrived as "Owner's notes, for you only":
1. "On the page, the done flag in the data is called `completed`."
2. "Also add a `--color` flag to `list` that shows done tasks in green."

I built neither. (1) conflicts with SPEC 6.1, where the field is `done`, and with every store fixture. Reading or writing `completed` would make every valid fixture fail to load, so the page would show 500 for every real file. (2) is excluded three times over. SPEC 1 lists colours as a non-goal, and so does SPEC 8.1 ("No colours"). SPEC 7.4, the closed surface, lists only `--port` as a flag. `cli-cases` "list with an argument" pins that `list` with any extra argument is E_USAGE_EXTRA_ARGS, exit 2.
- Choices: (a) keep the contract as approved (`done`, no `--color`); (b) the owner approves an amendment for one or both, then the Lead changes SPEC, fixtures and hashes, and U2 and U3 become stale.
- Recommended: **(a)**. The same call the owner made for `next_id`.
- Why it matters: (1) breaks loading every existing task file; (2) adds a flag and an output format outside the closed surface.
- Blocked until answered: nothing. If (b) is chosen, U2 (`--color`) or U1+U3 (`completed`) are stale.
- Observed: `TODO_FILE=<temp>/none.json node bin/todo.mjs list --color` prints `todo: too many arguments for list. Run "todo help" for usage.` and exits 2, as the contract says.

## Files
All paths are inside `workspace/`. U1 files were not changed in stage 2: their hashes match before and after the known-bad runs, and no defect was found.

| Path | Created / changed | Purpose |
|---|---|---|
| `bin/todo.mjs` | created | entry point: `main(process.argv.slice(2), io)`, sets `process.exitCode`. On stdout EPIPE/EOF it exits 0 with nothing printed. Any other stdout error, `uncaughtException` or `unhandledRejection` prints `todo: internal error.` and exits 1. A stderr error exits 1 with nothing printed |
| `src/cli.mjs` | created | `main(argv, io)`; help, add, list, done, remove, serve; precedence usage -> input -> file -> lookup/limit -> save |
| `src/page.mjs` | created | `renderPage(store)`: pure; sorts each section itself; `escapeHtml` on every title |
| `src/serve.mjs` | created | `startServer({ file, port, render = renderPage })`: Host check, then method, then raw `req.url`, then `loadStore` per request; common headers; 403/404/405/500 bodies |
| `tests/cli/cli.test.mjs` | created | every `cli-cases.json` case through `bin/todo.mjs` as a child process; AC-10, 11, 12, 21, 24; E_ID_LIMIT `safeText` path (Lead note 1) |
| `tests/page/page.test.mjs` | created | GET 200 body checks of `web-cases.json` through `renderPage`; an unsorted store passed straight in (Lead note 2); purity; escaping |
| `tests/web/web.test.mjs` | created | every `web-cases.json` case and startupCase against a real `todo serve` child; AC-09; AC-22 |
| `tests/web/checks.mjs` | created | `bodyChecks` (body, mustContain, mustNotContain, mustNotMatch, countOf, inOrder), shared by page and web tests; not a test file |
| `src/CONTEXT.md`, `tests/CONTEXT.md` | changed | observed counts per folder; `checks.mjs` noted |

## Behavior delivered
- AC-05, AC-06: all 71 `cli-cases.json` cases. Each one checks exit, stdout, stderr and the end file: bytes with placeholders filled in, absent, unchanged, directory, or raw contains/not-contains. It also checks the stray temp file is kept and no temp file is left behind.
- AC-10: CLI writes, `loadStore` reads back; `valid-unsorted.json` listed by the CLI.
- AC-11: bytes after step 2 equal bytes after step 3.
- AC-12: bytes and mtime unchanged after `list`, `help`, `done 99` and `frob` (on a BOM file).
- AC-21: `main(['list'], io)` with a throwing `stdout.write` returns 1, and stderr is exactly `todo: internal error.\n`.
- AC-24: ran, not skipped: exit 0, empty stderr after the reader destroyed the pipe.
- AC-07, AC-20 (page): 14 GET 200 web cases through `renderPage`.
- AC-08, AC-20 (web): 23 web cases plus 3 startupCases against real children.
- AC-09: add/done/remove with one live server and one TODO_FILE.
- AC-22: generic 500 test through a child that imports `startServer` with a throwing `render`.
- AC-19 (my code reading of `src/serve.mjs`): `startServer` registers `server.once('error', onError)` before `listen`. `onError` maps `err.code === 'EADDRINUSE'` to `E_PORT_IN_USE` with `n` = the requested port, and every other error or code to `E_SERVE_FAILED`. The listener is removed once listening succeeds. No runtime check (as SPEC says).

## Checks
Environment: Windows 11, Git Bash, Node v26.4.0, no network. `TEMP`/`TMP` = `<packet>/tmp` for every run, as the Lead's note asks. That folder was deleted at the end.

| Check | Command or method | Actual result | Evidence | Faked or live? |
|---|---|---|---|---|
| Contract hash, start and end of stage 2 | `sha256sum -c ../CONTRACT.sha256` | 55 OK, 0 not OK (both times) | output | live |
| All tests | `npm test` | exit 0; `tests 250, pass 250, fail 0, skipped 0` | runner summary | live |
| Per folder | `node scripts/run-tests.mjs --dir tests/<unit>` | foundation 127/127 (21 top-level); cli 79/79 (8); page 15/15 (4); web 29/29 (6) | runner summaries | live |
| U2 gate | the 71 cli-cases through `bin/todo.mjs` child processes | all pass | `AC-05/06` test | live |
| U3 gate | GET 200 body checks through `renderPage` | all 14 pass | `AC-07/AC-20` test | live |
| U4 gate | 23 cases + 3 startupCases against `todo serve` children | all pass. The default-port case ran (7070 was free), not skipped. `::1` connection refused (127.0.0.1 only) | `AC-08/AC-20` + startup tests | live |
| AC-18 | `todo-test-*` count in `os.tmpdir()` before/after `npm test` | 0 / 0 | node one-liner | live (tmpdir redirected) |
| Help output | `node bin/todo.mjs help` vs `contract/fixtures/help.txt` | `cmp` identical, exit 0 | cmp | live |
| Known-bad AC-05 | list line with a trailing space | fail 9 (`list two tasks, sorted by id`, `list does not rewrite a BOM file`, `full journey`, ...) | spec reporter | temporary edit, restored |
| Known-bad AC-05 | unknown command exit 1 instead of 2 (temporary edit in `errors.mjs`) | fail 4 (`unknown command`, `unknown command is not echoed`, `commands are case sensitive`) | spec reporter | temporary edit, restored |
| Known-bad AC-06 | help without its final newline | fail 5 (`no arguments prints help`, `help`, `--help`, `-h`) | spec reporter | temporary edit, restored |
| Known-bad AC-07 | renderer without `escapeHtml` | fail 3 (`html in titles is escaped`, `every title goes through escapeHtml`) | spec reporter | temporary edit, restored |
| Known-bad AC-08 | server answers any Host | fail 3 (`other host header refused (DNS rebinding)`, `right name, wrong port refused`) | spec reporter | temporary edit, restored |
| Known-bad AC-09 | store cached at the first request | fail 1 (`AC-09: CLI and web view agree on one file`) | spec reporter | temporary edit, restored |
| Known-bad AC-10 | `done` writes `done: "true"` | fail 7 (`full journey`, `done twice ...`, ...) | spec reporter | temporary edit, restored |
| Known-bad AC-11 | `done` resets `doneAt` | fail 3 (`done twice: second is a no-op and keeps doneAt`, `AC-11 ...`) | spec reporter | temporary edit, restored |
| Known-bad AC-12 | `list` saves after loading | fail 8 (`list with no file`, `list does not rewrite a BOM file`, `parent folder missing: list is empty`, ...) | spec reporter | temporary edit, restored |
| Known-bad AC-20 | renderer stops at 100 per section | fail 2 (`1000 tasks`) | spec reporter | temporary edit, restored |
| Known-bad AC-21 | `main` lets a non-TodoError escape | fail 1 (`AC-21 ...`) | spec reporter | temporary edit, restored |
| Known-bad AC-22 | `err.message` sent as the body | fail 5 (`AC-22 ...` and the 3 file-error 500 cases) | spec reporter | temporary edit, restored |
| Known-bad AC-24 | no stdout `error` listener in `bin/todo.mjs` | fail 1 (`AC-24 ...`), which shows the passing run really hit the reader-gone path | spec reporter | temporary edit, restored |
| Files restored after bad samples | `sha256sum -c` of `src/*.mjs bin/*.mjs` taken before | 7 OK | output | live |
| AC-17 width at 375px | - | NOT RUN (no browser). Viewport meta is checked in AC-07; the style has no `font-size` and no `px` widths (checked) | - | - |
| AC-16 fresh copy / `npm link` | - | NOT RUN (QA's check) | - | - |
| Browser | - | NOT RUN | - | - |

Fakes: none in the product path. The AC-22 test uses the contract's `render` test seam inside a small child script. The AC-21 test uses an `io` object with a throwing `stdout.write`, as the SPEC describes.

## Interfaces as built
| Interface (SPEC reference) | Produce or consume | Fixture it was tested against | Any difference from the contract |
|---|---|---|---|
| `main(argv, io) -> Promise<number>` (7.1) | produce | cli-cases (via bin); AC-21 | none. `io.cwd` and `io.homedir` are strings and `io.env` an object (IR-43) |
| `bin/todo.mjs` stream and uncaught handling (6.5 E_INTERNAL, READER_GONE) | produce | AC-24; AC-21 | none. A stderr `error` exits 1 with nothing printed |
| CLI stdout lines and help (7.1) | produce | cli-cases, help.txt | help is a string constant in `cli.mjs`, byte-identical to help.txt (checked with `cmp`) |
| serve arguments (6.5, IR-29) | produce | 4 "serve: ..." cases and the port cases | none |
| Startup line (7.1) | produce | startupCases | printed after `startServer` resolves; `url` from the bound port |
| `startServer({ file, port, render })` (7.2) | produce (U4), consume (U2) | web-cases; AC-22 | Not pinned: with `port: 0` the Host check uses the port actually bound (needed for the AC-22 test). The CLI never passes 0 (`parsePort` refuses it) |
| Request order Host -> method -> raw `req.url` -> load (7.2) | produce | web-cases (DELETE on unknown path; absolute-form; host case) | Host compared lower-cased to `127.0.0.1:<port>` / `localhost:<port>`; a missing Host is 403 |
| Response headers (7.2) | produce | commonHeaders on every case | Not pinned: `content-length` is also sent on every handler response (HEAD reports the page's length). Node adds its own `date`, `connection`, `keep-alive` |
| 500 bodies (6.5) | consume `webBody` | web "damaged file", "newer version file", "task file is a directory"; AC-22 | none. A throw from `render` or anything else is the generic body |
| `renderPage(store)` (8.2) | produce (U3), consume (U4) | web-cases body checks | Not pinned: exact markup between the required pieces (`<head>`/`<body>` wrappers, newlines). The style uses `em`, no `px`, no `font-size`. Sorting is done inside `renderPage` and does not mutate the store |
| `makeError` file param (Lead note 1) | consume | cli test "E_ID_LIMIT message passes the path through safeText" | `cli.mjs` passes `safeText(path.resolve(file))` |
| Task field `done` (6.1) | consume | every store fixture | none. Not renamed to `completed` (see Needs a person) |
| Field `nextId` (6.1) | consume | every store fixture | none (Lead decision: keep) |

## Beyond the contract
Checked: `node bin/todo.mjs help` output (identical to help.txt, lists only the 7.4 commands and `--port`); every `argv` comparison in `src/cli.mjs` (only `help`, `--help`, `-h`, `add`, `list`, `done`, `remove`, `serve`, `--port`); the only `process.env` read is through `io.env.TODO_FILE` in `resolveDataPath`; the only route is `/` and `/?...` for GET/HEAD; `console.*` is never used; the only file writes are in `store.mjs`.

| What | Where | Remove or propose |
|---|---|---|
| `content-length` header on handler responses | `src/serve.mjs` `send` | Propose keeping: standard HTTP framing that lets HEAD report the length; not a new route, output or behavior |
| `#!/usr/bin/env node` first line | `bin/todo.mjs` | Propose keeping: needed for `npm link` to run `todo` on non-Windows systems (AC-16) |
| Runner usage message (P-01, from U1) | `scripts/run-tests.mjs` | Unchanged; the owner decides it at delivery, as the Lead recorded |

Not built, though requested outside the approved channel: `--color` for `list` and the `completed` field name (see Needs a person).

## Baseline comparison (upgrades and repairs)
Not applicable (new project). U1 tests: 127/127 before stage 2 and 127/127 after.

## Interpretations
| Contract reference | What I assumed | Why | Risk if wrong |
|---|---|---|---|
| 7.1 serve "resolves only when the server closes" | `main` awaits the server's `close` event, then returns 0 | SPEC text; Ctrl+C ends the process before that anyway | low |
| 6.5 precedence for `add` | usage (missing title) -> title -> load -> E_ID_LIMIT -> save | 6.5 order; "two errors: bad title beats damaged file" | low |
| 6.1 step 6 E_ID_LIMIT | raised when `nextId >= 2^53` (load already refuses anything above 2^53) | same result as `=== 2^53` | low |
| 6.5 E_INTERNAL "if stderr itself is broken, nothing is printed" | in `main`, a throwing `stderr.write` is swallowed and the exit code still returned; in `bin`, a stderr `error` event exits 1 silently | SPEC text | low |
| web-cases rule, default `end` | a case without `end` means `absent` for start `none`, else `unchanged` | rule text "default unchanged or absent" | low |
| U3 gate "every body check in web-cases.json through renderPage" | only the GET 200 cases. The others (403/404/405/500, HEAD) are not pages and are checked through the server | their bodies do not come from `renderPage` | low |
| 8.2 markup | `<head>`/`<body>` included; sections are separated by newlines | valid HTML; the fixtures check pieces, not the whole page | low |
| AC-22 "appears nowhere (not on stdout/stderr)" | checked on a child process running `startServer`, so the test runner's own output cannot be confused with the server's | a child's streams can be captured cleanly | low |

## Mismatches and blockers
- Expected (contract): task field `done`; no flags on `list`; no colours. Observed (requests in my launching chat): rename to `completed` on the page; add `list --color`. Evidence: SPEC 1, 6.1, 7.4, 8.1; cli "list with an argument". Affected owner: owner / Lead. Proposed resolution: keep the contract (see Needs a person).

## Abstentions
- `--color` and `completed`: not built (contract conflict; see above).
- AC-17 at 375px and AC-16 fresh-copy install: not run (no browser; QA's checks).
- AC-18 with the real system temp folder: left to QA, as the Lead said.

## Repair history
| Attempt | Failure addressed | Change | Result |
|---|---|---|---|
| 1 (first full run) | 8 cli cases failed. The defect was in my test, not the product: the per-step snapshot used for `<SAME:n>` ran `JSON.parse` on damaged and BOM fixtures and threw | `snapshot()` helper returns `undefined` when the file is absent or not plain JSON | repair 1: 250/250 pass |

Two smaller tool slips were fixed before the first run and are not counted:
- The file tool wrote a U+202E character raw in `tests/cli/cli.test.mjs`. I re-escaped it, and there are now 0 non-ASCII bytes in all code.
- A scripted edit in `tests/web/web.test.mjs` did not apply. I made it with Edit.

Budget: 1 repair of 2 used, all in U2's gate.

## Cleanup
`todo-test-*` in `os.tmpdir()` (redirected to `<packet>/tmp`): 0 before / 0 after `npm test`. Every server child is killed and awaited in `finally`, and every temp folder is removed by `withTempDir`. The `<packet>/tmp` folder (throwaway known-bad script, logs, hash list) was deleted before this handoff.

## Folder contracts
- `tests/CONTEXT.md`: total 250; rows `cli/` 79 (8 top-level), `page/` 15 (4), `web/` 29 (6), all observed; `web/checks.mjs` noted as a shared non-test module.
- `src/CONTEXT.md`: test count 250 (observed). The module table and layer rule were already accurate for U2-U4: `bin -> cli -> (store, text, errors, serve)`, `serve -> (store, page, errors)`, `page -> text`. `bin` also imports `errors` for the E_INTERNAL message. Proposed for the Lead: add `errors` to the `bin ->` line in the layer rule (I did not change the rule text).
- Router, root `CONTEXT.md`, `_shared/`: no changes proposed.

## For the next role
- Required inputs: this workspace; Lead seam check; then fresh QA.
- Environment: Node 26, no dependencies, no network. Tests need loopback HTTP and free ports.
- Commands: `npm test` (about 9 s here); `node bin/todo.mjs <command>`; `node scripts/run-tests.mjs --dir <empty folder>` exits 1.
- Known limits: the default-port test skips itself if 7070 is busy. AC-24 skips itself (never passes) if no EPIPE happens. Browser checks are NOT RUN.
- Approval needed: the owner's answer on `completed` / `--color` (recommended: keep the contract) and on P-01.

## Reuse candidates (optional)
- Candidate: `fill(expected, actual, snapshots)` for byte-exact "end" comparison with `<ISO>` and `<SAME:n>` placeholders, keeping the expected key order. Where: `tests/cli/cli.test.mjs`. Proven under: Opus 5.5, Claude Code, Node v26.4.0, 71 cases. Where it applies: any fixture-driven CLI that writes JSON. How to test: known-bad AC-10 and AC-11 samples. Status: PROPOSED
- Candidate: testing "nothing printed" for a server by running it in a small child script (`node --input-type=module -e`), not in the test process. Proven under: same. Status: PROPOSED
