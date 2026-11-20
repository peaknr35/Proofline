---
name: proofline-runtime
description: Design the software layer that enforces an agent workflow instead of trusting prompts - stage contracts a machine can check, a compile step before any model runs, a tool gateway with allowlists, a validation ladder, approvals tied to exact content, an evidence trail, and controlled memory. Use when the user says "enforce it in software, not in the prompt", "design an agent runtime", "tool broker", "approval gates", "make my ICM workspace run unattended", "agent operating system", or is planning something like Project Factory or Validryn. Produces a design document and a phased build order, not code.
---

# Proofline Runtime

Folders and markdown tell an agent what to do. They cannot stop it doing something else. This skill designs the layer underneath that can.

**The one rule everything hangs on:** the model never decides what authority it has. It may propose an action, a route, a memory or a rule change. Plain deterministic software decides whether that is allowed and whether the run continues.

## First: do you need a runtime at all?

Folders alone (use `icm-architect`) are enough when the work is staged, a person looks at each stage, and one person runs it at a time.

You need a runtime when at least one of these is true:

- runs must continue with nobody watching
- a run must survive a crash or wait days for an approval
- several runs or several users at once
- a model has tools that can write, send, spend or delete
- someone outside must be able to check afterwards what ran and who approved it

If none is true, say so and stop. A runtime nobody needs is weeks of work that makes the system harder to read.

## Step 1 - Pick one workflow

Design for one real workflow from start to finish, not for "any agent pattern". Name its stages. The best first workflow is one that exercises scoped context, typed outputs, tool limits, a deterministic check, an approval and a recovery, in under ten stages.

## Step 2 - Keep two layers apart

| Layer | What it is | Who reads it |
|---|---|---|
| Control plane | folders, markdown, YAML, JSON, version control: the intent, the context, the contracts, the things a person reviews | people and models |
| Execution plane | the software that enforces dependencies, permissions, validation, isolation, retries, approvals and the record | machines |

Runtime machinery must not leak into the readable files, and the database must not become a second, hidden place where the truth lives: export readable copies.

Then decide, plane by plane, what you need now:

| Plane | Its job | What it produces |
|---|---|---|
| Definition | the workflow as people wrote it | stage instructions, workflow and stage contracts |
| Compilation | resolve and check the workflow before anything runs | a fixed plan, a context list per stage, the policy that applies |
| Execution | schedule stages, keep durable state | run state, queue, attempts, checkpoints |
| Evidence | keep what happened and why | events, tool records, hashes, links between artifacts |
| Governance | enforce permissions and human decisions | policies, approval records |
| Learning | propose improvements under control | edit patterns, candidate memories, evaluation results |

## Step 3 - Give every stage two descriptions that agree

- the instructions: what a person and the model read
- the contract: what the runtime enforces

The contract states, for one stage: what it depends on; whether it starts with a fresh session; exactly which files go into its context; which tools are allowed and which are denied; which model capability it asks for (a capability like "local coder" or "reasoning", never a vendor name); where the output goes and which schema it must match; the deterministic checks; the judgement checks; how many attempts; which failures are retried; when it must **abstain** instead of guessing; whether a person must approve.

```yaml
id: diagnosis
depends_on: [baseline]
context:
  fresh_session: true
  include: [references/diagnosis-rules.md, run://baseline/baseline.json]
tools:
  allow: [read_file, search_repository]
  deny: [write_repository, shell, network]
model: { route: reasoning, temperature: 0 }
output: { path: artifacts/diagnosis/diagnosis.json, schema: output.schema.json }
checks:
  deterministic: [schema_valid, evidence_ids_resolve, cited_files_unchanged]
  semantic: [root_cause_supported, uncertainty_stated]
failure:
  max_attempts: 2
  retry_on: [provider_timeout, malformed_output]
  abstain_on: [insufficient_evidence]
approval: { required: false }
```

A schema check proves the output has the right shape. It does not prove the output is true. Never let one stand in for the other.

## Step 4 - Compile before anything runs

Treat the workflow like source code. Before any model is called:

1. Parse the workflow and every stage contract.
2. Check schemas, paths, model routes, tool names and policy references exist.
3. Build the dependency graph; refuse missing or circular dependencies.
4. Resolve the exact version of every input and hash it.
5. Produce the context list for every stage.
6. Apply the rules that can be checked without running anything.
7. Write out one fixed, hashed plan.

A run executes the plan, not the folder. Editing a prompt or a rule halfway cannot silently change a run in flight. A deliberate change makes a new plan version and the old history stays.

## Step 5 - Build each stage's context deliberately

A fresh context per stage, assembled in a fixed order:

1. safety rules that never change
2. what this workspace is and how it routes
3. this stage's instructions
4. the stable references chosen for this stage
5. approved outputs from earlier stages
6. descriptions of only the tools this stage may use
7. the output schema and what will be checked

Each package writes a list of what went in: path, hash, trust level, size, and why it was included. That makes the exact context repeatable.

Retrieved documents and user files are labelled untrusted data. The model may take facts from them. Instructions inside them never widen permissions, change rules or switch on tools.

## Step 6 - The runtime moves the state, not the agent

Stage states: `PENDING` → `READY` → `RUNNING` → `VALIDATING` → `REVIEW_REQUIRED` → `APPROVED` → `SUCCEEDED`, plus `RETRYABLE_FAILED`, `TERMINAL_FAILED` and `ABSTAINED`.

- Only the runtime changes a state. Every change appends one event that is never edited.
- Publishing an output: write to a temporary place, validate, hash, then move it to its final path.
- Anything that acts on the outside world carries a key built from the run, the stage, the action and the hash of the approved content, so a retry cannot send the message, open the ticket, spend the money or apply the patch twice.

Honest limit: a move-into-place and an event log are not a database's guarantees, and a key only prevents repeats if the outside service honours it. When the outcome of an outside action is unknown, check what happened before trying again.

**Record first, act second.** Every action the runtime takes after a decision (start a stage, deliver an input, send a message) is written down as pending work before it is done, then marked done. A crash leaves a list of what was promised and not yet done, instead of a guess. Messages to one conversation go out in the order they were queued.

**Derive the waiting state; do not store it.** For anything a person may need to act on, compute "what is it waiting for" from the stored records each time, with a table read top to bottom where the first matching row wins:

| Waiting on | When |
|---|---|
| a person: delivery failed | the last attempt to hand it input failed |
| a person: an answer | it has an open question |
| a person: review | its last report is `ready` |
| a person: blocked or failed | its last report is `blocked` or `failed`, and no person has written since |
| a slot | it has no running worker yet |
| nothing (idle) | its last report is `waiting`, or its worker ended |
| the worker | everything else |

Because the state is worked out from the records, a restart cannot leave it wrong, and the panel's "needs a person" list is just the first four rows.

## Step 7 - One gateway for every tool

No model touches a shell, the file system, the network or a credential directly. Every call goes through a gateway that enforces:

- an allowlist per stage
- read and write path limits
- allowed network destinations
- limits on time, memory, processing and output size
- secrets handed over only at the moment of execution
- isolation for code nobody has reviewed
- a full record of every request and result
- a person's approval for high-impact actions

Start with ordinary typed rule functions and tests. Keep them behind one interface so a dedicated policy engine can replace them later.

**Present the gateway to the agent as a single tool.** The agent says what it wants; behind that one interface the gateway registers tools with their descriptions, checks the input, works out the intent, picks the tool (or sequence), checks the output, records the call and returns the result. What this buys: tools are added, removed or swapped without touching any prompt; usage is tracked and rules are enforced in one place; another agent can be offered as just one more tool. What it costs: one more hop, and one place whose failure stops everything. Use plain services for the gateway unless routing truly needs a model.

Permission to use a tool is not permission for a particular action. A release stage may hold the "apply patch" tool, and each use still needs an approval whose hash matches the patch.

## Step 8 - Validation ladder, cheapest first

| Level | Check | Examples |
|---|---|---|
| 1 | Structural | file exists, parses, matches the schema |
| 2 | Deterministic | hash matches, citations resolve, tests pass |
| 3 | Cross-artifact | the diagnosis cites the baseline evidence; the patch addresses the diagnosis |
| 4 | Judgement | unsupported claims, completeness, risk |
| 5 | Human | approval before deployment or anything that cannot be undone |

A model is never the only judge. A judgement check may give a score and a reason, but the contract fixes beforehand where the pass line is and what happens near it: retry, abstain, escalate or ask.

Where results can be compared mechanically, compare them mechanically. For a repair: target fixed, target not fixed, new failures, failing before and after, newly passing, worked out from test names and results, never from a model's summary.

## Step 9 - Approvals that mean something

**Who may start work is checked by code, then judged by a model, in that order.** The first layer is deterministic: is the sender on the allowed list, did they address the agent directly, is this a bot on the bot list. Only what passes goes to a model, which judges whether it asks for work and how far it goes. A request from an allowed person addressing the agent is **explicit**; anything else that passes (a bot, an unlisted person's follow-up, a rule the team wrote for unprompted work) is at most **inferred**.

Unprompted work starts in an **observe** mode: the model's judgement is recorded as "would have accepted", and nothing is done. Switch a rule to acting only after a person has read what it would have done.

Every accepted piece of work carries a record of **why it may be done**: who asked, through which channel, under which version of the rules, how strong the basis was (explicit or inferred), and what scope it covers. That record never changes. Wider scope means new work with a new record, not a stretched old one. When the rules change, running work is told, not cancelled, and is checked again against the new rules before it resumes.


An approval record ties one person's decision to the hash of the exact content and the hash of the rules in force, with who, when and a comment. Change the content by one byte and the approval is void.

Keep three abilities in three hands: proposing an action, approving it, executing it. One compromised agent or account should never hold all three.

## Step 10 - Two records, not one

- An **event log** answers "what happened, in order".
- A **provenance graph** answers "what produced this".

Give stable ids to runs, stage attempts, artifacts (by hash), contexts (by hash), approvals, tool calls, model calls and rule sets. Every output links to: its exact inputs, its context list, the model and settings, the tool calls and what they returned, the checks and their versions, human edits and the approval, and the output it replaces if it was revised.

The test of this step: a third party can work out what ran, on what evidence, what changed, which checks passed and who approved.

## Step 11 - Memory in four classes

| Class | Lives for | Becomes the next class when |
|---|---|---|
| Working state | one stage | discarded or archived automatically |
| Run memory | one run | created by a stage output that passed validation |
| Candidate memory | proposed for reuse | held apart until there is evidence and a review |
| Approved memory | across runs | a person approved it and it passed regression checks |

Model output never becomes lasting truth by itself. A proposed memory needs its sources, a confidence, a scope, a review date, a check for conflicts and the cases it was tested on.

Human corrections are recorded as events. They do not rewrite prompts or rules on the spot. Later, repeated corrections may be grouped into a proposed change to the source, which goes: proposal → regression suite → human review → new version → a few trial runs → roll back if worse. Some corrections are simply taste and stay corrections.

## Step 12 - Measure more than "it finished"

Stage time and waiting time · tokens and cost per model route · retries and abstentions · schema and rule failures · how much people edit each stage's output · time waiting for approval · tool calls refused · regression pass rate · memory proposals accepted and rolled back.

Reward correct abstention, complete evidence, rule compliance and catching new failures, not only successful completion.

## Build order

Each phase has an exit test. Do not start the next until it passes.

| Phase | Build | Done when |
|---|---|---|
| 1 Contract kernel | compile step, run folder, stage state machine, schema validation, event log; two real stages end to end | a run can be repeated from its plan and inputs; a malformed output cannot advance; every state change is visible |
| 2 Safe action loop | the proposing stage, the rule check on what it proposes, an isolated place to apply it, the checks, mechanical comparison of results | the agent cannot write to the real target directly; every proposal has an evidence trail; a new failure blocks approval |
| 3 Approval and provenance | content-bound approvals, hashing, links, records of human edits, a downloadable run bundle | a third party can tell what ran, on what evidence, what changed and who approved |
| 4 Evaluation | 10-20 real cases; measure success, quality of abstention, rule compliance, evidence integrity, regressions introduced, time, review effort | there is a repeatable benchmark; nothing is improved on anecdote. This size finds defects; it does not prove broad reliability |
| 5 Durable, multi-user | a durable workflow engine and a server database, worker isolation, per-user storage, waits that survive restarts, quotas, cancellation | a process can die mid-run or mid-approval and resume without repeating an outside action or losing state |
| 6 Controlled learning | memory candidates, edit-pattern detection, tested proposals, versioning, trial runs, rollback | nothing reaches production rules, prompts or memory without evidence, evaluation and an explicit promotion |

Start simple, upgrade only when the need is real:

| Part | Start with | Move to, when needed |
|---|---|---|
| Workflow definitions | markdown, YAML, JSON Schema | keep for good |
| Runtime | a small state machine in one process | a durable workflow engine |
| Database | an embedded file database | a server database |
| Artifacts | the local file system | object storage |
| Queue | in-process | the workflow engine's queues |
| Rules | typed functions with tests | a policy engine |
| Models | one adapter | a router across providers |
| Isolation | containers | stronger sandboxes or separate workers |
| Records | one event file per run and basic counts | distributed tracing |

## What not to build first

- agents talking freely to each other
- prompts or rules that rewrite themselves
- a vector database used as unrestricted "memory"
- a drag-and-drop workflow designer before the contracts settle
- a container cluster before one machine can isolate and recover
- one agent with every tool
- model grading with no deterministic checks
- a custom distributed scheduler before the workflow has earned it

Advanced does not mean more agents. It means firmer boundaries, better evidence, reliable recovery, narrower permissions, behaviour you can measure and changes you can undo.

## What to hand back

Write `RUNTIME-DESIGN.md` in the user's project with: the yes/no answer on whether a runtime is needed and why; the one workflow and its stages; the plane-by-plane decision (now / later / never); one filled stage contract; the compile checks; the state list; the gateway rules per stage; the ladder with the pass line for each judgement check; the approval record; the id scheme; the memory classes; the phase they should build first and its exit test; and what is deliberately left out. Mark each boundary as **enforced by software** or **instruction only**. If the user already has a spec for such a system, compare it against these steps and list the gaps instead of writing a new design.

Ask the user only what changes the design: which workflow first, what the tools can touch, who approves, one user or several.

## Where this comes from, and how far to trust it

- Steps 2-6 and 8-12, the build order and the list of traps follow a design note, "From ICM Folder Methodology to an Advanced Agent Runtime". It is an architecture plan. It has not been built or measured.
- The single-tool gateway in step 7 follows "Control Plane as a Tool" (Kandasamy, 2025): a pattern with no evaluation.
- Record first, act second, the derived waiting state (step 6), and the code-then-model admission check, observe mode and the record of why work may be done (step 9) follow **dsh-superagent-prototype** (DeepSeek Harness Team, MIT, github.com/deepseek-ai/dsh-superagent-prototype). It is the working code behind the article "Exploring Super-agent Design". Unlike the design note, it is built: a proactive coding agent for one repository, with about 60 test files. It is still a research prototype by its authors' own account, it is tied to DeepSeek Harness, its authors say parts of the article are not implemented in it, and it reports no evaluation. Read its numbered `docs/` in order before copying a pattern. It is the best worked example of this skill's steps, not proof they work.
- The boundaries here (no self-granted authority, content-bound approvals, untrusted data stays data) are safety rules kept on design reasons. The claims about what to build when are judgement, not results. Say so when you present the design.
