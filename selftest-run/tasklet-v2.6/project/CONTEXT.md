# Workspace context
<!-- Base: Proofline v2.6 candidate, kit/templates/icm/CONTEXT-ROOT.md -->

How the pieces connect, what is happening now, and what to load for each kind of task.

## Current state (the only place this is kept; update it when it changes)
- **Release:** delivered 2026-11-15 as this folder (personal use; no package published). `npm link` not run.
- **Build:** contract `SPEC.md` v0.6 (APPROVED 2026-11-15). Built by one builder, accepted by the Lead, independent QA 2026-11-15: ready, no implementation bugs (`build/handoffs/qa-report.md`). Final report: `build/FINAL-REPORT.md`.
- **Evidence:** `npm test` 250/250 (Lead and QA); journey END-TO-END (QA on a fresh copy, Lead); page checked in Chromium at 375px (owner accepted; no iPhone). Details: `_shared/product-facts.md`. No users other than the owner.
- **On hold:** nothing. (P-01 kept by the owner 2026-11-15; lessons banked as proposals in `build/BANKED-PROPOSALS.md`.)
- **Known setup quirks:** Windows 11 machine; Node v26.4.0; no network. Symbolic-link tests cannot be created without Developer Mode (not needed: links are not supported).

## How the areas connect
```
SPEC.md + contract/fixtures ──pins──▶ src/ + bin/ ──checked by──▶ tests/ (npm test)
                                          │
                             todo <cmd> ──┴──▶ the task file (~/todo.json or TODO_FILE)
                             todo serve ─────▶ http://127.0.0.1:7070/ (reads the file per request)
planning/decisions/ ◀── any lasting decision      build/ ◀── handoffs, gate results, QA
```

## What to load per task
| Task | Load | Skip |
|---|---|---|
| Code change | `src/CONTEXT.md`, the SPEC sections it names, the files you touch | `build/` gate results, `planning/` |
| Test change | `tests/CONTEXT.md`, `contract/CONTEXT.md` | `build/`, `planning/` |
| Wording change | `contract/CONTEXT.md` | `src/` until the amendment is approved |
| Status question | this file only | everything else |
| Decision | `planning/CONTEXT.md` | `src/`, `tests/` |

## Shared facts
`_shared/product-facts.md` (what is built), `_shared/rules.md` (what we never do), `_shared/glossary.md` (exact meanings). Link to them; don't copy them.
