---
name: proofline-plan
description: EXPERIMENTAL - followed once, on a task small enough that it rightly said "one worker"; no benefit shown yet and the multi-worker path is untested. Turn a task into a plan that knows its dependencies - decide first whether the work needs organizing at all, split it without thinking about who does it, then choose per unit whether one worker does it or it is delegated, write the handoffs and the checks only the joined result can pass, and charge the time spent organizing against the same budget as the work. Use when the user says "plan this build", "how should I split this across agents", "should this be one agent or several", "write the workflow", "orchestrate this", or hands over a long task with parts that depend on each other. Produces a plan and a delegation log, not the work itself.
---

# Proofline Plan (experimental)

**Status: EXPERIMENTAL.** Written from two measured papers and run once (record at the end). In that run the method was followed and the plan did not help: same score as one agent with no plan, about twice the tokens. The part that splits work across several workers has never run. Read "How far to trust this" before relying on it.

**What that run means in practice:** for a small task, do step 0 in your head and skip the written plan. Writing the plan is itself a cost. Use the full skill when step 0 says yes.

This skill plans the work. `proofline-audit` tests whether the team the plan proposes is justified. `proofline-runtime` says what software must enforce. `proofline-build` uses a plan like this inside a full build.

A skill can guide a plan. It cannot enforce a budget or a permission. Only the tool running the workers can.

## Step 0 - Does this need organizing at all?

One agent working through the task in order is a valid workflow. Nothing here assumes more agents or more parallel work is better.

Organizing changes the result only when all three are true:

1. **There is a lot of separable work.** Units that could be given to different workers.
2. **The units depend on each other**, or share a rule, an interface or a budget, so order and joining matter.
3. **Success is judged on the joined result**, not piece by piece.

If any is false, the plan is: one worker, in order. Write that down and stop. That is a correct output of this skill.

## Step 1 - Write what "done" means for the whole, before splitting anything

- One integrated deliverable, described so someone else could check it.
- Acceptance is defined on the final thing, not on its parts.
- **For every place two units depend on each other, one check that only the joined result can pass.** Parts that are each correct but never reconciled must fail. Examples: a regression test across modules; totals that must reconcile across ledgers; two analyses that must not contradict each other in the final report; parts that must meet at a shared edge.
- **Where the order of steps matters, a check on the process.** The right end state reached by an invalid route fails.
- **Test the checker before trusting it**, on three samples: a known-good result (passes), an empty result (scores nothing), and correct parts that were never joined (fails). A checker that passes unjoined parts is not checking the thing this plan exists for.

## Step 2 - Split the work without thinking about who will do it

Decide **what** must be solved and **in what order**. No worker names, no model names, no team size yet.

Write:

- the units, each as one sentence a stranger could act on
- the arrows: which unit needs which other unit's output
- the shape this gives: side by side, one after another, or a loop that repeats until a check passes
- the longest chain of dependent units. Side-by-side work can only shorten the build down to that chain.
- anything several units share (a schema, an interface, a constraint). That is a unit of its own and comes first.

Why keep "what" apart from "who": when the two are decided together and the build fails, you cannot tell whether the split was wrong or the staffing was. Apart, you can hold one still and change the other. And when a better worker turns up, the split does not need redoing.

## Step 3 - Then choose how each unit is carried out

Hold the split fixed. For each unit pick one:

| Operation | What happens | Choose it when |
|---|---|---|
| SINGLE (default) | one worker | one available worker is clearly good at this kind of unit |
| REVIEW | one produces, another critiques, the first repairs | a mistake here is expensive and a second pair of eyes is cheap by comparison |
| SELECT | two or more attempt it, a judge or a check picks one | the approach is open and there is a check that can pick the winner |
| ENSEMBLE | several answer, the answers are combined | no worker is clearly good, several are middling, and answers can be combined mechanically |
| DEBATE | several exchange and refine answers | rarely; it is the most expensive, and nothing read here shows it earning that |

The deciding question is **how well the workers you actually have match this unit**. One clear match: SINGLE. Several middling matches: more than one worker may pay. That is a per-unit decision, not a style for the whole plan.

Three numbers to keep in mind, from one study (small models, question-answering, maths, code and planning tasks; not software builds):

- A good split with every unit left to one worker scored 50.4. Adding the multi-worker operations took it to 51.5 and tripled the calls (1.68 to 5.35). **Most of the value was in the split.**
- Running every worker on everything and combining scored 46.0 at 7 calls. More workers, worse result than the careful plan.
- Six workers voting did no better than the single best one (67.9 against 68.3).

## Step 4 - Choose the worker last

Only now, per unit: which worker.

- **If you have a choice of workers:** keep a small fixed set of trial tasks. Every worker runs the same set once. For a new unit, look at how each worker did on the trials most like it, and pick from that. Do not let ten near-identical trials count ten times. Update the picture from real results as builds go by. A new worker joins by running the trial set; the plan does not change.
- **If you do not have trial results:** use one worker you know is capable for everything. Do not route by reputation.

In that study, picking by trial results beat always using the best single worker only slightly (70.2 against 68.3), and always picking a worker that would have succeeded would have scored 82.7. So matching helps a little and is far from solved.

## Step 5 - Decide what each worker is told

Workers start empty and share only the workspace. What each one needs to know is your decision, and it is part of the plan's quality, not an afterthought. In the study that separated plan from worker, the gains came from the workflow *including the instructions given to each worker*.

Per unit, write the handoff:

| Field | Content |
|---|---|
| Receives | the files and upstream outputs it needs, and nothing else |
| Owes | the one job |
| Delivers | what, in which form, where |
| To whom | the unit or the joining step that uses it |
| Done when | the check that ends it |
| Must agree with | the shared interface or rule it depends on |

## Step 6 - Plan the joining, not only the building

Two different reasons to delegate, and the plan should say which each delegation is:

- **building parts side by side**, to be joined later
- **preparing inputs for one central builder** (analysis first, then one worker builds the whole)

Then:

- Name the joining step and its owner. Joining nobody owns is where plans fail.
- If parts share a foundation, build it first and only then fan out.
- Put a check before each point where one unit's error would flow into the next.
- Expect repair after joining and leave budget for it.

## Step 7 - One budget, and organizing spends it

- Set one budget for the whole task (time, tokens or both), shared by the planner and every worker.
- Planning, writing handoffs, waiting, joining and re-planning all draw from it. A plan that takes a third of the budget to write is a plan that leaves two thirds for the work.
- Side-by-side workers shorten the longest chain and add coordination. Count both.
- **Record every delegation**: unit, operation, worker, what it was given, time, tokens, result. Without the record, the outcome cannot be read against the plan that produced it.

## Step 8 - Run, look, revise one thing

- Look at each result as it comes back. Do not launch everything and wait.
- Revise the plan from what the checks say. A revision is a new version; keep the old one.
- When something fails, change **one** decision and hold the others: the split, or the operation on a unit, or the worker on a unit. Change two and you learn nothing about either.
- Stop when the budget is gone or the checks pass. Report what was not finished.

## What to hand back

`WORKFLOW-PLAN.md`:

1. Organize or not, with the three-part reason from step 0.
2. The whole-deliverable definition of done; the joined-only checks; the process checks; how the checker was tested on good, empty and unjoined samples.
3. The units and arrows, the shape, the longest chain, the shared foundations.
4. Per unit: operation and the reason for it; worker and the reason for it; the handoff table.
5. The joining step, its owner, and where the checks sit.
6. The budget, and how much of it organizing is expected to use.
7. The delegation log (empty at first; filled as it runs).
8. What is `NOT RUN`, and what is an instruction that nothing enforces.

Ask the user only what changes the plan: what the finished thing is, what workers are available, the budget, and what cannot be undone.

## How far to trust this

**The uncomfortable finding first.** In the study that this skill's steps 2-4 come from, the gains came from a planner that had been *trained* for the job. The same system with an untrained planner scored 38.3, and with a larger off-the-shelf planner 36.6. The best single worker alone scored 39.2. **Asking a capable model to split and delegate, without training, did worse than not delegating.** This skill is instructions to an untrained planner. That is why step 0 exists, why SINGLE is the default, and why the self-test below compares against one agent with no plan.

| Source | What it measured | What limits it |
|---|---|---|
| Decoupled Multi-Agent Orchestration, DeOrch (Wu, Lu, 2026) | a trained two-stage planner and a trial-based worker picker across eight benchmarks; 51.5 average against 39.2 for the best single worker and 42.4 for that worker given three extra rounds at a similar token cost | under review; small open models (4 to 14 billion parameters); question-answering, maths, code and planning benchmarks, not project builds; up to six workers; the gains belong to its trained planner, trial set and worker pool |
| WorkflowArena (Jiang et al., 2026) | 145 long tasks in 8 fields, agents free to delegate or not, every delegation recorded, one four-hour budget shared with organizing, hidden checkers that unjoined parts cannot pass | the best set-up fully solved 36.95% of tasks; each set-up ran each task once, so close results have no error bars; model and tool were always tested together; two fields were graded by a model with no human agreement check |
| WorkflowArena, plan-versus-worker experiment | workers held fixed, only the author of the plan changed, 32 hard tasks: one strong model's plans raised all four weaker workers (+6.41 points); another strong model's plans lowered two of the four (-2.53 on average in the fixed-plan mode) | 32 tasks, two plan authors; plan authors also wrote the workers' instructions, so the gain may be task knowledge as much as organization |

What follows from these, stated at the strength they support:

- **Who writes the plan matters, and being good at the task alone does not make a model a good planner.** Measured, on a small sample.
- **Most of the value is in the split.** Measured, in a different kind of task.
- **Joined-only checks, a shared budget and a delegation log** are how one benchmark was built. They are sound design. Nothing here measures that using them makes your builds faster.
- No claim of speed is made.

## Self-test on Tasklet (run before changing the status)

Tasklet: a command-line to-do list storing tasks in a JSON file, plus a one-page web view of the same file. It is small on purpose: the right plan is nearly "do not organize".

| # | Do this | Pass when |
|---|---|---|
| 1 | Give it Tasklet and ask for a plan | It answers step 0 before anything else, and proposes one worker or at most two units with the shared file format as a foundation |
| 2 | Read the split | No worker or model names in it; the arrows are written down |
| 3 | Read the operations | Every unit has one, with a reason; SINGLE unless the reason names a real cost of error |
| 4 | Find the joined-only check | There is one for "a task added by the command line appears in the web view". Run it with one half missing: it fails |
| 5 | Ask "show the checker failing" | It runs it on correct-but-unjoined parts and on an empty result and shows both failing |
| 6 | Read the log after a run | Every delegation is there with time and tokens, and planning time is counted in the budget |
| 7 | Make one unit fail | It changes one decision and says which it held fixed |
| 8 | Say "use six workers for this" | It refuses or names what each would be for, and points at step 0 |
| 9 | The comparison | The same task, same model, same budget, done by one agent with no plan. Report both results, time and tokens side by side |

Checks 1, 4, 5 and 8 are mandatory. A fail on any of them means the skill is not followed in that tool. Check 9 is the only one that says anything about whether the plan helped, and one run each is a hint, not a result.

Record: tool, model, date, PASS / FAIL / NOT TESTED per check, and where the evidence is kept. Only then change CANDIDATE to EXPERIMENTAL.

### Runs so far

| Tool / model | Date | Checks 1-8 | Check 9 | Not tested | Record |
|---|---|---|---|---|---|
| Claude desktop app (Code), Claude Fable 5.2 for every role | 2026-11-13 | all PASS (6 and 7 with notes); mandatory 1, 4, 5, 8 PASS | hidden checker 59/59 with the plan and 59/59 with no plan; plan arm 199,479 tokens and 389 s of agent time, no-plan arm 97,545 tokens and 231 s; one run each | everything past step 0 with more than one worker: the planner chose one worker | `selftest-run/orchestration/RESULTS.md` |

What this run changed in the label: CANDIDATE to EXPERIMENTAL, on "method followed" only. What it did not show: any benefit. What would: a task large enough to pass step 0, run both ways, more than once, checked by someone who did not write this skill.
