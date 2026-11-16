# SPEC - <project name>

Status: DRAFT | SUPERSEDED · APPROVAL: see `build/APPROVAL.md` (never recorded in this file: editing it would change the bytes the approval covers) · Version: · Baseline (if upgrading): · Build mode: · Capabilities available here:

This file is the single source of truth. If code and this file disagree, this file wins. Builders do not edit it.

## 1. Product
- Purpose in one sentence:
- Intended user:
- Primary journey:
- Distribution: personal | internal | public | commercial
- In scope:
- Non-goals:
- Source inventory (source, date/version, read? yes/no):

## 2. Acceptance criteria
| ID | Kind: unit / seam / journey / process | Observable behavior | How it is checked | Known-bad sample the check must fail on | Environment needed | Blocks release? |
|---|---|---|---|---|---|---|
| AC-01 | | | | | | |

Every seam in section 7 has at least one `seam` criterion that only the joined system can pass (parts that are each correct but never reconciled must fail). Where the order of steps matters, add a `process` criterion: the right end state reached the wrong way fails.

## 3. Constraints
Runtime and versions · dependency policy · platforms · data sensitivity · branding and licensing · accessibility · offline behavior · deployment target.

## 4. Architecture, workspace map and ownership
File tree, then the workspace map (ICM foundation, see `templates/icm/README.md`):

| Folder | One job | Owner of its CONTEXT.md | Skip it when |
|---|---|---|---|
| (root) `AGENTS.md`, `CONTEXT.md`, `_shared/` | routing, current state, shared facts | Lead | |

Then ownership of implementation paths:

| Path or pattern | Owner | Purpose |
|---|---|---|

Every implementation path has one owner per plan version. Contract, shared schemas and golden fixtures are Lead-owned and read-only for builders.

Shared foundations (schemas, migrations, sign-in, configuration, dependency files, common interfaces):

| Foundation | Paths | Owner | Units that depend on it |
|---|---|---|---|

Work units (prefer whole user-facing features; a layer split needs a stable written boundary, fixtures that pin it down, and a joined check):

| Work unit | Owned outcome, from entry point to stored result | Paths | Depends on |
|---|---|---|---|

## 5. Settings
| Setting | Type | Default | Validation | Secret? |
|---|---|---|---|---|

Conventions for ids, dates, timestamps, encoding, paths.

## 6. Data contracts and golden fixtures
For each shared file or payload: schema location, required and optional fields, invariants, unknown-field behavior, versioning.

Fixtures (location: `<contract/fixtures/>`): written before the prose. At least one valid and one invalid example per shared shape, with the expected result. For every limit: one at the limit, one under, one over. Every builder's tests load these.

Every rule above points at the fixture that pins it. A rule with no fixture is not finished.

| Rule | Fixture(s) that pin it |
|---|---|

Error table (every way it can fail; every invalid fixture names one of these):

| Error name | When | Exit code or status | Exact message |
|---|---|---|---|

## 7. Integration interfaces
For each boundary: owner · function, route, event or command · inputs and outputs · error codes · side effects · access control · duplicate handling · which fixture covers it.

Do not specify private helpers.

**The surface, closed.** Everything the product exposes. What is not in this table is not built; an extra found later is removed or proposed as an amendment.

| Kind: command / flag / route / screen action / setting / environment variable / output format / file written | Name | Criterion it serves |
|---|---|---|

## 8. Interface and journeys
For each screen or entry point: action → real downstream operation · loading, empty, success and failure states · validation · the acceptance criterion it serves. Mark any deferred action explicitly.

## 9. Human authority and security
- Human-only operations:
- How confirmation works (and that it is intent, not identity):
- What workers can touch (paths, network, credentials):
- How untrusted content is handled, on every surface it reaches (web page, terminal, logs, file names, messages):
- Audit record of approvals (each tied to the exact content approved; a change voids it):
- Who proposes, who approves, who executes each human-only operation (never the same worker for all three):

Approving this spec does not approve later external actions.

## 10. Execution and recovery
Stages and dependencies · where candidates are staged and how they are accepted · what becomes stale when an input changes · isolation · timeouts and cancellation · what happens when an external outcome is unknown · crash recovery · how long failed attempts are kept.

## 11. Tests and evidence
Install command · test command · how test discovery is proven (fails on zero tests) · how each gate is shown to fail on a known-bad sample · unit · contract (golden fixtures) · integration (the seam criteria) · end-to-end journey · browser/device · failure drills · security · packaging check · dependencies not available here.

For upgrades and repairs: the baseline (results per test before the change) and the comparison by test name afterwards: target fixed · target not fixed · new failure · failing before and after · newly passing. A new failure blocks release.

## 12. Plan and budgets
Work units from section 4 and the operation for each (SINGLE unless delegating for complementary work, an alternative attempt or an independent check) · builders used (1-4) and what would break without each · model per role (one baseline model unless a role probe qualified another) · repairs per failed gate: 2 · plan revisions per build: 2 · other limits · when to stop and ask.

## 13. Delivery
ICM foundation (router, root and folder `CONTEXT.md`, `_shared/`, `_templates/`, `planning/decisions/`) passing the walk test · required files · quickstart · docs · known limitations · license inventory · release package · commercial requirements if relevant.

## 14. Interpretation register
| ID | Ambiguity | The one decision | Decided by: the person / ASSUMED BY LEAD | Fixture that pins it | Criteria affected |
|---|---|---|---|---|---|

Soft words from the request (smooth, safe, simple, fast, "when possible"): each one turned into a criterion ID, or moved to non-goals.

## 15. Approval
Spec gate (`templates/SPEC-GATE.md`): PASS / UNDERSPECIFIED · depth · runs (full, then verification) · run by · fresh context or SELF-REVIEW · asked: · assumed by Lead (shown to the person): · known limits:

Not approvable while the gate is UNDERSPECIFIED. The approval itself is recorded in `build/APPROVAL.md`, not here:

```
Decision: APPROVED · confirmed by: <who, and their words> · date: · conditions:
Contract version: <n>
SHA-256 of the approved files (any change voids the approval):
<hash>  SPEC.md
<hash>  contract/fixtures/<each file>
```

## 16. Upgrade amendment (when applicable)
Baseline stays valid except: overrides · new requirements · migration · compatibility · regression cases · rollback.
