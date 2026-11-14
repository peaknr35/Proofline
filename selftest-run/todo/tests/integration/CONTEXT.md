# tests/integration: joined checks

One job: prove the real CLI and the real web server agree on one data file.

## Commands
| Do | Command |
|---|---|
| Test | `npm test` from the project root (runs these with the part tests) |
| Show the check failing | `JOINED_WRONG_FILE=1 node --test tests/integration/joined.test.mjs` (the server reads a different file; AC-08 must fail) |

## Inputs
- **Reference:** `../../SPEC.md` AC-08, AC-09, sections 6-7; `../../contract/fixtures/`
- **Do NOT load:** the internals of `cli/` or `web/`; these tests use only the command line and HTTP.

## Process
1. Start the real parts: spawn `node cli/todo.mjs`, import `createServer` from `web/server.mjs`.
2. Use a fresh temp file per test. Never touch a user's data file.

## Verify
- Stale when: SPEC sections 6-7 change, or either part's public surface changes.

## Outputs
`joined.test.mjs`. Owned by the Lead; builders do not edit it.

## Human check
The owner sees `npm test` pass and the wrong-file variant fail.

## Avoid
- Faking either side. A fake here proves nothing.
