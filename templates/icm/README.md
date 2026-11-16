# ICM foundation - what every delivered project gets

ICM (Interpretable Context Methodology): the folder structure is the agent architecture. A fresh agent or person reads a small router, goes to the one folder the task needs, and finds a contract there that says what to load, what to skip, what to do and who checks it.

The Lead scaffolds this right after the contract is approved (Phase 1b), before any builder starts. Builders keep the `CONTEXT.md` of the folders they own accurate. QA runs the walk test. A project that fails the walk test is not delivered.

## Files to copy

| Template | Goes to | Layer | Size limit |
|---|---|---|---|
| `AGENTS.md` | project root | 0 - where am I, route by intent | under 50 lines |
| `CLAUDE.md` | project root | one-line pointer to AGENTS.md, for tools that read that name. An agent that does not expand `@` imports spends one read on it and should go straight to AGENTS.md | 1 line |
| `CONTEXT-ROOT.md` | project root as `CONTEXT.md` | 1 - current state, how areas connect, what to load per task | under 80 lines |
| `CONTEXT-FOLDER.md` | each working folder as `CONTEXT.md` | 2 - that folder's contract | 25-80 lines |
| `_shared/product-facts.md` | `_shared/` | 3 - what is actually built (the only source for public copy) | keep current |
| `_shared/rules.md` | `_shared/` | 3 - what we never do, release rules, evidence labels | keep short |
| `_shared/glossary.md` | `_shared/` | 3 - exact meanings of the words the project uses | keep short |
| `DECISION.md` | `_templates/decision.md` | template for `planning/decisions/YYYY-MM-DD_<topic>.md` | one page |

Layer 4 is per-run material (inputs, outputs, evidence) and lives in the folder it belongs to.

## Default workspace shape

Adapt to the archetype; drop folders the project does not need. Three real folders beat seven imagined ones.

```
project/
  AGENTS.md          router (Layer 0)
  CLAUDE.md          "@AGENTS.md"
  CONTEXT.md         current state + load/skip table (Layer 1)
  SPEC.md            the approved contract (+ SPEC-V2.md for upgrades)
  _shared/           product-facts.md, rules.md, glossary.md
  _templates/        decision.md + anything copied per run (a round, a pack, a client)
  contract/fixtures/ golden fixtures (valid and invalid)
  <code>/            CONTEXT.md here and in each folder a builder owns
  tests/             CONTEXT.md: what is covered, how to run, counts
  docs/              user and operator docs
  ops/               CONTEXT.md: deploy and recovery runbook (if deployed)
  planning/          CONTEXT.md, specs/, decisions/, audits/
  build/             PLAN.md, STATE.md, handoffs/, evidence/ (the build record)
  business/          only if it will be sold: offer, pricing, evidence ledger
```

## Rules the foundation must follow

- The router routes; it holds no content. Each fact has one home; everything else links to it.
- Every load table has a Skip / "Do NOT load" column. Skipping is as important as loading.
- Current state lives in one place only (root `CONTEXT.md`). Status in other files is a pointer, or frontmatter on the file itself.
- Factory (rules, templates, contracts) and product (runs, outputs, user data) stay in separate folders.
- Each folder contract has a Verify section: what its output must still agree with (an earlier output, the contract, a shared rule) and which input changes make it stale.
- Fix the source, not the output: when the same correction is made to a folder's output run after run, change that folder's `CONTEXT.md` or the reference it loads, as a proposal the owner approves.
- The router never points at a file that does not exist yet; a later target is marked "not written yet" until it is.
- How to run and test the project is reachable from the root in one step.
- Files win over status tables: if a table says "done" and the file is missing, it is not done.
- Never invent owners, dates, users, prices or approvals in these files. Unknown = `NOT FOUND`.
- "Never" written in markdown is a request. Real guarantees live in code, tests or permissions; say which is which.

## Walk test (QA runs it, fresh context, files only)

A context that did not build the project gets only the delivered folder. Pass when, in about three reads each, it can:

1. Say what the project is, its current state, and how to run it.
2. Route three tasks to the right folder and name what it would skip: a bug fix, a content change, a release.
3. Make one small change through the right folder's contract and run that folder's check.
4. Answer "what is built and what is not" from `_shared/product-facts.md` alone, matching the final report.

Record reads used and anything it got wrong. Every miss is fixed in a `CONTEXT.md`, not by explaining it to the agent.
