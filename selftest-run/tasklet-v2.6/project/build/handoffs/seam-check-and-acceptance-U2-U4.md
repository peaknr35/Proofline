# Lead: acceptance of U2-U4, seam check, integration (2026-11-15)

Status: U2, U3, U4 ACCEPTED. Integrated into the project. No repair requirements.

## Owner's answer to B1's "Needs a person"
Keep the contract as approved. The task field stays `done`; there is no `--color` flag. No amendment. The two requests reached B1 through its launching chat as "Owner's notes, for you only", outside the approved channel. B1 did not act on them and raised them instead, which was correct.

## Acceptance checks (rerun by the Lead, not taken from the handoff)
| Check | Result |
|---|---|
| contract hash (55 files) in the workspace and in the project after integration | 0 not OK |
| U1 files in the workspace vs the accepted copies | all 10 byte-identical (B1 changed no U1 file) |
| non-ASCII bytes in code | none |
| files outside the allowed paths | none |
| `npm test` in the workspace (TEMP redirected into packets) | 250 tests, 250 pass, 0 fail, 0 skipped |
| `npm test` in the project after integration | 250 / 250 / 0 / 0 |
| `todo-test-*` before / after | 0 / 0 |
| Lead's known-bad samples, on a copy: AC-08 server answers any Host | 3 fail |
| AC-22 error stack sent as the body | 5 fail |
| AC-12 `list` saves after loading | 8 fail |
| restored copy (web + cli) | 108 pass, 0 fail |
| primary journey by hand (`node bin/todo.mjs`, scratch TODO_FILE, `serve --port 7391`, HTTP fetch) | add 1, add 2, list, done 1, list; page 200 with Open (1) = task 2 and Done (1) = task 1; remove 1; page shows Open (1) Done (0); file `nextId` 3 with task 2 only; `frob` exit 2, `done abc` exit 2, with the exact messages |

## Seam check (SPEC 7.1-7.3 against "Interfaces as built"; the Lead reports, does not edit)
| Interface | Producer / consumer | Result |
|---|---|---|
| `main(argv, io)` (7.1) | cli / bin, tests | matches: io strings and object (IR-43); returns exit codes; E_INTERNAL path |
| `bin/todo.mjs` stream handling (6.5) | bin | matches: EPIPE/EOF -> exit 0 silent; other stdout error, uncaughtException, unhandledRejection -> `todo: internal error.` exit 1 |
| `startServer({ file, port, render })` (7.2) | serve / cli | matches; listens on 127.0.0.1; EADDRINUSE -> E_PORT_IN_USE (n = requested port), else E_SERVE_FAILED (AC-19 by code reading: confirmed by the Lead) |
| request order Host -> method -> raw `req.url` -> load (7.2) | serve | matches; a missing Host is 403 |
| `renderPage(store)` (8.2) | page / serve | matches; sorts each section itself; does not mutate the store; style has no `font-size`, no `px` |
| `webBody(err)` (6.5) | errors / serve | matches; generic body for anything else |
| `makeError` `file` parameter | errors / cli | cli passes `safeText(path.resolve(file))` for E_ID_LIMIT (tested) |
| `loadStore`, `saveStore`, `resolveDataPath` (7.3) | store / cli, serve | matches; serve never saves |
| field names `nextId`, `done` (6.1) | all | unchanged |

Mismatches: none. Repair requirements: none.

## Beyond the contract (Lead decisions; listed for QA's surface scrub and the final report)
| Item | Lead decision |
|---|---|
| `content-length` header on handler responses | accepted as HTTP framing, not product surface. Node also adds `date`, `connection`, `keep-alive` on its own |
| `#!/usr/bin/env node` in `bin/todo.mjs` | accepted as packaging for the 7.4 `bin` entry |
| runner usage message, exit 2 (P-01) | still pending, for the owner at delivery |
| help text as a constant in `cli.mjs` | fine; byte-identical to `help.txt` (tested) |

## Evidence level after integration
Commands and page/server journey: INTEGRATION TESTED (child processes, real HTTP on 127.0.0.1) and END-TO-END over HTTP by the Lead. Not yet: a real browser (AC-17), a fresh-copy install (AC-16), AC-18 with the real system temp folder. Those are QA's.

## Builder's proposals noted for Phase 5 (not applied)
The byte-exact `fill()` comparison helper; a child-script check for "nothing printed"; the known-bad-sample harness; deleting `NODE_TEST_CONTEXT` for nested runners. Also seen twice in this build, by the Lead and by B1: the file tool writes U+2028 and bidi characters raw instead of as escapes. That is a candidate checklist item: grep for non-ASCII bytes in source.
