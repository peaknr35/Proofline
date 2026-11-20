# web: the read-only page

One job: show the data file as a web page and as JSON, without ever changing it.

## Commands
| Do | Command |
|---|---|
| Run | `node web/server.mjs [--file path] [--port 4173]` (prints `Tasklet web view: http://127.0.0.1:<port>`) |
| Test this folder (93 tests, 93 pass, 0 fail, observed 2026-11-13 on Node 26.4.0) | `node --test web/tests/reader.test.mjs web/tests/server.test.mjs web/tests/run.test.mjs` from the project root (the glob form `node --test "web/tests/*.test.mjs"` gave the same counts) |
| Test everything | `npm test` from the project root (NOT RUN by Builder C; it needs the other parts) |

`node --test web/tests/` (the bare folder form) does NOT work on Node 26: it tries to load the folder as a module and fails. List the files or use the glob.

## Inputs
- **Reference (every time):** `../SPEC.md` sections 5-8 and 14, `../_shared/glossary.md`, `../contract/fixtures/expected.json`
- **Working (this task):** only the files the change touches
- **Do NOT load:** `../cli/` (the parts never import each other), `../build/`

## What is here
| File | Holds |
|---|---|
| `server.mjs` | the reader (`readTasks`, `validateData`), the page (`renderPage`, `renderErrorPage`, `escapeHtml`), the routes (`createServer({ file })`), the settings (`parseArgs`) and the run-directly block |
| `tests/reader.test.mjs` | AC-05: every fixture against `expected.json` (reader and over HTTP), section 6 rules on temp files |
| `tests/server.test.mjs` | AC-06 web side, AC-07, routes, 404/405, no cache, never writes |
| `tests/run.test.mjs` | settings and running `server.mjs` as a real process |
| `tests/helpers.mjs` | shared test helpers; not a test file |

## Process
1. Read the contract rule for the route or page element you are changing.
2. Read the file fresh on every request; validate it with this folder's own reader; never write.
3. Add or update a test in `web/tests/` next to the behavior.
4. Run the test command above. A file format change is a contract change: stop and ask.

## The rule followed
`SPEC.md` wins. The finished flag on a task is the boolean field `done` (SPEC section 6, glossary, fixture `invalid-missing-done.json`). A task carrying `completed` and no `done` is invalid; a test pins this.

## Verify (before the human check)
- Against `../contract/fixtures/expected.json`: the reader's verdict on every fixture.
- Against `../SPEC.md` section 8: page text, states, escaping.
- Stale when: SPEC sections 5-8 or any fixture changes.

## Outputs
`web/server.mjs`, `web/tests/*.test.mjs`. This folder never writes the data file.

## Human check
The owner looks at the page at desktop and phone width. Pass = it matches SPEC section 8. (Not done by Builder C: no browser check was run in this unit.)

## Avoid
- Inserting a title as raw markup. Every title goes through `escapeHtml`.
- Caching the file between requests.
- Importing anything from `../cli/`.
- Reading any flag other than `done` (`completed`, `status`, `checked` do not exist).
- Putting error detail (parser message, path, stack) in a response; the only failure text is `Cannot read tasks file`.
- In tests that spawn the server: stop the child and wait for it before the temp dir is removed, or Windows refuses the removal (the child holds the folder).
- Writing into `contract/fixtures/`; tests copy a fixture to a fresh temp dir or read it in place.
