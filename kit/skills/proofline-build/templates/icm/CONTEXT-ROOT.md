# Workspace context

How the pieces connect, what is happening now, and what to load for each kind of task.

## Current state (the only place this is kept; update it when it changes)
- **Release:** <version or tag, where it runs, frozen or open>
- **Run it:** <the one command to run it, and the one to test it, or "not written yet">
- **Build:** contract <SPEC version>, last verified <date> (see `build/` and the final report)
- **Evidence:** <what is MEASURED vs PLANNED vs SIMULATED; "no real users or payments yet" if true>
- **On hold:** <items and what unblocks each>
- **Known setup quirks:** <e.g. a command needed on this machine>

## How the areas connect
```
<source> ──<verb>──▶ <folder> ──<verb>──▶ <folder> ──▶ <where it runs>
                                                       │
<where feedback lands> ◀───────────────────────────────┘
        │
planning/decisions/ ◀── any lasting decision from the above
```

## What to load per task
| Task | Load | Skip |
|---|---|---|
| Code change | `<code>/CONTEXT.md`, then the folder's `CONTEXT.md`, then the files you touch | `business/`, `build/evidence/`, dependency and build-output folders |
| <Content change> | `<content>/CONTEXT.md`, `_shared/rules.md`, one existing example | `<code>/src/` |
| Release | `ops/CONTEXT.md` | everything else |
| Status question | this file only | - |

## Shared facts
`_shared/product-facts.md` (what is built), `_shared/rules.md` (what we never do), `_shared/glossary.md` (exact meanings). Link to them; don't copy them.
