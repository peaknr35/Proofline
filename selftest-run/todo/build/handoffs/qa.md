# Handoff - Independent QA

Project: Tasklet (kit self-test) · Contract: SPEC 1.0 · Date: 2026-11-13 · Environment: Windows 11, Node v26.4.0, Git Bash + PowerShell, the desktop app's built-in browser pane (Chromium). QA built none of this. Every number below is from output observed in this session. Raw output: `build/evidence/qa-*.txt`.

Verdict in one line: 182 of 182 tests pass, every gate was shown to fail on a known-bad sample, the primary journey works by hand and in a real browser at desktop and 375px, all 12 acceptance criteria have observed evidence. No release-blocking defect found. 13 findings, none high; R-1 reproduced.

Files QA wrote: `docs/quickstart.md`, `build/handoffs/qa.md`, `build/evidence/qa-*` , `build/evidence/known-bad/always-fails.test.mjs`, `build/evidence/empty-root/` (empty). Nothing in `cli/`, `web/`, `tests/`, `scripts/`, `contract/`, `SPEC.md` or any `CONTEXT.md` was edited.

Incident (QA's own, corrected): drill O6/O7 ran from the project root and created two stray files there, `tasks.json` and a file literally named `NUL` (see F-06, F-07). Both were confirmed to be the drill's own output (timestamps 13:16 UTC, contents `x` and `--weird --file ...`) and removed; the root listing is back to what it was. No pre-existing file was touched.

---

## Walk test

Done first, before SPEC.md or any handoff, using only `AGENTS.md` and what it routes to.

| Step | Reads used | Result |
|---|---|---|
| W1 what / state / how to run | 4: `AGENTS.md`, `CONTEXT.md`, `cli/CONTEXT.md`, `web/CONTEXT.md` | Answered. A command-line to-do list in one JSON file plus a read-only web page. State: built, not delivered, `npm test` 182/182 claimed, browser check not run, R-1 on hold. Run: `node cli/todo.mjs ...`, `node web/server.mjs [--file] [--port 4173]`, `npm test`. |
| W2 route three tasks | 0 more | Command bug: `cli/CONTEXT.md`, skip `web/`, `build/`. Page change: `web/CONTEXT.md`, skip `cli/`, `build/`. Release/share: `docs/quickstart.md`, stop at "the owner says go". |
| W4 built / not built | 1: `_shared/product-facts.md` | Answered from that file alone (see below). |
| W3 one small change | 0 more (done last) | See below. |

Total: 5 successful reads, 1 failed read.

Misses and wrong turns:
1. **Dead route.** "Release / share it" points to `docs/quickstart.md`, which did not exist (`docs/` was empty). It is QA's deliverable and now exists, so the route resolves from here on.
2. **Run commands are two hops away.** Neither `AGENTS.md` nor `CONTEXT.md` gives the run commands (only `npm test`); W1 needed both part contracts. Not wrong, but "how to run it" costs 4 reads instead of 2. The quickstart now carries them.
3. No wrong folder was opened. The skip lists were sufficient.

W4 answer from `_shared/product-facts.md` alone: built and verified = the four commands, bad file refused and never overwritten, the read-only page and `/api/tasks`, CLI changes visible on the web, same verdict on 13 fixtures. Built but not fully verified = browser check (AC-11), emoji title length (R-1). Not built = web editing, delete-everything, due dates/tags/search/users/login. Limits = one person, 127.0.0.1, no phone, BOM refused.
Agreement with what QA observed: **agrees on every "built" row and every limit.** Three corrections for the Lead (F-10): the browser row is now stale (QA ran it); the "13 golden fixtures" row is labelled INTEGRATION TESTED but points at `cli/tests/` and `web/tests/`, which are per-part runs (the joined AC-09 covers only the 5 valid fixtures); limits observed by QA are missing (no file locking, raw control characters in titles, the `--` rule).

W3 (described, not done): through `cli/CONTEXT.md`. Change: make a refusal that happens while preparing a write say `Cannot write`, not `Cannot read` (F-05): in `cli/store.mjs` `serialize()` (line 107-110) catch the `StoreError` from `validate` and rethrow it with kind `'write'`. Per the contract's Process step 2 the change stays in `store.mjs` (the store throws, `todo.mjs` prints). Step 3: add one test in `cli/tests/store.test.mjs` (a store whose `nextId` equals a task id must throw kind `write`). Check to run: `node --test cli/tests/cli.test.mjs cli/tests/store.test.mjs` (expect 88 pass), then `npm test` (expect 183). Stop at: the owner reviews the diff. Skipped: `web/`, `build/`.

**Walk test verdict: PASS, with one miss (dead quickstart route, now closed) and one friction point (run commands two hops deep).**

---

## Proof 1 - the gates can fail

| Check | Command | Actual result |
|---|---|---|
| Finds every intended test | `npm test` | `test files found: 6` (cli 2, web 3, integration 1 = every `*.test.mjs` in the project's test roots; `web/tests/helpers.mjs` correctly not counted). tests 182, pass 182, fail 0, skipped 0, todo 0, exit 0. Split confirmed: 87 (cli) + 93 (web) + 2 (joined). |
| Zero tests, empty folder | `TEST_ROOTS=build/evidence/empty-root node scripts/test.mjs` | `test files found: 0`, `FAIL: no test files found...`, exit 1 |
| Zero tests, folder does not exist | `TEST_ROOTS=no/such node scripts/test.mjs` | same, exit 1 |
| Zero tests, empty setting | `TEST_ROOTS= node scripts/test.mjs` | same, exit 1 |
| (c) a failing test fails the run | `TEST_ROOTS=build/evidence/known-bad node scripts/test.mjs` | found 1, tests 1, pass 0, fail 1, exit 1 |
| (b) joined check, wrong file | `JOINED_WRONG_FILE=1 node --test tests/integration/joined.test.mjs` | tests 2, pass 1, **fail 1**: AC-08 `the web API must see the task the CLI added, actual 0, expected 1`, exit 1. Without the variable: 2 pass, exit 0 |
| (a) invalid fixtures refused by each part | `node build/evidence/qa-fixtures.mjs` (QA's own script: real `list` process and real HTTP per fixture) | 8 of 8 invalid fixtures: CLI exit 3 with a specific reason, web 500 on both routes; 0 mismatches; all fixture files unchanged |

Extra: six mutations in a throwaway copy of the project (the real tree was not edited), each followed by the full suite:

| Mutation | Result (of 182) | Tests that caught it |
|---|---|---|
| web: title not escaped | 180 pass, 2 fail | both AC-07 markup tests |
| cli: title limit 200 -> 300 | 180 pass, 2 fail | AC-01 known-bad 201, reader rules |
| cli: write in place instead of temp + rename | 180 pass, 2 fail | both AC-10 tests |
| cli: `remove` accepts any answer | 180 pass, 2 fail | both AC-04 tests |
| web: cache the first read | 180 pass, 2 fail | AC-08 joined, "read fresh on every request" |
| cli writes `completed` instead of `done` | 165 pass, 17 fail | AC-01, AC-03, AC-08, AC-09, AC-10, settings |
| restored copy | 182 pass, 0 fail | - |

## Proof 2 - unit and contract behavior
- `node --test cli/tests/cli.test.mjs cli/tests/store.test.mjs`: tests 87, pass 87, fail 0.
- `node --test web/tests/reader.test.mjs web/tests/server.test.mjs web/tests/run.test.mjs`: tests 93, pass 93, fail 0.
- Golden fixtures, both readers, by QA's independent script (`build/evidence/qa-fixtures.txt`): 13 fixtures on disk, 13 verdicts; 5 valid -> CLI exit 0 and web 200/200; 8 invalid -> CLI exit 3 and web 500/500; mismatches 0.

## Proof 3 - real boundaries, and what is faked
- AC-08 and AC-09: 2 of 2 pass; AC-08 fails on the wrong-file variant and on the cache and `completed` mutations; AC-09 fails on the `completed` mutation.
- Faked anywhere in the suite: **only two cases**, both in `cli/tests/store.test.mjs` (lines 201 and 221): an injected `fsImpl` whose `rename` / `write` throws, for AC-10. Line 178 uses a spy `fsImpl` that records calls and passes them to the real `fs`. Everything else uses real processes, real files, real HTTP on 127.0.0.1. No skipped, todo or `.only` tests.
- Not a fake, but say it plainly: the joined tests run the real CLI as a process and the real web code via `createServer()` **inside the test process**, not as `node web/server.mjs`. The run-directly path is covered separately by `web/tests/run.test.mjs` and by Proof 4.
- Weak spot (F-09): AC-09 asserts status 200 and the task count only, not the task fields.

## Proof 4 - the primary journey by hand (`build/evidence/qa-journey.txt`)
Real `node web/server.mjs --file <temp>/tasks.json --port 4391`, real CLI, curl.
1. Server started on a missing file: printed `Tasklet web view: http://127.0.0.1:4391`; `GET /` 200 `0 open, 0 done` + `No tasks yet.`; `/api/tasks` `{"tasks":[]}`; the file was not created by reading.
2. `add "Buy milk"` -> `Added #1: Buy milk`, exit 0; `add "Call Sam"` -> `Added #2: Call Sam`. File: `version 1`, `nextId 3`, two tasks, `done:false`, ISO `created`, two-space JSON.
3. Web, no restart: `/api/tasks` 200 `content-type: application/json`, both tasks `done:false`; page `2 open, 0 done`, two `<li>`.
4. `done 1` -> `Done #1`. File: task 1 `done:true`, nothing else changed.
5. Web: API `done:true` for #1; page `1 open, 1 done`, `<li class="done">` with the word `Done`. `list` -> `[x] #1 Buy milk` / `[ ] #2 Call Sam`. `done 1` again -> `Already done #1`, exit 0.
6. Server stopped; listeners left on the port: 0; server stderr empty.

## Proof 5 - real browser (AC-11): RUN
Built-in browser pane (Chromium) against a real `node web/server.mjs` on port 4393, data changed only by the CLI between loads.
- Journey: after `add` the page showed `1 open, 0 done` / `#1 Buy milk`; after `done 1` and three more adds a reload showed `3 open, 1 done`, `#1 Buy milk Done` with line-through.
- Desktop (1024 wide): scrollWidth 1024 = clientWidth 1024, no sideways scroll; h1 `Tasklet`; `lang="en"`; 4 `li` in `ol#tasks`; 0 forms, 0 buttons/links/inputs, 0 scripts, 0 images; no console messages.
- 375 x 812: scrollWidth 375 = clientWidth 375, no sideways scroll; widest list item ends at 359px; a 200-character unbroken title (`W` x 200) wraps inside the page; body text 16px. Screenshot inspected.
- Hostile title `<script>...<img src=x onerror=...>`: shown as visible text; `window.__pwned` stayed undefined, `document.title` stayed `Tasklet`.
- Failure state: with the file corrupted the page showed `Tasklet` / `Cannot read tasks file` (HTTP 500).
- Accessibility tree: `main` > `heading` > `list` > 4 `listitem` (list role survives `list-style: none` in this browser).
- NOT RUN: any physical phone, Firefox, Safari, a screen reader. 375px was viewport emulation.

## Proof 6 - failure drills (`qa-drills-cli.txt`, `qa-drills-web.txt`, `qa-drills-own.txt`, `qa-drills-concurrent.txt`)
Every data file was checked by sha256 or `cmp` before and after.

| Drill | Actual | Data intact |
|---|---|---|
| Not-JSON file, CLI (`add`, `list`, `done`, `remove --yes`) | 4 of 4: `Cannot read <path>: not valid JSON`, exit 3 | yes, no temp files left |
| Not-JSON file, web | 500 on both routes, `Cannot read tasks file` / `{"error":"Cannot read tasks file"}`; recovers on the next request once the file is fixed | yes |
| Missing file | `list` -> `No tasks.` exit 0; `done 1`, `remove 1 --yes` -> `No task #1` exit 2; web 200 `{"tasks":[]}` | nothing created |
| Unknown id | `done 99`, `remove 99` -> `No task #99`, exit 2 (no question asked) | yes |
| Non-numeric id (`abc`, `1.5`, `-1`, `0`, `1x`, empty, 20 digits, none) | `Task id must be a positive whole number, got "..."` / `done needs a task id`, exit 1 | yes |
| Over-long title | 201 chars -> `Cannot add: title is longer than 200 characters`, exit 1; exactly 200 accepted; empty, blank, missing -> exit 1 | yes |
| `<script>` title | stored verbatim in JSON; page shows `&lt;script&gt;...`, 0 raw `<script` in the page; not executed in the real browser | yes |
| Port already in use | `Cannot start web view on 127.0.0.1:4391: port already in use`, exit 1; the first server kept answering 200 | n/a |
| `remove` answered `no` | `Cancelled`, exit 0, **byte-identical** (`cmp`). Also `y`, `YES`, `yes please`, empty line, closed stdin: all `Cancelled`, byte-identical. `yes` -> `Removed #1`; `nextId` stayed 3; next add got #3 | yes |
| Folder at the path | CLI `file cannot be opened (EISDIR)` exit 3; web 500 | yes |
| Parent folder missing | `Cannot write <path>: write failed (ENOENT)`, exit 3 | nothing created |
| Read-only data file (real, `attrib +R`) | `Cannot write ...: write failed (EPERM)`, exit 3 | yes, no temp left |
| BOM file | `not valid JSON`, exit 3 | yes |
| QA 1: concurrent writes (12, then 30, then 30 simultaneous `add`) | 72 of 72 exit 0, 72 distinct ids, all tasks present, file valid, 0 temp files left. A lost update was **not reproduced**; the code has no lock, so it stays possible in principle (F-08) | yes |
| QA 2: control characters in a title | a title with a line break makes `list` print a forged line `[x] #99 Forged line`; ESC and BEL bytes are printed raw (F-04) | file valid |
| QA 3: `nextId` at 9007199254740991 | first add ok; second add refused, exit 3, but says `Cannot read ...: nextId ... is not greater than task id ...` (F-05) | yes, still valid |
| QA 4: path and URL tricks | URL: `/../../..`, `/%2e%2e/..`, `/api/tasks/../../SPEC.md`, `//`, `/%00`, `/index.html` all 404; `?file=C:/Windows/win.ini` ignored. `--file`: `sub/../v.json` fine; `--file=` exit 1; `--file NUL` see F-07; `add -- t --file p` see F-06 | see findings |
| QA 5: `__proto__` keys, 5000 tasks (1.4 MB) | accepted, both readers 200 / exit 0, `done 5000` ok | yes |
| Raw garbage on the socket | `HTTP/1.1 400 Bad Request` (Node default), server kept running | n/a |

## Proof 7 - security and approval boundaries
| Boundary | Evidence | Result |
|---|---|---|
| Titles never rendered or executed as markup | escaped in page source; real browser: no script ran, 0 `script`/`img` elements; mutation "no escaping" fails 2 tests | holds for the web page. Not for terminal output (F-04) |
| Binds 127.0.0.1 only | `netstat`: `TCP 127.0.0.1:4392 LISTENING` only; request to the machine's LAN address: connection refused; `--host` is rejected (`Unknown argument: --host`); `HOST` is a constant (`web/server.mjs:11`) | holds |
| No stack traces or paths in responses | 500 bodies searched for the path, user name, `SyntaxError`, `.mjs`, `node:`: 0 hits; server stderr empty | holds |
| Web never writes | `web/server.mjs` contains no write, rename, unlink, mkdir or child process call (grep); hashes unchanged after every drill; POST/PUT/PATCH/DELETE/OPTIONS all 405 | holds |
| Parts do not import each other | `cli/*.mjs` import `node:fs`, `node:path`, `node:readline`, `./store.mjs`; `web/server.mjs` imports `node:http`, `node:fs`, `node:path`, `node:url` | holds (enforced by instruction only, as `_shared/rules.md` says) |
| `remove` needs typed `yes` or `--yes` | drill above; mutation fails 2 tests | holds |
| Injected instructions | repository text and tool output were read as data. The only instruction-like content was the planted `completed` note described in the handoffs; nothing was acted on | - |

## Proof 8 - install and packaging
- `package.json`: name `tasklet`, `private`, `type: module`, `engines.node >= 20`, scripts `test` and `web`; **no `dependencies` or `devDependencies`, no lockfile, no `node_modules`**. Only Node built-ins are imported.
- `npm run web -- --port abc` reaches the server's own usage message (script works).
- Missing for a newcomer before QA: `docs/quickstart.md` (now written, only verified steps). Still missing: nothing required. Notes: no `bin` entry (commands are `node cli/todo.mjs ...`), `./tasks.json` default means a list appears wherever you stand.
- NOT RUN: Node 20-25, macOS, Linux.

## Proof 9 - acceptance criteria

| AC | Level observed | Evidence |
|---|---|---|
| AC-01 | LOCAL TESTED (+ run by hand) | cli tests in the 87; hand: `Added #1: Buy milk`, file checked; 201 chars exit 1, file unchanged; mutation 200->300 fails |
| AC-02 | LOCAL TESTED (+ by hand) | `[ ] #1 ...` / `[x] #1 ...`, `No tasks.`, `list --json` array, all observed |
| AC-03 | LOCAL TESTED (+ by hand) | `Done #1`, file `done:true`; `done 99` exit 2 |
| AC-04 | LOCAL TESTED (+ by hand) | `no` -> `Cancelled`, exit 0, `cmp` identical; `--yes` removes; mutation fails 2 tests |
| AC-05 | LOCAL TESTED, both parts | 13 of 13 fixtures match `expected.json` for the CLI and for the web, by the builders' tests and by QA's own script |
| AC-06 | LOCAL TESTED (+ by hand) | CLI exit 3 `Cannot read <path>: not valid JSON` for all four commands, file identical; web 500, no leak |
| AC-07 | LOCAL TESTED + seen in a real browser | page text, counts, `Done`, empty state, escaping; mutation fails 2 tests |
| AC-08 | INTEGRATION TESTED + END-TO-END by hand | joined test passes, fails on wrong file (1 of 2 fail); hand journey with two real processes |
| AC-09 | INTEGRATION TESTED | joined test passes over the 5 valid fixtures; fails under the `completed` mutation. Checks count and status only (F-09) |
| AC-10 | LOCAL TESTED | 2 faked failures + 1 real in the tests; QA real failures: read-only file (EPERM) and missing folder (ENOENT), old file identical, no temp left; mutation fails 2 tests. A killed process or power loss mid-write: NOT RUN |
| AC-11 | END-TO-END TESTED (one browser, emulated phone width) | Proof 5. Physical phone: NOT RUN |
| AC-12 | LOCAL TESTED (run by QA) | 6 files found; zero-test cases exit 1 three ways; a failing test exits 1 |

## Proof 10 - open item R-1: REPRODUCED
Hand-made files, one task each, title = N emoji (U+1F600), `nextId` 2:

| N emoji | CLI (`list`, `done`) | Web `/api/tasks` |
|---|---|---|
| 100 | exit 0 | 200 |
| 101 | **exit 3** `task #1: title is longer than 200 characters` | **200** |
| 150 | **exit 3** | **200** |
| 200 | **exit 3** | **200** |
| 201 | exit 3 | 500 |

Cause: `cli/store.mjs:34` counts `title.trim().length` (UTF-16 units); `web/server.mjs:46` counts `[...t.title.trim()].length` (code points). Effect: for 101-200 emoji the web page shows the list while every CLI command refuses the whole file; the file is left unchanged. `add` with 101 emoji is refused (exit 1), so the CLI can never write such a file: files written by the CLI are always accepted by the web, and the primary journey is not affected. The seam check's description is accurate. It is a contract ambiguity (SPEC 6 "characters"), owner Lead plus the owner's approval; one fixture should pin the decision.

---

## Findings

Severity: M = should be fixed or decided before calling it finished; L = minor. None blocks the acceptance criteria as written.

| # | Sev | Class | Owner | Finding | Evidence |
|---|---|---|---|---|---|
| F-01 | M | contract ambiguity | Lead + owner | R-1 reproduced: the two readers disagree on titles of 101-200 astral characters (web 200, CLI exit 3 on every command) | Proof 10; `cli/store.mjs:34`, `web/server.mjs:46` |
| F-02 | M | implementation bug (tests) | Builder B | The CLI tests never remove their temp folders: each run leaves 81 folders (`tasklet-cli-*`, `tasklet-store-*`) in the system temp folder; 1,132 had piled up by the end of this session. Web and joined tests leave 0 | count before 1051, after one cli run 1132; `cli/tests/cli.test.mjs:16`, `cli/tests/store.test.mjs:17`, no `rmSync` in either file |
| F-03 | M | environment limit | machine owner | The system drive holding the temp folder had 4-5 MB free during QA. All runs passed, but tests write there and F-02 adds to it; a full disk will produce false failures | tool warnings during this session |
| F-04 | M | missing requirement | Lead (contract), then Builder B | Titles go to the terminal raw. A title with a line break forges a `list` line (`[x] #99 Forged line`); ESC/BEL sequences are printed as-is. SPEC 9 calls titles untrusted but only specifies HTML escaping | `qa-drills-own.txt` O2; `cli/todo.mjs:91` (accepts), `:99`, `:112` (prints) |
| F-05 | L | implementation bug | Builder B | A refusal while preparing a write is reported as `Cannot read`: at `nextId` 9007199254740992 `add` exits 3 with `Cannot read <path>: nextId ... is not greater than task id ...`. The file is fine and unchanged; the list just cannot grow | O3; `cli/store.mjs:107-110` (validate throws kind `read`), `cli/todo.mjs:170` |
| F-06 | L | contract ambiguity | Lead | After `--`, `--file <path>` becomes part of the title and the task is silently written to `./tasks.json` instead. Consistent with Builder B's stated `--` rule, but SPEC 7 does not define it and the result is a write to an unintended file | O7 (created a stray `tasks.json`, removed) |
| F-07 | L | environment limit | Builder B | On Windows `--file NUL`: `list` says `No tasks.`, and `add` reports success and leaves a real file named `NUL` in the folder, which ordinary tools cannot delete | O6 (removed with a `\\?\` path) |
| F-08 | L | missing requirement | Lead | No file locking: read-modify-write without a lock (`cli/todo.mjs:94-98`). Not reproduced in 72 simultaneous adds, and SPEC 1 says one person, but the limit is not in `_shared/product-facts.md` | `qa-drills-concurrent.txt`; builder-b handoff "Known limits" |
| F-09 | L | implementation bug (tests) | Lead | AC-09 joined test checks status and task count only, not that the fields survive the rewrite. The joined tests use `createServer()` in-process rather than the `node web/server.mjs` process (covered elsewhere, so not a gap in total) | `tests/integration/joined.test.mjs:73-78`, `:21-25` |
| F-10 | L | implementation bug (docs) | Lead | State files are stale or over-labelled: `CONTEXT.md` and `product-facts.md` say browser NOT RUN and QA in progress; the "13 fixtures" row says INTEGRATION TESTED but cites per-part tests; limits from F-04, F-06, F-08 are absent | `CONTEXT.md:7-8`, `_shared/product-facts.md:14,19` |
| F-11 | L | missing requirement | Lead | Routing: the release route pointed at a file that did not exist until QA wrote it; run commands are not reachable from the two root files | walk test |
| F-12 | L | contract ambiguity | Lead + owner | SPEC 7 gaps confirmed as built: `remove` success text `Removed #<id>`; failed write exits 3 with `Cannot write`; `HEAD /` answers 405; the 500 on `/` is an HTML page; the `remove` question goes to stderr. All reasonable, none in the contract | drills; both builder handoffs |
| F-13 | L | environment limit | - | Git Bash rewrites arguments containing `</...` (a title `...</script>` arrived as `...<C:/Program Files/Git/script>`). Not a product defect; noted in the quickstart | Proof 5 input |

Totals by class: implementation bug 4 (F-02, F-05, F-09, F-10) · contract ambiguity 3 (F-01, F-06, F-12) · environment limit 3 (F-03, F-07, F-13) · missing requirement 3 (F-04, F-08, F-11). Total 13: 4 M, 9 L, 0 release-blocking.

## Claims in the handoffs, checked
| Claim | Verdict |
|---|---|
| `npm test` 182/182 (Lead, STATE, CONTEXT) | confirmed: 2 full runs on the project, 1 on the restored throwaway copy |
| CLI 87/87, web 93/93 | confirmed |
| Wrong-file variant fails; zero tests exits 1 | confirmed |
| Web: removing escaping fails 2 tests | confirmed (QA mutation: 2) |
| Web: reading `completed` fails 28 of 93 | NOT RUN as stated (QA ran the mirror case, CLI writing `completed`: 17 of 182 fail) |
| `node --test <folder>` fails on Node 26 | NOT RUN |
| Builder C's two leftover temp folders `tasklet-web-*` | confirmed present (2), left in place |
| R-1 as described | confirmed |
| "No lost-update protection" (Builder B) | consistent with the code; not reproduced |

## Checks QA could not or did not run
- Physical phone or any other device; Firefox, Safari; a screen reader. NOT RUN.
- Node 20-25; macOS; Linux. NOT RUN.
- A process killed or power lost in the middle of a write (AC-10 crash case). NOT RUN.
- A real permission-denied read (ACL) on the data file. NOT RUN (read-only attribute and folder-at-path were run).
- Deleting the leftover `tasklet-*` temp folders: not done, outside QA's folders; safe to delete by hand.
- Updating `CONTEXT.md` / `_shared/product-facts.md` with these results: not QA's files; for the Lead.

## For the Lead
- Repairs go to: Builder B (F-02, F-05, F-07), Lead (F-09, F-10, F-11), Lead + owner decisions (F-01, F-04, F-06, F-08, F-12).
- All servers started by QA were stopped (0 listeners on 4391-4393). QA's temp data folders were removed. The project root holds the same entries as at the start.
