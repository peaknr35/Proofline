# PLAN - <project> · plan version: · contract version:

An approved plan does not change. Replanning creates the next version and never widens permissions mid-run.

## Shared foundations (find these before handing out any work)
| Foundation (schema, migrations, sign-in, configuration, dependency files, common interfaces) | Paths | Owner | Blocks which units | Accepted? |
|---|---|---|---|---|

Blocking foundations are finished and accepted before dependent units start. Two units that would edit the same file run one after the other.

## Units of work
Split into outcomes that can each be checked alone; decide who does each second. Prefer one owner per whole user-facing feature. Cut by layer only when the boundary is stable and in the contract, fixtures pin it down, and a joined check verifies it. Operation: SINGLE (default; always for small bounded tasks) · PARALLEL (complementary work) · SELECT (an alternative attempt, a check picks) · REVIEW (an independent check by a critic who did not write it). Delegate only when it is worth the coordination cost.

| Unit | Operation | Owner | Depends on | Allowed paths | Inputs (exact files) | Delivers (to whom) | Done when | Gate (checks that must pass) | Human approval? |
|---|---|---|---|---|---|---|---|---|---|
| 00_scaffold | SINGLE | Lead | approved SPEC | root, `_shared/`, `_templates/`, `planning/`, every folder's `CONTEXT.md` | SPEC section 4 workspace map, `templates/icm/` | router, root context, folder contracts, shared facts, first decisions (to all builders) | every folder in the map has a contract | sizes within limits; every load table has a Skip column; no invented facts | yes |
| 01_ | | | | | | | | | |
| NN_seam_check | SINGLE | Lead or one named checker (reports, does not edit) | all builder handoffs | none (read-only) | SPEC sections 6-7, fixtures, "Interfaces as built" from each handoff | repair requirements (to owners) | every shared interface compared | no open mismatch | no |

## Builders and why each is here
| Builder | Unit it owns | What would break without it | Model used | Probe that qualified that model for this role (or "baseline model") |
|---|---|---|---|---|

## Packet manifest (one per worker)
| File | Why it is in the packet | Rule to follow, or data to work on |
|---|---|---|

## Baseline (upgrades and repairs)
Test command run before any change: · result saved at: `build/evidence/baseline.<ext>` · tests passing / failing:

## Autonomy limits
- Units allowed to run in parallel (no mutual dependencies):
- Workers may delegate further: no
- Workers talk to each other: no; files and handoffs go through the Lead, who checks each result as it lands
- Before QA: Lead updates root `CONTEXT.md` and `_shared/product-facts.md` to what has been observed
- Repairs per failed gate: 2 (checks do not count)
- Plan revisions this build: 2
- Other budgets (time, tool calls, cost) if the tool can enforce them; organizing time counts:
- Enforced by the tool: <list> · Instruction only: <list>

## Stop and ask when
- a budget is used up
- a gate still fails after two repairs
- a required input or piece of evidence is missing (abstain)
- the contract is ambiguous in a way that changes the result
- the baseline comparison shows a new failure
- any human-only operation is next

## Human-only operations in this build
<deploy / delete / send / publish / pay / promote a rule or pattern / change the contract>

## Status (mirror in build/STATE.md)
| Unit | State: pending / staged / failed / accepted / abstained / stale | Repairs used | Notes |
|---|---|---|---|
