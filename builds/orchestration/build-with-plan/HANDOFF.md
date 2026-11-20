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

