# todo

A command-line to-do list kept in one JSON file, with a read-only web view on this computer. Personal tool for its owner, 2026.
<!-- Base: Proofline v2.6 candidate, kit/templates/icm/AGENTS.md -->

## Where things live
| Folder | What it holds |
|---|---|
| `SPEC.md` | the approved contract (v0.6); wins over everything below |
| `contract/` | golden fixtures (generated; read-only except for the Lead) |
| `src/`, `bin/` | the program (`bin/todo.mjs` is the entry point) |
| `tests/` | the tests and the test runner notes |
| `planning/` | decision records |
| `_shared/` | what is built, the rules, the words we use |
| `_templates/` | `_templates/decision.md`: copy it to record a new decision |
| `build/` | the build record: plan, state, handoffs, gate results |

## Route by intent
| If you need to | Read first | Then stop at |
|---|---|---|
| Know the current state | `CONTEXT.md` § Current state | - |
| Run it or test it | `README.md` | - |
| Fix a bug or change code | `src/CONTEXT.md`, then `tests/CONTEXT.md` | `npm test` passes; the owner reviews the diff |
| Change a message, help text or page wording | `contract/CONTEXT.md` (wording is in the contract) | a contract amendment the owner approved |
| Release (copy the folder, `npm link`) | `CONTEXT.md` § Current state | the owner says yes |
| Record a decision | `planning/CONTEXT.md` | decision drafted |

## Naming
- Dated files: `YYYY-MM-DD_topic.md`. Contract versions: `SPEC.md` header; earlier gated texts in `build/`.

## The rules
- The contract is the source of truth; if code and `SPEC.md` disagree, `SPEC.md` wins.
- Build nothing that `SPEC.md` 7.4 does not list.
- Agents draft. They never delete the owner's task file, publish or change rules without asking.
- Load only what the step needs. Each `CONTEXT.md` lists what to skip.
- Full rules: `_shared/rules.md`.
