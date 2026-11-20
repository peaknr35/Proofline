# Workspace context

How the pieces connect, what is happening now, and what to load for each kind of task.

## Current state (the only place this is kept; update it when it changes)
- **Release:** delivered 2026-11-13 as a personal test project; not published anywhere.
- **Build:** contract SPEC 1.0. `npm test`: 182 tests, 182 pass (Lead, 2026-11-13, after one repair). Independent QA done: 13 findings, 0 release-blocking. Report: `build/FINAL-REPORT.md`.
- **Evidence:** MEASURED: the test runs, QA's hand journey, the browser check at desktop and 375px (emulated). NOT RUN: a real phone, other browsers, a screen reader, other Node versions and systems. No real users.
- **On hold:** three owner decisions: title length unit (R-1), control characters in titles (F-04), contract gaps to write down (F-12). See `build/FINAL-REPORT.md` section 6.
- **Known setup quirks:** `node --test <folder>` fails on Node 26; use `npm test`.

## How the areas connect
```
you ──type a command──▶ cli/ ──writes──▶ tasks.json ──read on every request──▶ web/ ──▶ browser
                                             ▲
                     contract/fixtures/ ─────┘ (both parts are tested against the same examples)
tests/integration/ runs the real cli/ and the real web/ against one file
planning/decisions/ ◀── any lasting decision
```

## What to load per task
| Task | Load | Skip |
|---|---|---|
| Command change | `cli/CONTEXT.md`, then the files you touch | `web/`, `build/` |
| Page change | `web/CONTEXT.md`, then the files you touch | `cli/`, `build/` |
| File format change | `SPEC.md` § 6-7, `contract/fixtures/`, then both part contracts | `build/evidence/` |
| Joined check change | `tests/integration/CONTEXT.md` | part internals |
| Status question | this file only | - |

## Shared facts
`_shared/product-facts.md` (what is built), `_shared/rules.md` (what we never do), `_shared/glossary.md` (exact meanings). Link to them; don't copy them.
