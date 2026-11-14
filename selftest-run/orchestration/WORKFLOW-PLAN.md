# WORKFLOW-PLAN - Tasklet (version 1)

Method: `workflow-orchestration` (CANDIDATE). Planner read only `SKILL.md` and `TASK.md`. The fixtures folder was not available to the planner and was not read.

## 1. Organize or not (step 0)

**Do not organize. One worker, in order.**

| Condition | True? | Reason |
|---|---|---|
| 1. A lot of separable work | **No** | Two small files (`cli/todo.mjs`, `web/server.mjs`), each about 100-200 lines, plus tests. One worker finishes both well inside the budget. Splitting would save a few minutes at most and would cost handoffs, waiting and a joining step out of the same 30 minutes. |
| 2. Units depend on each other or share a rule | Yes | Both parts read the same data file and must apply the same validity rule (TASK section 6), and the web part may not import from `cli/`, so the rule is written twice. |
| 3. Success judged on the joined result | Yes | The primary journey is add on the command line, see it on the page. A hidden checker scores the finished build. |

Condition 1 is false, so the skill's answer is one worker. Conditions 2 and 3 being true is a second reason to keep it in one head: the only real risk in this task is the two readers disagreeing, and one worker writing both readers from the same fixtures removes the handoff where that disagreement would be born.

Asked for 4 workers? Three would have nothing to do that is not already one worker's job; the other 3 are not used. If the worker fails, section 8 says the one decision to change.

The rest of this file is kept short, but the definition of done and the joined checks are still written, because the single worker's handoff has to carry them.

## 2. Definition of done for the whole

One deliverable: a build folder containing `cli/todo.mjs`, `web/server.mjs`, tests under `cli/tests`, `web/tests`, `tests/`, the untouched `contract/fixtures/`, no `package.json` dependencies, in which `node --test` run from the build folder root passes with zero failures on Node 26, and every row of TASK section 2, 7, 8 and 14 holds exactly as worded (output strings, exit codes, status codes).

### Joined-only checks (file `tests/joined.test.mjs`; each drives the real CLI as a child process and the real `createServer({ file })` on port 0)

| ID | Check | Why parts alone cannot pass it |
|---|---|---|
| J1 Journey | On a fresh temp path with no file: start one server instance. `add "Buy milk"` by CLI, then `GET /` contains `#1 Buy milk` and `1 open, 0 done`. `done 1` by CLI, then the same server's `GET /` shows that item with class `done`, the word `Done`, and `0 open, 1 done`. `GET /api/tasks` `.tasks` deep-equals the parsed output of `list --json`. | Needs the file the CLI really writes to be the file the page really reads, in the same field names, with no cache. |
| J2 Readers agree | For every fixture named in `contract/fixtures/expected.json`: CLI `list --file <fixture>` exit code (0 for valid, 3 for invalid) and web `GET /` status (200 for valid, 500 for invalid) both match the verdict, so they match each other. | Two validators written separately can each look right and still differ on one fixture. |
| J3 Written file is readable, ids never reused | Copy a valid fixture that has extra fields (or add one by hand) to temp; CLI `add "A"`, `add "B"`, `remove <id of A> --yes`, `add "C"`. The web then answers 200, lists B and C, C's id is larger than A's, and the file on disk has no unknown fields and passes the web reader. | Checks the writer's output against the other part's reader. |

### Process checks

| ID | Check |
|---|---|
| P1 (AC-10) | A write that fails part-way leaves the old data file byte-identical, and the write path is temp file in the same folder then rename. Test by making the rename step fail (injectable in the write function, or an equivalent real failure) and comparing bytes. |
| P2 (AC-06) | With `invalid-not-json.json` copied to temp: after `add`, `list`, `done 1`, `remove 1 --yes` (each exits 3, stderr starts `Cannot read <path>: `) and after `GET /` and `GET /api/tasks` (each 500, no stack trace), the file is byte-identical to the copy's source. |
| P3 (AC-04) | `remove 1` answered `no` leaves the file byte-identical; closed stdin gives `Cancelled`, exit 0. |

### How the checker is tested

`NOT RUN` by the planner (no build exists yet). The worker must run and report all three:

| Sample | How | Expected |
|---|---|---|
| Known-good | `node --test` on the finished build | all pass |
| Empty | Run `node --test tests/joined.test.mjs` with `cli/todo.mjs` and `web/server.mjs` temporarily renamed away | fails, zero joined checks pass |
| Correct parts, never joined | Run the joined test with env `JOINED_SPLIT=1`: the test then gives the server a different temp file from the one the CLI writes (each part still correct on its own file) | J1 and J3 fail |

## 3. Units, arrows, shape

Written before deciding who does anything.

| Unit | One sentence |
|---|---|
| U0 Shared rule | Read `contract/fixtures/` and `expected.json` and state the validity rule of TASK section 6 as one function specification. |
| U1 Command line | Build `cli/todo.mjs` with `add`, `list`, `done`, `remove`, the reader, and the atomic writer, with its tests. |
| U2 Web view | Build `web/server.mjs` with `createServer({ file })`, the page, the API, its own copy of the reader, with its tests. |
| U3 Join | Write and run the joined and process checks, repair until they pass. |

Arrows: U0 -> U1, U0 -> U2, U1 + U2 -> U3. Shape: a foundation, two side-by-side units, a join. Longest chain: U0 -> U1 -> U3 (three units). Shared foundation: the data file format and validity rule (U0).

This split is the true structure of the task, and it is the one to fall back on. It is not staffed as separate workers because of section 1: all four units go to one worker, in the order U0, U1, U2, U3.

## 4. Operation, worker, handoff

| Unit | Operation | Reason | Worker | Reason |
|---|---|---|---|---|
| U0-U3 as one job | SINGLE | Default. The work is ordinary Node code the model is clearly capable of; errors are cheap to find because the fixtures and the joined test catch them; a reviewer or second attempt would spend budget the repair reserve needs. | Worker 1 (one fresh instance, same model as the planner) | No trial results exist, so per the skill: one capable worker for everything, no routing by reputation. |

### Handoff to Worker 1 (paste everything in this box as its only instructions)

> **You are the only builder of Tasklet.** Work only inside the build folder you were given. It contains `TASK.md` (the contract; do not change it) and `contract/fixtures/` (golden fixtures and `expected.json`; do not change them).
>
> **Receives:** `TASK.md`, `contract/fixtures/`. Nothing else.
>
> **Owes:** the whole product in TASK.md, working and tested, in about 18 minutes. A hidden checker will score the folder, so follow TASK.md's strings, exit codes, status codes and file layout exactly; where TASK.md is silent, pick the plainest reading and note it in your report.
>
> **Order of work (do not reorder):**
> 1. Read TASK.md fully. Open `contract/fixtures/expected.json` and every fixture. Learn the shape of `expected.json` from the file itself. Write the validity rule once in your head: `version` exactly `1`; `nextId` integer, at least 1, greater than every task id; `tasks` an array; each task has `id` positive integer and unique, `title` string 1-200 characters after trimming, `done` boolean (the field must be named `done`), `created` any string; unknown extra fields allowed on read. A missing file is an empty list with `nextId` 1. If a fixture's verdict disagrees with this rule, the fixture wins: adjust the rule and say so in the report.
> 2. Build `cli/todo.mjs` (ES module, Node built-ins only, no `package.json` dependencies).
>    - Usage: `node cli/todo.mjs <add|list|done|remove> [args] [--file p]`. Data file: `--file` wins, then env `TODO_FILE`, then `./tasks.json`.
>    - `add "<title>"`: trim; empty or over 200 characters is exit 1 with a stderr message; append with `id = nextId`, `done:false`, `created: new Date().toISOString()`; increase `nextId`; print `Added #<id>: <title>`.
>    - `list`: one line per task in id order, `[ ] #1 Buy milk` or `[x] #1 Buy milk`; no tasks prints `No tasks.`; `list --json` prints the tasks array as JSON.
>    - `done <id>`: sets `done:true`, prints `Done #<id>`; already done prints `Already done #<id>`, exit 0, file rewritten with the same content; unknown id is exit 2 with `No task #<id>` on stderr.
>    - `remove <id>`: unknown id exit 2. Without `--yes`, ask and read one line from stdin; only the word `yes` removes; anything else, or closed or empty stdin, prints `Cancelled`, exits 0 and does not touch the file. Never reuse an id.
>    - Exit 1 with a stderr message for: unknown command, no command, missing or non-numeric id, empty or over-long title. Exit 3 with `Cannot read <path>: <reason>` on stderr for an unreadable or invalid data file, on every command, and never write to such a file.
>    - Success text on stdout, errors on stderr.
>    - Writing: two-space indented JSON with a trailing newline, UTF-8, only the fields `version`, `nextId`, `tasks` and per task `id`, `title`, `done`, `created` (unknown fields dropped), tasks in id order. Write to a temp file in the same folder as the data file, then rename it over the data file. Never open the data file for writing in place. On failure remove the temp file and leave the old file intact. Make the rename step injectable (or otherwise testable) so a test can force it to fail.
>    - Run `main` only when the file is executed directly (compare `import.meta.url` with `pathToFileURL(process.argv[1]).href`, which also works on Windows), so tests may import helpers. Set `process.exitCode` or exit after output is flushed.
>    - Tests in `cli/tests/*.test.mjs` with `node:test`, running the CLI as a child process on fresh temp files: AC-01 to AC-04, AC-06, AC-10, I-01, I-02, I-06, I-07, the 201-character title, and a fixture test (AC-05) that loops over `expected.json` and checks every valid fixture is accepted (`list` exit 0) and every invalid one refused (exit 3). Copy fixtures to a temp folder before any command that could write.
> 3. Build `web/server.mjs`. It must not import anything from `cli/`; give it its own copy of the reader, written from the same rule.
>    - Export `createServer({ file })` returning a Node `http.Server` that is not yet listening. It reads the file fresh on every request, never caches, never writes.
>    - `GET /`: status 200, HTML with `<!doctype html>`, `<html lang="en">`, a viewport meta tag, `<title>Tasklet</title>`, an `<h1>Tasklet</h1>`, the line `N open, M done`, and an `<ol>` in id order with one `<li>` per task reading `#<id> <title>`; done items carry `class="done"` and the visible word `Done`. Empty list: show `No tasks yet.` (and still the line `0 open, 0 done`). Escape `&`, `<`, `>`, `"`, `'` in titles so they appear as text. No buttons, no forms, no scripts, no external resources. Simple inline CSS that wraps long words so nothing scrolls sideways at 375px.
>    - `GET /api/tasks`: status 200, `content-type: application/json`, body `{"tasks":[...]}` with exactly the fields `id`, `title`, `done`, `created` per task.
>    - Invalid or unreadable file: `GET /` answers 500 with a body containing `Cannot read tasks file` and no stack trace or path; `GET /api/tasks` answers 500 with `{"error":"Cannot read tasks file"}`. A missing file is an empty list, not an error.
>    - Any other path: 404 plain text. Any method other than GET on a known path: 405 plain text. (Ignore the query string when matching the path.)
>    - Run directly: `--port <n>` (integer 1-65535, default 4173; anything else is exit 1 with a stderr message), same data-file setting order as the CLI (`--file`, `TODO_FILE`, `./tasks.json`), listen on `127.0.0.1` only, print `Tasklet web view: http://127.0.0.1:<port>`.
>    - Tests in `web/tests/*.test.mjs`, server on port 0: AC-07 with `valid-two.json`, `valid-empty.json`, `valid-markup-title.json` (the raw `<script>` must not appear in the body), AC-06 with `invalid-not-json.json`, the fixture loop for AC-05 (valid 200, invalid 500), the API, 404, 405, and that a change to the file between two requests shows up in the second.
> 4. Write `tests/joined.test.mjs` with these checks, each using the real CLI as a child process and the real `createServer` on port 0:
>    - **J1** fresh temp path, one server instance: CLI `add "Buy milk"`, then `GET /` contains `#1 Buy milk` and `1 open, 0 done`; CLI `done 1`, then the same server's `GET /` shows the item with class `done`, the word `Done`, and `0 open, 1 done`; `GET /api/tasks` `.tasks` deep-equals the parsed output of `list --json`.
>    - **J2** for every fixture in `expected.json`: CLI `list` exit (0 valid, 3 invalid) and web `GET /` status (200 valid, 500 invalid) both match the verdict.
>    - **J3** start from a temp copy of a valid file that has an unknown extra field: `add "A"`, `add "B"`, `remove <A's id> --yes`, `add "C"`; the web answers 200 and lists B and C, C's id is greater than A's, and the file on disk has no unknown fields.
>    - **P2** temp copy of `invalid-not-json.json`: after `add x`, `list`, `done 1`, `remove 1 --yes` (each exit 3) and `GET /`, `GET /api/tasks` (each 500), the file is byte-identical to the original.
>    - When env `JOINED_SPLIT=1` is set, the test hands the server a different temp file from the CLI's. This exists only to prove the test fails on unjoined parts.
> 5. Run `node --test` from the build folder root. Repair until zero failures. Then prove the checker: (a) run `node --test tests/joined.test.mjs` with `JOINED_SPLIT=1` and confirm J1 and J3 fail; (b) temporarily rename `cli/todo.mjs` and `web/server.mjs` away, confirm the joined test fails, and rename them back; (c) run the full suite once more and confirm it passes.
> 6. Leave the folder clean: no stray `tasks.json`, no temp files, no `node_modules`, fixtures unchanged.
>
> **Delivers:** `cli/todo.mjs`, `web/server.mjs`, `cli/tests/`, `web/tests/`, `tests/joined.test.mjs` in the build folder; and a short report: the final `node --test` summary line, the results of 5a, 5b, 5c, minutes used, any reading of TASK.md you had to choose, anything not finished.
>
> **To whom:** the person running this plan, who does the final acceptance.
>
> **Done when:** `node --test` at the root shows zero failures, 5a and 5b fail as expected, and the report is written. If 18 minutes pass first, stop and report what passes and what does not.
>
> **Must agree with:** TASK.md sections 2, 5, 6, 7, 8, 14 and `contract/fixtures/expected.json`. Where this handoff and TASK.md differ, TASK.md wins.

## 5. Joining

- Kind of delegation: neither "parts side by side" nor "inputs for a central builder". It is one builder doing the whole.
- Joining step: step 4-5 of the handoff. **Owner: Worker 1.** There is no cross-worker join.
- Checks sit: the fixture loop after each part is built (before the next part starts), the joined test after both, the three checker samples last.
- Final acceptance, owner the person running the plan (about 2 minutes): from the build root run `node --test`; then by hand `node cli/todo.mjs add "Buy milk" --file <temp>` and start `node web/server.mjs --file <temp> --port 4173`, open or fetch `http://127.0.0.1:4173/`, confirm the task shows. Confirm `web/server.mjs` contains no import from `cli/`, and there is no dependency list.

## 6. Budget (30 minutes wall-clock, one pool)

| Item | Minutes |
|---|---|
| Planning and writing this handoff (organizing) | 5 (about 17%) |
| Worker 1: build, tests, join, checker proof | 18 |
| Final acceptance by the runner | 2 |
| Repair reserve | 5 |

Organizing after planning is close to zero: one paste, no waiting on parallel workers, no cross-worker join.

## 7. Delegation log

| # | Unit | Operation | Worker | Given | Start | Minutes | Tokens | Result |
|---|---|---|---|---|---|---|---|---|
| 0 | Plan | - | planner | SKILL.md, TASK.md | | (fill in) | (fill in) | this file |
| 1 | U0-U3 | SINGLE | Worker 1 | handoff box in section 4, TASK.md, contract/fixtures/ | | | | |
| 2 | Repair (only if needed) | SINGLE | Worker 1 continued, or a fresh worker given the failing test output plus the same handoff | | | | | |

## 8. Not run, not enforced, and what to change on failure

`NOT RUN`:
- Nothing in this plan has been executed. No product code exists.
- The checker has not been tested on the good, empty and unjoined samples; the worker does that in step 5 and reports it.
- The planner has not seen `contract/fixtures/` or `expected.json`; the handoff tells the worker to learn the format from the files and that fixtures win over the planner's wording of the rule.
- The hidden checker is unknown. The plan's checks are the planner's reading of TASK.md, not a copy of it.
- No comparison against a run with no plan (skill self-test check 9) has been made.

Instructions that nothing enforces:
- The 30-minute budget and the 18-minute worker limit.
- "Work only inside the build folder", "do not change TASK.md or fixtures", "web does not import from cli/", "no dependencies". The acceptance step checks the last two by reading; nothing prevents them.
- The delegation log is filled by hand.

If it fails (change one decision, hold the others):
- Tests fail at the end with budget left: keep the split, the operation and the worker; send the failing output back to the same worker (log row 2).
- The worker runs out of time with one part unbuilt: change **only the staffing of U2**, giving `web/server.mjs` and `web/tests` to a second fresh worker with handoff step 1 and 3 plus the rule in step 1; hold the split (section 3) and SINGLE. The first worker keeps U1 and U3. Save that as version 2 of this file and keep this one.
- Report whatever is not finished when the 30 minutes are gone.
