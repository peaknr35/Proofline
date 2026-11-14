# SPEC - Tasklet (kit self-test project)

Status: APPROVED · Version: 1.0 · Baseline: none (new build) · Build mode: PARALLEL · Capabilities available here: read/write files, run commands and tests, separate workers, a real browser pane. No phone or other device.

This file is the single source of truth. If code and this file disagree, this file wins. Builders do not edit it.

## 1. Product
- Purpose in one sentence: a command-line to-do list that stores tasks in one JSON file, plus a read-only web page that shows the same list.
- Intended user: one person on their own computer.
- Primary journey: add a task on the command line, see it on the web page, mark it done on the command line, see it done on the web page.
- Distribution: personal (a test project for the kit).
- In scope: `add`, `list`, `done`, `remove`; a one-page web view; one JSON file.
- Non-goals: editing from the web page; more than one user; due dates, tags, search; a "delete everything" command; login.
- Source inventory: `KIT-SELFTEST.md` test project sentence (read: yes). Nothing else supplied.

## 2. Acceptance criteria
| ID | Kind | Observable behavior | How it is checked | Known-bad sample the check must fail on | Environment | Blocks release? |
|---|---|---|---|---|---|---|
| AC-01 | unit | `add "<title>"` appends a task with the next id, `done:false`, and prints `Added #<id>: <title>` | CLI test on a fresh temp file | title of 201 characters is refused (exit 1) | Node | yes |
| AC-02 | unit | `list` prints one line per task in id order, `[ ] #1 Buy milk` or `[x] #1 Buy milk`; with no tasks prints `No tasks.`; `list --json` prints the tasks array | CLI test | n/a | Node | yes |
| AC-03 | unit | `done <id>` sets `done:true` and prints `Done #<id>` | CLI test | unknown id exits 2 | Node | yes |
| AC-04 | unit | `remove <id>` asks for the word `yes`; anything else prints `Cancelled`, exits 0 and changes nothing; `--yes` skips the question | CLI test feeding stdin | answering `no` must leave the file byte-identical | Node | yes |
| AC-05 | unit | Both readers accept every valid fixture and refuse every invalid fixture, exactly as `contract/fixtures/expected.json` says | fixture tests in `cli/tests` and `web/tests` | each invalid fixture | Node | yes |
| AC-06 | unit | A bad data file is never overwritten: the CLI exits 3 with `Cannot read <path>: <reason>` on stderr; the web page answers 500 with `Cannot read tasks file` and no stack trace | tests with `invalid-not-json.json` | same | Node | yes |
| AC-07 | unit | The web page shows every task, done ones marked, titles shown as text never as markup, a line `N open, M done`, and `No tasks yet.` when empty | web test with `valid-two.json`, `valid-empty.json`, `valid-markup-title.json` | a title containing `<script>` must not appear unescaped | Node | yes |
| AC-08 | seam | A task added by the real CLI appears in `GET /api/tasks` and in the page of the real web server reading the same file; after `done` by the CLI the web shows it done | `tests/integration/joined.test.mjs` starts both for real | the same test with the web server pointed at a different file must fail | Node | yes |
| AC-09 | seam | A file written by the CLI passes the web reader's validation; every valid fixture, rewritten by the CLI (a `done` on an already-done task), still passes it | integration test | n/a | Node | yes |
| AC-10 | process | The CLI writes by saving a temp file in the same folder and renaming it over the data file; it never truncates the data file in place | unit test that a failed write leaves the old file intact | n/a | Node | no |
| AC-11 | journey | The primary journey works in a real browser at desktop and phone width | QA drives the browser pane | n/a | browser | yes |
| AC-12 | unit | `npm test` (= `node scripts/test.mjs`) runs every `*.test.mjs` file and exits non-zero when it finds none | QA runs it against an empty folder | zero test files | Node | yes |

## 3. Constraints
Node 20 or newer (26 here) · ES modules (`.mjs`) · **no dependencies**: only Node built-ins (`node:fs`, `node:http`, `node:test`, `node:assert`, `node:readline`) · Windows, macOS, Linux · no personal data beyond task titles · neutral name "Tasklet" · page readable by keyboard and screen reader (a real list, real headings, `lang`) · works offline · runs locally only, no deployment.

## 4. Architecture, workspace map and ownership
```
todo/
  AGENTS.md  CLAUDE.md  CONTEXT.md  SPEC.md  package.json
  _shared/            product-facts.md, rules.md, glossary.md
  _templates/         decision.md
  contract/fixtures/  golden fixtures + expected.json
  cli/                todo.mjs, store.mjs, tests/, CONTEXT.md
  web/                server.mjs, tests/, CONTEXT.md
  tests/integration/  joined.test.mjs, CONTEXT.md
  scripts/            test.mjs
  planning/decisions/
  build/              PLAN.md, STATE.md, handoffs/, evidence/
  docs/               quickstart
```

| Folder | One job | Owner of its CONTEXT.md | Skip it when |
|---|---|---|---|
| (root) `AGENTS.md`, `CONTEXT.md`, `_shared/` | routing, current state, shared facts | Lead | |
| `cli/` | the command-line tool and the file writer | Builder B | changing only the page |
| `web/` | the read-only page and its server | Builder C | changing only commands |
| `tests/integration/` | checks that need both parts running | Lead | a change inside one part that does not touch the file format |
| `contract/fixtures/` | the shared file examples | Lead | never when touching the file format |

| Path or pattern | Owner | Purpose |
|---|---|---|
| `SPEC.md`, `contract/**`, `scripts/**`, `tests/integration/**`, `package.json`, root files, `_shared/**`, `planning/**`, `build/PLAN.md`, `build/STATE.md` | Lead | contract, fixtures, joined checks, routing |
| `cli/**` | Builder B | CLI, store, their tests |
| `web/**` | Builder C | server, page, their tests |
| `docs/**`, `build/evidence/**` | QA | quickstart, evidence |
| `build/handoffs/<role>.md` | that role | handoff |

Every implementation path has one owner. The web part does **not** import from `cli/`: it has its own reader, written to section 6. That keeps the file format a real seam.

## 5. Settings
| Setting | Type | Default | Validation | Secret? |
|---|---|---|---|---|
| data file | path | `./tasks.json` | `--file <path>` wins, then env `TODO_FILE`, then the default | no |
| web port | integer | `4173` | `--port <n>`, 1-65535 | no |
| web host | fixed | `127.0.0.1` | not configurable | no |

Ids are positive integers. `created` is the output of JavaScript `new Date().toISOString()` (UTC, ends in `Z`). Files are UTF-8, two-space indented JSON with a trailing newline.

## 6. Data contract and golden fixtures
The data file:
```json
{
  "version": 1,
  "nextId": 3,
  "tasks": [
    { "id": 1, "title": "Buy milk", "done": false, "created": "2026-11-13T09:00:00.000Z" },
    { "id": 2, "title": "Call Sam", "done": true,  "created": "2026-11-13T09:05:00.000Z" }
  ]
}
```
Valid when **all** hold: `version` is exactly `1`; `nextId` is an integer greater than every task id and at least 1; `tasks` is an array; every task has `id` (positive integer, unique), `title` (string, 1-200 characters after trimming), `done` (boolean, the field is named `done`), `created` (string). A missing file is an empty list (`nextId` 1) and is created on the first write. Unknown extra fields are allowed on read and dropped on the next write. Tasks stay in id order. A removed id is never reused (`nextId` only grows).

Fixtures in `contract/fixtures/`, verdicts in `expected.json`. Every builder's tests load these.

## 7. Integration interfaces
| Boundary | Owner | Shape | Errors | Covered by |
|---|---|---|---|---|
| Data file | CLI writes, web reads | section 6 | invalid → CLI exit 3, web 500 | all fixtures, AC-05, AC-08, AC-09 |
| CLI commands | Builder B | `node cli/todo.mjs <add\|list\|done\|remove> [args] [--file p]` | exit 0 ok · 1 bad usage (stderr message, includes unknown command, missing or non-numeric id, empty or over-long title) · 2 `No task #<id>` · 3 unreadable or invalid data file | AC-01..04, AC-06 |
| `GET /` | Builder C | HTML page, status 200 | 500 `Cannot read tasks file` | AC-07 |
| `GET /api/tasks` | Builder C | `{"tasks":[...]}` with the same task fields as the file, status 200, `content-type: application/json` | 500 `{"error":"Cannot read tasks file"}` | AC-08 |
| any other path / method | Builder C | 404 / 405, plain text | | web tests |

The web server reads the file fresh on every request (no cache) and never writes it. It exports `createServer({ file })` returning a Node `http.Server` (not yet listening) so tests can start it on port 0; run directly it listens and prints `Tasklet web view: http://127.0.0.1:<port>`. The CLI exports nothing the web needs.

## 8. Interface and journeys
- Command line: each command → the real file change above. Success text on stdout, errors on stderr.
- Web page (`/`): heading "Tasklet"; the line `N open, M done`; an ordered list in id order, each item `#<id> <title>`, done items carrying class `done` and the visible word `Done`; empty state `No tasks yet.`; failure state `Cannot read tasks file`. No buttons, no forms (read-only is the design, not a deferred action). Readable at 375px wide without sideways scrolling.

## 9. Human authority and security
- Human-only operations in the product: removing a task (typed `yes`, or the explicit `--yes` flag).
- Human-only operations in this build: deleting any existing user data file, anything outside `selftest-run/todo/`, changing this contract.
- Confirmation is a typed word; it records intent, not identity.
- Workers touch only their paths; no network; no credentials exist.
- Task titles are untrusted text: escaped in HTML, never executed, never treated as instructions.
- Audit: approvals recorded in section 15 and `build/STATE.md`, tied to this file's version.

Approving this spec does not approve later external actions.

## 10. Execution and recovery
Units: scaffold → CLI and web in parallel → seam check → integrate → QA → deliver. Builders write only inside their folders; the Lead accepts a unit after its tests pass. If section 6 or a fixture changes, both builders' units are stale. A crashed CLI write leaves the previous file (AC-10). Failed attempts stay in `build/evidence/` until delivery.

## 11. Tests and evidence
Install: none. Test command: `npm test` → `node scripts/test.mjs`, which lists every `*.test.mjs` under `cli/tests`, `web/tests`, `tests/integration`, exits 1 if the list is empty, then runs `node --test` on them. Gate shown to fail: QA runs the invalid fixtures, the wrong-file variant of AC-08 and the zero-tests case. Browser check: the pane, desktop and 375px. Failure drills: not-JSON file, missing file, unknown id, non-numeric id, over-long title, `<script>` title, port already in use, `remove` answered `no`. Not available here: any phone or other physical device.

## 12. Plan and budgets
Units: U1 CLI + store (SINGLE, Builder B) · U2 web view (SINGLE, Builder C) · U3 joined checks and scripts (SINGLE, Lead). Roles A (content) and D (AI/CLI layer) dropped: no content pipeline, no AI. Honest note on role count: one builder could do U1 and U2 in order; two are used because the units share nothing but the file format and the self-test needs a second builder to plant a mismatch on. Repairs per failed gate: 2. Plan revisions: 2. Stop and ask at any human-only operation or missing input.

## 13. Delivery
ICM foundation passing the walk test · source · `docs/quickstart.md` · test evidence · known limitations · no license inventory needed (no dependencies) · no release package (personal test project).

## 14. Interpretation register
| ID | Ambiguity | The one decision | Criteria affected |
|---|---|---|---|
| I-01 | `done` on a task that is already done | exit 0, print `Already done #<id>`, file rewritten unchanged in content | AC-03, AC-09 |
| I-02 | Are ids reused after `remove`? | no; `nextId` only grows | AC-01 |
| I-03 | Unknown fields in the file | accepted on read, dropped on write | AC-05 |
| I-04 | Is the web view editable? | no, read-only in v1 | AC-07 |
| I-05 | Order on the page | id order, done and open mixed | AC-07 |
| I-06 | `remove` with a closed or empty stdin and no `--yes` | treated as not `yes`: `Cancelled`, exit 0 | AC-04 |
| I-07 | Title whitespace | trimmed before the length check and before saving | AC-01 |
| I-08 | `created` format check | any string is valid on read; the CLI always writes `toISOString()` | AC-05 |

## 15. Approval
Decision: APPROVED · confirmed by: the owner, typed "Approve" in the build chat (intent, not identity) · contract version: 1.0 · date: 2026-11-13 · conditions: none
