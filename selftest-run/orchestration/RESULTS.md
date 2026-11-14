# workflow-orchestration self-test on Tasklet

Date: 2026-11-13 · Tool: Claude desktop app (Code) · Model: Claude Fable 5.2 for every role · One run of each arm.

## The short version

- The planner followed the skill. All eight method checks passed, including the four mandatory ones.
- The plan did **not** help. Both builds scored 59 of 59 on the hidden checker. The planned build cost about twice the tokens and took about 1.7 times as long.
- The skill's own answer for this task was "do not organize, one worker". So the part of the skill that splits work across several workers was **not tested at all**.

## How it was run

1. **Task.** `TASK.md`: the Tasklet contract with the plan, the owners and every joined criterion removed, so the planner had to invent the joined checks.
2. **Hidden checker.** `evidence/verify.mjs`, 59 checks (21 command line, 26 fixtures through both readers, 8 web, 4 joined). Written and frozen before either build started; hash in `evidence/FROZEN.txt`. Tried first on four samples:

   | Sample | Result |
   |---|---|
   | Known-good build (the earlier Tasklet in `selftest-run/todo`) | 59 / 59 |
   | Empty build | 0 / 59 |
   | Correct parts, not joined (web reads a different file) | 55 / 59, all 4 joined checks fail |
   | Web half missing | 34 / 59, all 4 joined checks fail |

3. **With the plan.** A fresh planner got only the skill and `TASK.md` and wrote `WORKFLOW-PLAN.md`. Its handoff box, word for word, was the only instruction to one fresh worker (`build-with-plan/`).
4. **No plan.** One fresh agent got `TASK.md` and "work alone, in whatever order you think best" (`build-no-plan/`).
5. Same model, same 30-minute instruction, same fixtures for both. Neither could see the checker.

## Check 9: the comparison

| | With the plan | No plan |
|---|---|---|
| Hidden checker | 59 / 59 | 59 / 59 |
| Joined checks | 4 / 4 | 4 / 4 |
| Agents | planner + 1 worker | 1 |
| Tokens (as the tool reported them) | 87,716 + 111,763 = **199,479** | **97,545** |
| Agent time | 105 s + 284 s = **389 s** | **231 s** |
| Its own tests | 32, including 4 joined tests | 23, no joined test |
| Its own checker shown failing on bad samples | yes | no |

What the plan bought: a joined test and proof that it fails on unjoined and half-missing builds, left in the project. What it did not buy: a better score. The no-plan build passed the same hidden joined checks without writing any of its own.

One run each. This is a hint, not a result.

## Checks 1 to 8

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 (mandatory) | Answers "organize or not" first; one worker or at most two units | **PASS** | Plan section 1: "Do not organize. One worker, in order", with the three conditions in a table |
| 2 | The split has no worker or model names; arrows written | **PASS** | Plan section 3: U0 → U1, U0 → U2, U1 + U2 → U3, "written before deciding who does anything" |
| 3 | Every unit has an operation and a reason; SINGLE by default | **PASS** | Plan section 4 |
| 4 (mandatory) | A joined-only check exists and fails with one half missing | **PASS** | The plan's J1-J3 became `build-with-plan/tests/joined.test.mjs`. Run by this session, not taken from the worker's report: as built 4/4 pass; web half missing 0 pass, exit 1; command-line half missing 0/4 pass, exit 1 |
| 5 (mandatory) | The checker is shown failing on unjoined and empty samples | **PASS** | Run by this session: unjoined (`JOINED_SPLIT=1`) 0/4 pass; empty build 0 pass, exit 1 |
| 6 | Every delegation logged with time and tokens; planning counted in the budget | **PASS, with a limit** | The plan gave the log table and budgeted planning at 5 of 30 minutes. The numbers below were filled in by this session from what the tool reported. Nothing in the skill makes a tool do this |
| 7 | On a failed unit, one decision changes and the rest are named as held | **PASS, with a note** | A real mismatch was planted in a copy of the web part (`evidence/broken.txt`: 3 of 4 joined tests fail). The planner held the split, the operation and the worker, ordered a repair by the same worker, and named the one decision to change next if that failed (the worker on the web unit). Its first move was a repair, not a change of decision |
| 8 (mandatory) | "Use six workers" is refused or justified | **PASS** | Refused; pointed at step 0; said workers 3 to 6 would have no job it could name; offered two workers as the most that could honestly help |

Delegation log, filled in:

| # | Unit | Operation | Worker | Given | Agent time | Tokens | Result |
|---|---|---|---|---|---|---|---|
| 0 | Plan | - | planner | SKILL.md, TASK.md | 105 s | 87,716 | WORKFLOW-PLAN.md |
| 1 | U0-U3 | SINGLE | Worker 1 | handoff box, TASK.md, fixtures | 284 s | 111,763 | 59 / 59 |
| 2 | Repair | - | - | - | - | - | not needed |

## What this does and does not show

Kept apart, as the kit asks:

1. **Method followed:** yes, in this tool, once.
2. **Local behavior observed:** the plan's joined test fails on unjoined and half-missing builds; the planner refused extra workers; it changed nothing structural on a planted failure.
3. **Performance improvement observed:** **no.** Same score, about double the cost.
4. **Improvement reproduced:** not applicable.

Limits of this run:

- **The delegating path is NOT TESTED.** Steps 3 to 6 with more than one worker, the worker-picking in step 4, and joining work from several workers never ran, because the skill correctly said this task did not need them. A task big enough to pass step 0 is needed to test them.
- **Graded by the session that wrote the skill.** The checker was frozen first and the method checks were run, not read from reports, but no independent evaluator looked.
- **Nothing was enforced.** The 30-minute budget and "do not look elsewhere on disk" were instructions. Token counts are the tool's figures for each agent.
- **The planned worker was told a hidden checker existed**, and so was the no-plan agent. Equal on that point.
- Planner probes for checks 7 and 8 added about 1,500 tokens, not counted above.

## A finding that is not about orchestration

The two builds disagree on something the contract never says: how a title's length is counted. The planned build counts UTF-16 units and refuses a title of 101 emoji. The no-plan build counts code points and accepts 200 emoji. The hidden checker used plain letters, so both passed. This is the contract gap the kit's v2.5 spec gate exists for. Neither a plan nor a single builder closed it.
