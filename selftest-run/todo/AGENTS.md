# Tasklet

A command-line to-do list stored in one JSON file, plus a read-only web page of the same list. A test project for the five-agent-build kit, 2026.

## Where things live
| Folder | What it holds |
|---|---|
| `cli/` | The command-line tool, the file writer, their tests |
| `web/` | The read-only page and its server, their tests |
| `tests/integration/` | Checks that need both parts running |
| `contract/fixtures/` | Valid and invalid example data files, with expected verdicts |
| `_shared/` | What is built, the rules, the words we use |
| `planning/` | Decision records |
| `build/` | The build record: plan, state, handoffs, evidence |
| `docs/` | Quickstart |

## Route by intent
| If you need to | Read first | Then stop at |
|---|---|---|
| Know the current state | `CONTEXT.md` § Current state | - |
| Run it or test it | `docs/quickstart.md` (`npm test` runs everything) | - |
| Fix or change a command | `cli/CONTEXT.md` | `npm test` passes, the owner reviews the diff |
| Fix or change the page | `web/CONTEXT.md` | `npm test` passes, the owner looks at the page |
| Change the data file format | `SPEC.md` § 6, then `contract/fixtures/` | the owner approves the contract change; both parts are stale until rechecked |
| Release / share it | `_shared/product-facts.md`, then `docs/quickstart.md` | the owner says go |
| Record a decision | `_templates/decision.md` | saved in `planning/decisions/` |

## Naming
- Dated files: `YYYY-MM-DD_topic.md`. Tests: `*.test.mjs`.

## The rules
- `SPEC.md` wins over code. Builders do not edit it.
- `cli/` and `web/` never import from each other; they meet only at the data file.
- Agents draft. They never delete a user's data file or act outside this folder without asking.
- Load only what the step needs. Each `CONTEXT.md` lists what to skip.
- Full rules: `_shared/rules.md`.
