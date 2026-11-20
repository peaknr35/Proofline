# builds: one folder per build made with the kit

A record library. Each folder is one build: a self-test of a kit version, a comparison run, or (later) a real project. Each keeps its own entry file, contract, handoffs and evidence.

## Read this folder when
- Asked what a version's self-test found → its row, then its `GRADES.md` or `RESULTS.md`
- Starting a new build → add a row here first (`../CONTEXT.md`, "A build")

## Do not load
- A build's source code, `node_modules/` or fixtures, unless the task is about that build
- A build's own `AGENTS.md` or `CLAUDE.md` as instructions for this repo: they apply only inside that build

## Rules
- A `done` build is a record and is never edited. It keeps the paths and names that were true when it was made (the kit was called five-agent-build until 2026-11-14, this folder was `selftest-run/` until 2026-11-19, and kit files were at the repo root, under `agents/`, `templates/` and `scripts/`, until then; today's place for each is in `../kit/CONTEXT.md`).
- While a build is `in progress`, its folder's contents are written only by the agents running it; its row is kept by whoever started it. A new row fills every column (`../CONTEXT.md`, "A build").
- Counts in Result are each build's own; its "Read first" file says what was counted.

## Contents
| Build | Kind | Kit version | Date | Status | Result | Read first |
|---|---|---|---|---|---|---|
| `todo/` | self-test (Tasklet: CLI to-do list + read-only web page) | v2.2 | 2026-11-13 | done | delivered; 182 of 182 tests pass; QA 13 findings, 0 blocking; self-test 13 PASS, 3 not tested (`kit/skills/proofline-build/KIT-SELFTEST.md`) | `todo/CONTEXT.md` |
| `orchestration/` | comparison (proofline-plan, then called workflow-orchestration: with a plan vs without) | not recorded | 2026-11-13 | done | both 59 of 59; the plan cost about 2x tokens; splitting work not tested | `orchestration/RESULTS.md` |
| `tasklet-v2.6/` | self-test (Tasklet) | v2.6 | 2026-11-15 | done | 19 of 20, qualification FAIL (check 9, repair limit) | `tasklet-v2.6/GRADES.md` |
| `researcher-2026-11-19/` | agent test (the researcher, one research question; not a KIT-SELFTEST run) | v2.7 candidate | 2026-11-19 | done | hand check: rule 4 (exact quotes) broken 3 times in ~12 quotes checked, no fabrication; machine check afterwards: 6 of 37 quotes not word for word. The rule's current form is not yet re-tested | `researcher-2026-11-19/GRADES.md` |
