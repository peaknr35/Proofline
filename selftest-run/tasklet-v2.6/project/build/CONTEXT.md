# build: the build record

One job: keep the record of how this project was specified, built and checked. It is history, not rules.

## Commands
| Do | Command |
|---|---|
| Regenerate fixtures (Lead, after an approved amendment) | `node build/tools/gen-fixtures.mjs` (from the project root) |
| Check the approved contract is unchanged | `sha256sum -c build/APPROVED-v0.6.sha256` (from the project root) |

## Inputs
- **Reference (every time):** `STATE.md` (checkpoint), `PLAN.md`
- **Working (this task):** the one record you need
- **Do NOT load:** the older SPEC texts (`SPEC-v0.4-as-gated.md`, `SPEC-v0.5-as-verified.md`) unless comparing versions; they are superseded

## What is here
- `INTAKE.md`: the idea and the environment probe
- `STATE.md`: checkpoint during the build (after delivery, root `CONTEXT.md` holds current state)
- `PLAN.md`: units, owner, gates, budgets
- `AMENDMENTS.md`: budget amendments AM-01 to AM-03 and the two recorded deviations
- `APPROVAL-REQUEST.md`, `APPROVED-v0.6.sha256`: what was approved
- `tools/gen-fixtures.mjs`: the fixture generator (Lead-owned)
- `handoffs/`: builder handoffs (U1, U2-U4), the Lead's acceptance and seam-check records, the QA report
- `FINAL-REPORT.md`: the delivery report

## Process
1. The Lead records every gate result, amendment, handoff and acceptance here.
2. On resume, verify the files before trusting `STATE.md`.

## Verify
- `STATE.md` agrees with the files present.
- Stale when: a new handoff or amendment lands.

## Outputs
Records only. Nothing here is product.

## Human check
The owner reads `STATE.md` "Needs a person now". Pass = it is empty or names the one thing waiting.

## Avoid
- Treating an old SPEC text or a gate result as a current rule.
