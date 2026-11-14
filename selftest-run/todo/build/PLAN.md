# PLAN - Tasklet · plan version: 1 · contract version: SPEC 1.0 (approved 2026-11-13)

An approved plan does not change. Replanning creates the next version and never widens permissions mid-run.

## Units of work
| Unit | Operation | Owner | Depends on | Allowed paths | Inputs (exact files) | Delivers (to whom) | Done when | Gate | Human approval? |
|---|---|---|---|---|---|---|---|---|---|
| 00_scaffold | SINGLE | Lead | approved SPEC | root files, `_shared/`, `_templates/`, `planning/`, every `CONTEXT.md`, `scripts/`, `tests/integration/`, `package.json` | SPEC §4, kit `templates/icm/` | router, contexts, shared facts, joined test, test runner (to builders) | every folder in the map has a contract | size limits; Skip columns; no invented facts | given with the contract |
| 01_cli | SINGLE | Builder B | 00 | `cli/**`, `build/handoffs/builder-b.md` | SPEC, `contract/fixtures/`, `cli/CONTEXT.md`, `_shared/glossary.md` | `cli/todo.mjs`, `cli/store.mjs`, tests, handoff (to Lead) | AC-01..06, AC-10 pass in its own tests | `node --test` on `cli/tests` green; all fixtures judged as expected | no |
| 02_web | SINGLE | Builder C | 00 | `web/**`, `build/handoffs/builder-c.md` | SPEC, `contract/fixtures/`, `web/CONTEXT.md`, `_shared/glossary.md` | `web/server.mjs`, tests, handoff (to Lead) | AC-05..07 pass in its own tests | `node --test` on `web/tests` green; all fixtures judged as expected | no |
| 03_seam_check | SINGLE | Lead (reports, does not edit builder files) | 01, 02 | none (read-only) | SPEC §6-7, fixtures, both "Interfaces as built" tables, the built files | repair requirements (to owners) | every shared interface compared | no open mismatch | no |
| 04_integrate | SINGLE | Lead | 03 | Lead paths | all of the above | `npm test` result | AC-08, AC-09, AC-12 pass | full suite green; wrong-file variant fails | no |
| 05_qa | SINGLE | fresh QA | 04 | `docs/**`, `build/evidence/**`, `build/handoffs/qa.md` | SPEC, integrated files, handoffs, run instructions; no builder reasoning | QA report, quickstart (to Lead) | all ten QA proofs attempted | findings classified | no |
| 06_deliver | SINGLE | Lead | 05 | Lead paths | QA report | final report, updated state and product facts | evidence matches the report | Lead reran the suite and one real journey | no |

01 and 02 run in parallel: they share no dependency except the contract.

## Roles and why each is here
| Role | What would break without it | Capability it needs |
|---|---|---|
| Builder B | the CLI would not exist | careful, follows a spec |
| Builder C | nothing for a real project (B could build the page next); the self-test's planted-mismatch check needs a second builder | careful, follows a spec |
| Fresh QA | no independent verification; it would be SELF-REVIEW | skeptical, runs things |

## Packet manifest (both builders)
| File | Why | Rule or data |
|---|---|---|
| `SPEC.md` | the contract | rule |
| `contract/fixtures/*` + `expected.json` | shared examples and verdicts | rule (verdicts), data (files) |
| own folder `CONTEXT.md` | the folder contract to keep accurate | rule |
| `_shared/glossary.md` | exact word meanings | rule |
| kit `templates/HANDOFF-TEMPLATE.md` | handoff format | rule |

## Autonomy limits
- Parallel: 01 and 02 only. Workers may delegate further: no. Workers talk to each other: no.
- Repairs per failed gate: 2 (checks do not count). Plan revisions: 2.
- Enforced by the tool: nothing beyond separate worker contexts. Instruction only: path ownership, no cross-imports, no network.

## Stop and ask when
a budget is used up · a gate still fails after two repairs · an input or evidence is missing · the contract is ambiguous in a way that changes the result · any human-only operation is next.

## Human-only operations in this build
Deleting any existing data file · acting outside `selftest-run/todo/` · changing `SPEC.md`.

## Self-test note (not part of a normal plan)
Builder C's packet carries one planted wrong instruction (the flag is called `completed`). Builder B's does not. Recorded here so the record is honest; QA is not told.

## Status
See `build/STATE.md`.
