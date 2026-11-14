# TASK - Tasklet

Build this. How you organise the work is up to you. This file is the contract; do not change it.

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
| AC-10 | process | The CLI writes by saving a temp file in the same folder and renaming it over the data file; it never truncates the data file in place | unit test that a failed write leaves the old file intact | n/a | Node | no |

## 3. Constraints
Node 20 or newer (26 here) · ES modules (`.mjs`) · **no dependencies**: only Node built-ins (`node:fs`, `node:http`, `node:test`, `node:assert`, `node:readline`) · Windows, macOS, Linux · no personal data beyond task titles · neutral name "Tasklet" · page readable by keyboard and screen reader (a real list, real headings, `lang`) · works offline · runs locally only, no deployment.

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
| Data file | CLI writes, web reads | section 6 | invalid → CLI exit 3, web 500 | all fixtures, AC-05 |
| CLI commands | the CLI part | `node cli/todo.mjs <add\|list\|done\|remove> [args] [--file p]` | exit 0 ok · 1 bad usage (stderr message, includes unknown command, missing or non-numeric id, empty or over-long title) · 2 `No task #<id>` · 3 unreadable or invalid data file | AC-01..04, AC-06 |
| `GET /` | the web part | HTML page, status 200 | 500 `Cannot read tasks file` | AC-07 |
| `GET /api/tasks` | the web part | `{"tasks":[...]}` with the same task fields as the file, status 200, `content-type: application/json` | 500 `{"error":"Cannot read tasks file"}` | - |
| any other path / method | the web part | 404 / 405, plain text | | web tests |

The web server reads the file fresh on every request (no cache) and never writes it. It exports `createServer({ file })` returning a Node `http.Server` (not yet listening) so tests can start it on port 0; run directly it listens and prints `Tasklet web view: http://127.0.0.1:<port>`. The CLI exports nothing the web needs.

## 8. Interface and journeys
- Command line: each command → the real file change above. Success text on stdout, errors on stderr.
- Web page (`/`): heading "Tasklet"; the line `N open, M done`; an ordered list in id order, each item `#<id> <title>`, done items carrying class `done` and the visible word `Done`; empty state `No tasks yet.`; failure state `Cannot read tasks file`. No buttons, no forms (read-only is the design, not a deferred action). Readable at 375px wide without sideways scrolling.

## 14. Interpretation register
| ID | Ambiguity | The one decision | Criteria affected |
|---|---|---|---|
| I-01 | `done` on a task that is already done | exit 0, print `Already done #<id>`, file rewritten unchanged in content | AC-03 |
| I-02 | Are ids reused after `remove`? | no; `nextId` only grows | AC-01 |
| I-03 | Unknown fields in the file | accepted on read, dropped on write | AC-05 |
| I-04 | Is the web view editable? | no, read-only in v1 | AC-07 |
| I-05 | Order on the page | id order, done and open mixed | AC-07 |
| I-06 | `remove` with a closed or empty stdin and no `--yes` | treated as not `yes`: `Cancelled`, exit 0 | AC-04 |
| I-07 | Title whitespace | trimmed before the length check and before saving | AC-01 |
| I-08 | `created` format check | any string is valid on read; the CLI always writes `toISOString()` | AC-05 |


Layout required: `cli/todo.mjs`, `web/server.mjs`, tests anywhere under `cli/tests`, `web/tests`, `tests/`. The web part does not import from `cli/`. Golden fixtures are in `contract/fixtures/` with verdicts in `expected.json`.
