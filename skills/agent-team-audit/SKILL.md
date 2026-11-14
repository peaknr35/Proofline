---
name: agent-team-audit
description: Find out whether each agent in a multi-agent setup earns its place - write every role as a responsibility that can be checked, read a real run for missing, duplicated and useless work, then test each role by removing it, swapping it for a generic one, or giving it to someone else under the same budget. Use when the user says "do I need this many agents", "audit my agent team", "which agent is dead weight", "why does my multi-agent setup keep failing at the handoff", "design the roles for my agents", or wants to know if one agent would do. Ends in a keep / merge / drop decision per role with the evidence, not an opinion.
---

# Agent Team Audit

More agents is not better. A role is worth keeping only if the work gets measurably worse without it, compared with fair alternatives that had the same budget. This skill finds that out.

It starts from one admission: a team that succeeds may be carrying a passenger, and a team that fails may just have a weak model. Looking at the final score cannot tell these apart. Changing one thing at a time can.

## The four parts of any team

| Part | The question |
|---|---|
| Who | how many agents, of what kind, same or different |
| Who does what | each responsibility and who holds it |
| How they connect | who can pass work to whom (hub, chain, tree, everyone, a few) |
| How decisions are made | one decides, a vote, review and approve |

The same wiring can carry completely different responsibilities. So the wiring diagram is not the design. **The responsibilities are.**

One is a valid team size. Always leave room for the answer "this does not need a team".

## Step 1 - Write each role as a responsibility

A label like "Planner" or "Reviewer" is not a responsibility. Write five things for each:

| Field | Question |
|---|---|
| Receives | what information or files come in |
| Owes | the work it alone must do |
| Delivers | the thing it hands over |
| To whom | who uses that thing next |
| Done when | the condition that ends its job |

Example, an interface checker in a software build: receives both components and the interface each expects · owes a comparison of every shared interface · delivers a list of mismatches and required repairs · to the agents who will join the parts · done when every shared interface has been compared. Not done when "another feature is produced".

Written this way, a responsibility can be checked, moved to another agent, or removed, without touching the rest.

If a role cannot be written in these five fields, that is the first finding.

## Step 2 - Set the fair comparisons before running anything

A team must beat these, at the same budget, or it has not shown anything:

- one strong agent working alone
- one agent given the same responsibility write-ups and the same order of work
- the same budget spent on simply trying several times and keeping the best

Two rules for the scoring itself:

- **Judge the joined result, not the pieces.** Score the one integrated deliverable. Include at least one check that parts which are each correct but were never reconciled cannot pass, and try the checker on such a sample first. A team scored piece by piece always looks better than it is.
- **Organizing spends the same budget as working.** Planning, handing off, waiting and joining all count against the team's cap. A single agent pays none of that, and the comparison must show it.

Fix for every comparison: the model, the tools, what each agent may see, the starting state, and a cap on calls and tokens. Report calls, tokens, attempts and time for each. Time is a result, not something to equalise. If you spent runs designing or choosing the team, that spend counts too, including the ideas you threw away.

## Step 3 - Run it and keep the trace

Keep everything a run produces: outputs, messages between agents, tool calls, files made, feedback from the environment. The final score alone will not show where the work went.

## Step 4 - Read the trace for three things

| Finding | What it looks like in the trace |
|---|---|
| **Missing** responsibility | each part passes its own checks and the joined result fails; a handoff stalls waiting for something nobody owns |
| **Duplicated** responsibility | two agents do the same check or produce the same thing |
| **Ineffective** responsibility | its output is never used by anyone downstream; its checks never change a result |

Signals worth listing: checks that failed, files nobody read, repeated work, blocked handoffs.

## Step 5 - Propose one change, with its evidence

One change at a time: add, remove or reassign one responsibility, and name the trace evidence that justifies it.

Prefer giving a new responsibility to an agent you already have. A missing function does not automatically mean a new agent.

Classic case: two agents each pass their own tests, the merged result fails on an interface they assumed differently. The change is an interface-checking responsibility before joining, assigned to an existing agent. Team size does not grow.

## Step 6 - Test the change three ways

Rerun from the same starting state, same feedback, same budget cap:

| Test | Do this | It tells you |
|---|---|---|
| **Remove** | run without the responsibility | whether the function matters at all |
| **Make generic** | replace the careful write-up with a plain role ("a reviewer") | whether the explicit write-up adds anything |
| **Reassign** | give it to a different agent | whether the holder was the right one |

Budget freed by removing a role may be given to the others or spent on extra attempts. That is the fair version of the comparison.

Read the results carefully. These are the ways to fool yourself:

- **Someone else quietly did it.** If the function was removed and another agent picked it up, you have not shown it is unnecessary. Check the trace.
- **The generic role did the same checks.** Then it was a substitute, not proof that checking is pointless.
- **Worse after reassigning.** That may be a poor match between agent and job, not a bad job.
- **Fails everywhere it is tried.** If the replacement agent fails under every assignment, the limit is the model's ability, not the organisation.
- **You had to change the wiring or the decision rule to remove it.** Then you tested two changes at once and cannot credit either.
- **A good plan mistaken for a good team, or the reverse.** The result mixes how well the work was organised with how able the workers are. To separate them, keep the workers fixed and change only who wrote the plan and the instructions. In one benchmark this changed weaker workers' scores by several points in either direction: one strong model's plans helped every worker, another's made two of four worse.
- **Being good at the task is not being good at organising it.** Do not make an agent the coordinator because it scores best alone. Test it in that role.
- **One run each.** Run the same cases several times and compare pair by pair. A single run is a hint.

## Step 7 - Decide

Per responsibility: **keep**, **merge** with another, **drop**, or **no coordination needed here**. A simpler team, or one agent, is a legitimate result. State the conditions the decision holds under: this task, these agents, these alternatives. It is not a general truth.

Stop searching when the budget is spent or no tested change improves the result.

## Step 8 - Who may, not only who should

For anything that touches shared state, separate three questions: who should do it, who is allowed to, and who must check or approve it. A checker can demand a repair without having the right to edit the shared code. Approval and doing stay separate responsibilities.

## Step 9 - Keep the lesson in a reusable form

Record: the task conditions, the responsibility write-up, what each test showed, and the budget.

State the lesson as **which assumptions need to be checked together**, not as a role name. "Shared interfaces must be compared before joining" travels to the next project. "We need an Interface Agent" does not; in travel planning the same lesson is "time and budget limits must be checked across transport and lodging".

- One failed run is not a rule.
- When the model, the tools or the team change, a kept lesson is unproven again until rechecked.
- Conflicting or outdated cases get revised, not stacked.

## When not to organise at all

For work whose pieces barely depend on each other, coordination costs more than specialising saves. Knowing when not to build a team matters as much as building a better one.

## What to hand back

A short report:

1. The team as found: the four parts, and each responsibility in five fields (or "could not be written").
2. The fair comparisons and the budget they shared.
3. Findings from the trace: missing, duplicated, ineffective, each with where it shows.
4. Each change proposed and its three test results, with calls, tokens, attempts and time.
5. The decision per responsibility and the conditions it holds under.
6. What was **not** tested, and what was run only once.
7. The lessons, as assumptions to check together.

If the user cannot run anything, do steps 1, 2 and 4 on paper from their description or logs, mark every test `NOT RUN`, and give them the exact runs that would settle each open question. Do not present a paper audit as a result.

Ask the user only for what you need: the roles as they stand, one real run's trace or logs, the budget, and what "better" means for this task.

## Where this comes from, and how far to trust it

This follows "Automated Multi-Agent Organization Design" (Xia et al., 2026). That paper is a research program: it proposes the method and the tests, and reports no results. So this skill is a careful way to look, not a proven recipe. The fair-comparison rule rests on work that paper cites (single strong agents and repeated attempts often match teams at equal cost); those papers were not read for this skill. The two scoring rules in step 2 and the plan-versus-worker check in step 6 follow WorkflowArena (Jiang et al., 2026), which did measure them: 145 long tasks, but one run per task, and the plan-versus-worker experiment used 32 tasks and two plan authors. Whatever an audit finds is true for the task, agents and alternatives it tested, and no further.
