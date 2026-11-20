# PLAN - todo · plan version: 1 · contract version: 0.6 (APPROVED 2026-11-15)
<!-- Base: Proofline v2.6 candidate, kit/templates/PLAN-TEMPLATE.md -->

An approved plan does not change. Replanning creates version 2 and never widens permissions mid-run.
Approval: the owner said on 2026-11-15 "Go ahead: scaffold, plan, and the builder's packet." The plan is shown to the owner with packet 06; carrying the packet is the go-ahead for U1.

## Shared foundations
| Foundation | Paths | Owner | Blocks which units | Accepted? |
|---|---|---|---|---|
| package and test runner | `package.json`, `scripts/run-tests.mjs` | B1 (U1) | U2, U3, U4 | yes, 2026-11-15 |
| errors, text rules, data file | `src/errors.mjs`, `src/text.mjs`, `src/store.mjs` | B1 (U1) | U2, U3, U4 | yes, 2026-11-15 |

U1 is finished and accepted by the Lead before U2 starts (checkpoint 1 below).

## Units of work
| Unit | Operation | Owner | Depends on | Allowed paths | Inputs (exact files) | Delivers (to whom) | Done when | Gate (checks that must pass) | Human approval? |
|---|---|---|---|---|---|---|---|---|---|
| 00_scaffold | SINGLE | Lead | approved SPEC | root, `_shared/`, `_templates/`, `planning/`, every `CONTEXT.md` | SPEC section 4, kit `templates/icm/` | router, root context, folder contracts, shared facts, decisions | every folder in the map has a contract | sizes within limits; Skip columns present; no invented facts | done 2026-11-15 (Lead); owner sees it with this plan |
| U1 foundation | SINGLE | B1 | 00 | `package.json`, `scripts/`, `src/errors.mjs`, `src/text.mjs`, `src/store.mjs`, `tests/foundation/`, `src/CONTEXT.md`, `tests/CONTEXT.md` | packet 06 | files + handoff U1 (to Lead) | tests for AC-01, 02, 03, 04, 13, 14, 15 pass | `npm test` green; AC-15 zero-test check exits 1; Lead re-runs both | no |
| U2 commands | SINGLE | B1 | U1 accepted; uses U4's `startServer` (contract fake until U4 lands) | `bin/`, `src/cli.mjs`, `tests/cli/` | packet 06 + Lead acceptance note for U1 | files + handoff (to Lead) | every `cli-cases.json` case passes; AC-06, 10, 11, 12, 21, 24 | `npm test` green | no |
| U3 page | SINGLE | B1 | U1 accepted | `src/page.mjs`, `tests/page/` | packet 06 | files + handoff (to Lead) | every `web-cases.json` body check passes through `renderPage` | `npm test` green | no |
| U4 server | SINGLE | B1 | U1 accepted, U3 | `src/serve.mjs`, `tests/web/` | packet 06 | files + handoff (to Lead) | every `web-cases.json` case and startupCase passes against a real child process; AC-09, 22 | `npm test` green | no |
| 05_seam_check | SINGLE | Lead (reports, does not edit) | U1-U4 handoff | none (read-only) | SPEC 6-7, fixtures, "Interfaces as built" | repair requirements (to B1) | every interface in SPEC 7.1-7.3 compared | no open mismatch | no |
| 06_qa | SINGLE | QA, fresh context | 05 | none except `build/handoffs/qa-*.md`; repairs go to B1 | SPEC, integrated files, run instructions, handoffs (not reasoning) | QA report (to Lead) | the 11 QA proofs in SKILL.md Phase 3, incl. walk test and surface scrub | every blocking AC has evidence | no |
| 07_deliver | SINGLE | Lead | 06 | `CONTEXT.md`, `_shared/`, `README.md`, `build/` | QA report | final report (to owner) | `templates/FINAL-REPORT.md` filled | facts match evidence | owner accepts delivery |

## Builders and why each is here
| Builder | Units | What would break without it | Model used | Probe that qualified it |
|---|---|---|---|---|
| B1 | U1, U2, U3, U4 in that order | nothing would be built | baseline model: the capable model the owner opens the builder chat with; B1 records which in its handoff | baseline model (no routing) |

QA uses the same baseline model in a fresh context. No other roles.

## Packet manifest (packet 06, one builder)
See `packets/06-builder/PACKET.md`; every file is listed there with why and whether it is a rule or data.

## Checkpoints (MULTI-CHAT; the Lead looks at each result as it lands)
1. B1 does U1 only, writes handoff `handoff-U1.md`, and stops. The owner brings it to the Lead.
2. The Lead re-runs `npm test` and the zero-test check on B1's files, checks the contract hash, and writes an acceptance note (or repair requirements). The owner pastes it into the same B1 chat.
3. B1 does U2, U3, U4 in order, writes `handoff-U2-U4.md`, and stops.

## Baseline
New project: no baseline.

## Autonomy limits
- Parallel units: none (one builder).
- Workers may delegate further: no. Workers talk to each other: no.
- Before QA: Lead updates root `CONTEXT.md` and `_shared/product-facts.md` to what has been observed.
- Repairs per failed gate: 2 (checks do not count). The spec gate's raised budget (AM-01, AM-02) does not carry over.
- Plan revisions this build: 2 (0 used).
- Enforced by the tool: nothing (MULTI-CHAT: the builder works in its own chat and folder). Instruction only: allowed paths, no network, no extra surface. The Lead's checks are real: re-running tests and the contract hash on every handoff before copying owned paths into the project.

## Stop and ask when
- a budget is used up · a gate still fails after two repairs · a required input is missing · the contract is ambiguous in a way that changes the result (impact stop: no repair spent) · any human-only operation is next.

## Human-only operations in this build
Approving any contract amendment; accepting delivery. There are no deploys, sends, payments or deletions.

## Status (mirror in build/STATE.md)
| Unit | State | Repairs used | Notes |
|---|---|---|---|
| 00_scaffold | accepted | 0 | Lead, 2026-11-15 |
| U1 | accepted | 1 (builder, within the gate) | Lead re-ran tests, hash, zero-test check, 3 own bad samples; files copied to project 2026-11-15 |
| U2 | accepted | 1 (builder, test defect) | Lead re-ran; integrated 2026-11-15 |
| U3 | accepted | 0 | integrated 2026-11-15 |
| U4 | accepted | 0 | integrated 2026-11-15 |
| 05_seam_check | accepted | - | no mismatch (build/handoffs/seam-check-and-acceptance-U2-U4.md) |
| 06_qa | accepted | - | ready, 0 implementation bugs (build/handoffs/qa-report.md) |
| 07_deliver | done | - | build/FINAL-REPORT.md, 2026-11-15 |
