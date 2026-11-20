# tests: what is covered and how to run it

One job: prove `../src/` meets `../SPEC.md` using the golden fixtures.
Owner of this file during the build: the builder (U1 writes the runner; each unit adds its row's real count).

## Commands
| Do | Command |
|---|---|
| All tests (observed after U1-U4, 2026-11-15: 250 tests, 250 pass, 0 fail, 0 skipped) | `npm test` (runs `node scripts/run-tests.mjs`) |
| Prove discovery fails on zero tests | `node scripts/run-tests.mjs --dir <empty folder>` must exit 1 |

## Inputs
- **Reference (every time):** `../contract/CONTEXT.md`; `../SPEC.md` sections 2 (criteria) and 11 (test rules)
- **Working (this task):** the test file for the unit you change
- **Do NOT load:** `../build/`; the owner's real `~/todo.json` (never read it)

## Layout
| Folder | Unit | Criteria | Tests (observed count) |
|---|---|---|---|
| `foundation/` | U1 | AC-01, 02, 03, 04, 13, 14, 15 | 4 test files, 21 top-level tests, 127 counting fixture subtests (observed) |
| `cli/` | U2 | AC-05, 06, 10, 11, 12, 21, 24 | 1 file, 8 top-level tests, 79 counting the 71 cli-cases (observed; AC-24 ran, not skipped) |
| `page/` | U3 | AC-07, AC-20 (page part) | 1 file, 4 top-level tests, 15 counting web-case subtests (observed) |
| `web/` | U4 | AC-08, 09, 20 (web part), 22; AC-19 is QA code reading | 1 file, 6 top-level tests, 29 counting the 23 web cases (observed; default-port case skips itself if 7070 is busy) |

## Process
1. Each test makes a fresh `todo-test-*` folder under `os.tmpdir()`, sets `TODO_FILE` to a file inside it, and removes the folder in `finally`/`after`.
2. Load expectations from `../contract/fixtures/`; never copy fixture data into a test.
3. Servers listen on a free port and are closed in `after`.
4. Shared helpers are in `foundation/helpers.mjs` (`withTempDir`, `fixtureJson`, `tempFilesIn`, `FIXTURES`, `ROOT`); it is not a test file. The web-cases body checks are in `web/checks.mjs` (`bodyChecks`), used by `page/` and `web/`.
5. A test that spawns `node --test` itself deletes `NODE_TEST_CONTEXT` from the child's env, or the child reports to the parent runner instead of its own stdout.
6. A test that cannot run here (for example AC-24 when no EPIPE happens) reports itself as skipped with the reason, never as passed.

## Verify (before the human check)
- Each criterion's known-bad sample (SPEC section 2) makes its test fail, at least once by hand.
- The number of `todo-test-*` entries in the temp folder is the same before and after `npm test`.
- Stale when: `SPEC.md` or a fixture changes.

## Outputs
`tests/**/*.test.mjs` only.

## Human check
QA runs `npm test` in a fresh context. Pass = all pass, and the counts recorded here match the observed output.

## Avoid
- Tests that only check exit codes and not the file left behind.
- Editing fixtures to make a test pass.
