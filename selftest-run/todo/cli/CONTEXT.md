# cli: the command-line tool

One job: change the data file through four commands (`add`, `list`, `done`, `remove`).

## Commands
| Do | Command |
|---|---|
| Run | `node cli/todo.mjs <add "title" \| list [--json] \| done <id> \| remove <id> [--yes]> [--file path]` |
| Test this folder (87 tests, 87 pass, observed 2026-11-13, Node 26.4.0) | `node --test cli/tests/cli.test.mjs cli/tests/store.test.mjs` from the project root |
| Test this folder, glob form (same 87) | `node --test "cli/tests/*.test.mjs"` |
| Test everything | `npm test` from the project root (Lead's script; not run by Builder B) |

`node --test cli/tests/` (the bare folder form) does NOT work on Node 26: it tries to load the folder as a module and fails. List the files or use the glob.

## Inputs
- **Reference (every time):** `../SPEC.md` sections 5-7 and 14, `../_shared/glossary.md`, `../contract/fixtures/expected.json`
- **Working (this task):** only the files the change touches
- **Do NOT load:** `../web/` (the parts never import each other), `../build/`

## Process
1. Read the contract rule for the command you are changing.
2. Layer rule: `todo.mjs` parses arguments, asks the `remove` question, prints and sets the exit code; `store.mjs` reads, validates and writes the file and only throws `StoreError`. Printing never happens in the store; file access never happens in `todo.mjs`.
3. Add or update a test in `cli/tests/` next to the behavior. `cli.test.mjs` starts the real command as a process; `store.test.mjs` calls the store directly. Every test uses a fresh temp folder, never `./tasks.json`.
4. Run the tests. A file format change is a contract change: stop and ask.

## Verify (before the human check)
- Against `../contract/fixtures/expected.json`: the reader's verdict on every fixture (both test files loop over it; a new fixture is picked up automatically, and a fixture file without a verdict fails a test).
- Against `../SPEC.md` section 7: exit codes and messages.
- Stale when: SPEC sections 5-7 or 14, or any fixture, changes.

## Outputs
`cli/todo.mjs`, `cli/store.mjs`, `cli/tests/cli.test.mjs`, `cli/tests/store.test.mjs`. This folder never serves a page.

## Human check
The owner reviews the diff against the contract. Pass = tests green and the command behaves as SPEC section 7 says.

## Avoid
- Writing the data file in place (`saveStore` writes a temp file in the same folder, then renames; keep it the only writer).
- Overwriting a file that failed validation (every command loads before it writes; a load failure is exit 3).
- Reusing an id after a remove (`remove` never touches `nextId`).
- `process.exit()` in `todo.mjs` (set `process.exitCode`, so output is not cut off).
- Importing anything from `../web/`, or adding a dependency.
