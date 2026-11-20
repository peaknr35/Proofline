# src: the program

One job: implement the approved contract (`../SPEC.md` v0.6) and nothing else.
Owner of this file during the build: the builder (writes it in U1, keeps it accurate through U4). After delivery: whoever changes code.

## Commands
| Do | Command |
|---|---|
| Install | none (no dependencies); optional `npm link` for the `todo` name |
| Run | `node bin/todo.mjs <command>` (or `todo <command>` after `npm link`) |
| Test (observed after U1-U4, 2026-11-15: 250 tests, 250 pass, 0 fail, 0 skipped) | `npm test` |

## Inputs
- **Reference (every time):** `../SPEC.md` sections 6 (data and errors) and 7 (interfaces and the closed surface); `../_shared/rules.md`
- **Working (this task):** the module you change and its tests
- **Do NOT load:** `../build/` gate results and packets (history, not rules); `../contract/fixtures/stores/valid-1000*.json` in full (large)

## Modules (SPEC sections 4 and 7.3)
| File | Unit | Job |
|---|---|---|
| `errors.mjs` | U1 | `TodoError`, `makeError`, `webBody`: names, exit codes, exact messages (SPEC 6.5) |
| `text.mjs` | U1 | `normalizeTitle`, `parseId`, `parsePort`, `safeText`, `escapeHtml` |
| `store.mjs` | U1 | `resolveDataPath`, `loadStore`, `saveStore`, `emptyStore` (sync; default `fs` import). `loadStore` returns `tasks` sorted by id; `saveStore` sorts `tasks` in place before writing |
| `cli.mjs` + `../bin/todo.mjs` | U2 | `main(argv, io)`; commands; stdout/stderr; stream-error handling |
| `page.mjs` | U3 | `renderPage(store)`: pure, returns the HTML string |
| `serve.mjs` | U4 | `startServer({ file, port, render })`: Host check, routes, headers, 500s |

## Process
1. Layer rule: `bin -> (cli, errors)`; `cli -> (store, text, errors, serve)`; `serve -> (store, page, errors)`; `page -> text`; `store -> (text, errors)`; `text -> errors`; `errors` imports nothing. `page` and `text` never touch the file system; only `store` reads or writes the task file.
2. Every message and exit code comes from `errors.mjs`; no other module writes message text. `makeError` inserts params as given, so pass `file` as `safeText(path.resolve(file))` (store.mjs does this for its own errors; a caller raising E_ID_LIMIT must do the same).
3. Add or update a test next to the behavior in `../tests/<unit folder>/`.
4. Run `npm test`.

## Verify (before the human check)
- Against `../SPEC.md` 7.4: no command, flag, route, output or file beyond the list.
- Against `../contract/fixtures/`: `npm test` passes.
- Stale when: `SPEC.md` or any fixture changes.

## Outputs
`src/*.mjs`, `bin/todo.mjs`. Tests never write the owner's real task file.

## Human check
The owner reviews the diff. Pass = `npm test` green and the change traced to a SPEC section.

## Avoid
- Named imports from `node:fs` in `store.mjs` (breaks the AC-04 mocks).
- Echoing user input in error messages (unknown commands are never echoed).
- Parsing `req.url` as a URL for routing (SPEC 7.2 step 3 uses the raw target).
- Raw line/paragraph separators or bidi characters in source files: write them as backslash-u escapes (a raw U+2028 inside a regex literal is a syntax error; some editors expand escapes on write, so check with `grep -P '[^\x00-\x7e]'`).
