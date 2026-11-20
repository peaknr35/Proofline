# planning: decision records

One job: keep the lasting decisions about this project, one file per decision.

## Commands
None. This folder holds documents only.

## Inputs
- **Reference (every time):** `../_templates/decision.md`, `../SPEC.md` section 14 (interpretation register)
- **Working (this task):** the one decision being recorded
- **Do NOT load:** `../src/`, `../tests/`, `../build/handoffs/` - code and build records are not decisions

## Process
1. Copy `../_templates/decision.md` to `decisions/YYYY-MM-DD_topic.md`.
2. Fill context, options, decision, consequences, revisit-when. Facts only; unknowns are `NOT FOUND`.
3. If the decision changes behavior, it is a contract amendment first: draft it for the owner; do not edit `SPEC.md`.
4. When a decision replaces another, set the old one's `status: replaced by <file>`.

## Verify (before the human check)
- Against `../SPEC.md` section 14: the decision does not contradict an approved register row (or says it amends it).
- Stale when: the contract version changes.

## Outputs
`decisions/*.md` only. This folder never changes code or the contract.

## Human check
The owner reads the decision. Pass = `status: approved` set by the owner's word.

## Avoid
- Recording a decision the owner did not make as `approved`.
- Copying the interpretation register here; link to it instead.

Current records: `decisions/2026-11-15_stack.md`, `decisions/2026-11-15_scope.md`, `decisions/2026-11-15_naming-and-build.md`.
