# Proofline (v2.6 candidate) - portable kit

A model-independent method for turning an idea into a working, tested, packaged system, and for making each next project faster than the last. Plain text; nothing depends on one vendor.

It aims to cut rework. No speed multiplier is claimed: measure yours with the numbers in the final report.

## The name, and the four skills

Proofline was called Five-Agent Build through v2.4. The old name pointed at the agent count; the method's point is that nothing is called done without proof. The change notes below keep the old name where they describe old versions, and so do the records in `selftest-run/`.

| Skill | Was | Job | Status |
|---|---|---|---|
| `proofline-build` (this folder's `SKILL.md`) | `five-agent-build` | the full build method | v2.6 candidate, not yet re-run |
| `proofline-plan` (`skills/proofline-plan/`) | `workflow-orchestration` | decide whether work needs organizing, then split and staff it | experimental: followed once, no benefit shown |
| `proofline-audit` (`skills/proofline-audit/`) | `agent-team-audit` | test whether each agent in a team earns its place | written, not yet tried |
| `proofline-runtime` (`skills/proofline-runtime/`) | `agent-runtime-design` | design the software that enforces a workflow | written, not yet tried |

## Works with Shark Tank Proof

[Shark Tank Proof](https://github.com/peaknr35/shark-Tank-proof) tests whether a business is worth building; Proofline builds it. Its `/kill-or-build` ends with `founder/build-brief.md`, and `proofline-build` takes that file as its intake (`templates/FROM-SHARK-TANK-PROOF.md`).

| Shark Tank Proof says | Proofline builds |
|---|---|
| Incomplete, or Not yet | nothing |
| Unproven | only the small test asset the brief names: the thing a real person can pay, sign or book through |
| Profitable | version 1 of what the real buyer bought |

Both kits use the same four labels (MEASURED, THEY SAID IT, PLANNED, SIMULATED), so a fact keeps its label across the handoff. A simulated price becomes a setting, not a constant. Customer-facing words come only from claims the founder's ledger allows in public. At delivery, the final report lists what the product now does so the founder can log it. Built is not sold: only a real buyer changes the verdict.

Each kit works without the other. This join is written and not yet run on a real project.

## What changed in v2.6 (candidate: not yet run)

From reading [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype), the working code behind the "Exploring Super-agent Design" article. Ideas only, in this kit's own words; no code was copied.

- **Attention is the scarcest input** (rule 16). Speak only when a person must act or can use a result. Probe the environment instead of asking. Each question comes with a recommended answer and one sentence on why.
- **No secrets in chat** (rule 17). Sign-ins and keys go in one message of exact commands for the person's own terminal.
- **Stop by impact, not by effort** (rule 18). A change to an interface, a module's job or a product decision goes back to the contract and spends no repair. Size and failing tests are not reasons to stop.
- **One report status** in every handoff: progress, waiting, ready, blocked, failed or dropped. Ready means checks passed. A **Needs a person** field holds the one question.
- **Honest evidence.** Examples show format, never facts. A change users see needs a real Before and After.
- **The final report and STATE.md open with what needs a person**, and say "Nothing." when nothing does.
- **Copied templates record their base.**
- **A check for the kit itself** (`scripts/check-kit.mjs`): nine checks over the kit's own text, each shown failing on a broken copy. It caught this version's own drift the moment it happened.
- **Self-test check 20**: stop by impact.
- **`proofline-runtime`** gains record-first-act-second, a derived waiting state, the code-then-model admission check and observe mode, with the prototype as its worked example.

The prototype is a research build with tests and no evaluation, so every rule from it is design rationale, and the two places it disagrees with this kit are written down in `library/SOURCES.md`.

## What changed in v2.5 (candidate: not yet run; it replaces the v2.4 candidate, which was never run either)

The first self-test did not stall on how agents were organized. It stalled on three things the contract never said. v2.5 moves the effort there.

- **Fixtures first.** Examples before sentences: valid and invalid samples, one at, under and over every limit, an error table, and every rule pointing at the fixture that pins it.
- **Spec gate** (`templates/SPEC-GATE.md`). A reader who did not write the contract goes through it like a compiler. Each question is PINNED, N/A or OPEN. One OPEN and no builder starts.
- **Ask or assume.** Ask the person, once and in one batch, when the answer changes behavior, data, money, security or something hard to undo. The Lead decides the rest, in writing, shown at approval.
- **Closed surface and scrub.** The contract lists everything the product exposes. Builders build nothing else; QA compares what was built with the list; extras are removed or proposed.
- **Short briefs.** One paragraph is enough to start; soft words (smooth, safe, "when possible") become checks or non-goals.
- **Self-test grows from 16 to 19 checks**, with one new mandatory gate: no building on an open contract.

Evidence, plainly: these five are correctness rules kept on design reasons and one local run. The papers named for them have not been read. All PROPOSED.

## What changed in v2.4 (never run; folded into v2.5)

A smaller release. No new rules; three design changes and a shorter prompt.

- **Feature owners replace the fixed A-D builders.** Work is split into outcomes that can each be checked alone, preferably whole user-facing features. Content, engine, interface and model layer are capability notes added to a packet, not owners. A layer split needs a stable written boundary, fixtures that pin it down and a joined check. Shared foundations get one named owner and come first. One to four builders, by the work.
- **"Strongest model plans" is removed.** One known-capable model for every role is the baseline; another model takes a role only after a probe for that role. Routing is optional.
- **Self-test qualification has mandatory gates.** Every check is PASS, FAIL or NOT TESTED; six gates block qualification; the total is descriptive only. The 2026-11-13 run is recorded as 13 passed, 3 not tested: qualification incomplete.
- **Shorter compact prompt.**

Status changes only from observed results: v2.6 stays a candidate until Tasklet is re-run on it with all 20 checks exercised.

## What changed in v2.3

From the first end-to-end self-test (record in `KIT-SELFTEST.md`) and from two measured studies of multi-agent coding.

- **Evidence discipline**: every rule is a safety requirement, a correctness invariant or a performance hypothesis. Evidence strength and adoption status are two separate labels. Five evidence cards in `library/EVIDENCE-CARDS.md`; template in `templates/EVIDENCE-CARD.md`.
- **When to delegate**: one worker per unit by default; hand work off only for complementary work, an alternative attempt or an independent check, and only when it is worth the cost. In the study behind this, sub-agents used 1.4-3.3 times the tokens and were usually slower.
- **How to cut the work**: by feature when a requirement crosses layers; by layer only with a clean contract. (v2.4 goes further and drops the fixed roles.)
- **Claims softened to what the sources support**: "strongest model plans" is an untested bet; "three in a row" is a setting; a check that fails on a bad sample is shown able to fail, not shown complete.
- **Five fixes from the self-test**: the Lead updates product facts before QA; the router never points at a missing file; builders clean up after their tests; untrusted text is handled on every surface, not only HTML; builders list the rules no fixture pins down.
- **A plan for measuring the kit** against an earlier version, in `KIT-SELFTEST.md`.

## What changed in v2.2

Drawn from the nine papers in `library/` (what each gave and how strong its evidence is: `library/SOURCES.md`).

- **Split first, staff second**: break the work along its seams before deciding who does it; one worker per unit by default; REVIEW, SELECT and PARALLEL only where they pay. Every extra role must say what would break without it.
- **Joined-only checks**: every seam gets a check that correct-but-unjoined parts cannot pass.
- **Checks must be seen to fail** on a known-bad sample before they are trusted.
- **Seam check before integration**: interfaces as built are compared with the fixtures; the checker reports, it does not edit.
- **Baseline comparison** for upgrades and repairs, by test name, in code; a new failure blocks delivery.
- **Stale work**: a changed input voids approvals downstream; rework only what is stale.
- **Verify section** in every folder contract.
- **Fix the source, not the output**: the same correction three builds running becomes a proposed source change; patterns record the model and tool they were proven under.
- **Which model does what**: strongest on contract, packets and QA; cheaper on specified units; scripts for steps with no judgement.
- **Where the method stops**, said plainly.

## What changed in v2.1

- **ICM foundation for every delivered project**: right after the contract, the Lead scaffolds a router (`AGENTS.md`), a root `CONTEXT.md` with current state, one `CONTEXT.md` per folder, `_shared/` facts, rules and glossary, `_templates/` and a decisions log. Builders keep their folders' contracts accurate. Templates in `templates/icm/`.
- **Walk test** in QA: a fresh context must orient, route, change and report from the files alone, or the build is not delivered.
- **Evidence labels** for business claims (MEASURED, THEY SAID IT, PLANNED, SIMULATED) in the shared rules.

## What changed in v2

- **Capability check and four modes**, including WRITE-ONLY for tools that cannot run code, and SELF-REVIEW when QA cannot be a fresh context.
- **Sizing**: small projects use one builder, not four.
- **Golden fixtures** in the contract so builders cannot read a shared format two ways.
- **Plan with limits**: budgets, repair caps, when to stop and ask, what the tool enforces vs what is only an instruction.
- **Validation ladder**: cheapest checks first.
- **Abstain rule**: a stage missing inputs or evidence stops and says so.
- **Handoff template** with interpretations, faked-vs-live boundary and abstentions.
- **Evidence levels** in the final report.
- **Reuse library**: archetypes to start from and a patterns log where proven pieces are banked.
- **Intake form** and a **kit self-test**.

## Files

| File | Use |
|---|---|
| `SKILL.md` | The full method, in skill format |
| `UNIVERSAL-PROMPT.md` | Paste into any chat model as instructions or the first message |
| `COMPACT-PROMPT.txt` | About 1,230 characters (count it in your own tool), for short instruction boxes; a summary, not the whole method |
| `templates/INTAKE.md` | Fill in once to start a project without question rounds |
| `templates/FROM-SHARK-TANK-PROOF.md` | How to start from a Shark Tank Proof build brief, and what to hand back |
| `templates/SPEC-TEMPLATE.md` | The contract |
| `templates/SPEC-GATE.md` | The completeness check the contract must pass before anyone builds |
| `templates/PLAN-TEMPLATE.md` | Stages, owners, limits, stop conditions |
| `templates/AGENT-PROMPTS.md` | Lead, work-unit and foundation builders, capability notes, seam checker, critic, independent QA |
| `templates/HANDOFF-TEMPLATE.md` | What every role returns |
| `templates/FINAL-REPORT.md` | Delivery report with evidence levels |
| `templates/icm/` | The ICM foundation every project gets: router, root and folder contracts, shared facts/rules/glossary, decision record, walk test |
| `library/ARCHETYPES.md` | Five starting shapes for common project types |
| `library/PATTERNS-LOG.md` | Register of reusable patterns: proposed → tested → approved |
| `library/SOURCES.md` | The papers behind the rules, how much of each was read, what each gave, and how strong its evidence is |
| `library/EVIDENCE-CARDS.md` | Evidence cards for the five rules that carry the most weight, and what to test first |
| `templates/EVIDENCE-CARD.md` | Blank card for any rule that claims to make builds faster |
| `library/*.pdf` | The papers themselves. Not in the repository (other people's copyright); get them from the links in `library/SOURCES.md` |
| `scripts/check-kit.mjs` | Checks the kit's own text: one version everywhere, counts that agree, links that resolve, every rule classified, core rules in every prompt form. `node scripts/check-kit.mjs`; `node --test scripts/check-kit.test.mjs` proves each check can fail |
| `skills/` | The three companion skills: `proofline-plan`, `proofline-audit`, `proofline-runtime` |
| `selftest-run/` | Records of the two self-test runs, kept as they were made |
| `KIT-SELFTEST.md` | A 20-point test to run once per tool, plus a short probe for builder-only models |

## Loading it

- **Tools with skill folders:** add this folder as a skill.
- **Coding agents with a project instruction file:** point that file at `SKILL.md`, or copy its body in. Keep the kit separate from each project's `SPEC.md`.
- **Chat assistants with custom instructions:** paste `UNIVERSAL-PROMPT.md`; attach `SKILL.md` and the templates as files if the tool allows.
- **Short instruction boxes:** `COMPACT-PROMPT.txt`, with the templates pasted when each phase needs them.

Where each product keeps its instructions changes over time; look for "custom instructions", "system prompt", "rules", "knowledge" or "skills".

## One role per chat (no sub-agents)

1. Lead chat: intake → SPEC.md with fixtures and folder map → spec gate in a NEW chat (SPEC, fixtures and `templates/SPEC-GATE.md` only) → close every OPEN line → your approval → ICM scaffold (router, CONTEXT.md files, `_shared/`) → plan.
2. Foundation first if there is one. Then one chat per work unit you actually hand out: SPEC + plan row + builder prompt + the capability notes that unit touches + handoff template.
3. Collect files and handoffs. Seam check in the Lead chat (paste each "Interfaces as built" table); send repairs back; then integrate.
4. A NEW chat for QA: SPEC, integrated files, run instructions, handoffs. Not the builders' reasoning. It also runs the walk test from the files alone.
5. Repairs go back to the owner's chat; QA checks again.
6. Lead chat writes the final report and proposes reuse candidates.

A chat that cannot run code can review and write tests, but cannot establish that anything runs.

## Suggested project layout

```
project/
  AGENTS.md  CLAUDE.md      router + one-line pointer (Layer 0)
  CONTEXT.md                current state + what to load and skip per task (Layer 1)
  SPEC.md                   the approved contract
  _shared/                  product-facts.md, rules.md, glossary.md
  _templates/               decision.md + anything copied per run
  contract/fixtures/        valid and invalid examples of shared shapes
  <code>/  tests/  ops/     each with its own CONTEXT.md (Layer 2)
  planning/                 specs/, decisions/, audits/
  build/                    PLAN.md, STATE.md, handoffs/, evidence/ (the build record)
  docs/
```

Full shape and rules: `templates/icm/README.md`. `build/STATE.md` is a checkpoint during the build; after delivery the root `CONTEXT.md` holds current state.

## Starting

"Use proofline." then the filled-in intake. For an upgrade: "Use proofline to upgrade this repository. Keep: ... Change: ... Existing SPEC and test results: ..."

## Limits to keep in mind

- Instructions do not enforce permissions; only the host tool can.
- Separate workspaces prevent collisions; they are not a security boundary.
- Version control does not undo external actions.
- Passing unit tests does not prove the journey works.
- A typed confirmation is not proof of who typed it.
- Independent QA needs a context that did not build the thing.
- Most rules about speed rest on other people's measurements or on design arguments, not on builds run with this kit. `library/SOURCES.md` and `library/PATTERNS-LOG.md` say which is which.
- `selftest-run/` is the record of the self-test build. Leave it out when you install the kit as a skill.
- It is not enough alone for agents talking live to each other, many users at once, or branching with no person in between.
- The method was drawn from two real builds in one agent environment. v2.2 was run end to end once, on one small project, in one tool, graded mostly by the Lead itself: 13 checks passed and 3 were not tested, two of them mandatory gates, so qualification is incomplete. v2.3 to the v2.6 candidate change what that run found and have not been re-run. v2.6 was then run end to end on Tasklet (2026-11-15) and graded by a fresh evaluator: 19 of 20 checks passed, but the mandatory repair-limit gate failed, so the kit does not yet qualify as Lead (record: `selftest-run/tasklet-v2.6/GRADES.md`). The run also showed the spec gate does not converge. Nothing here has been compared against another way of working, so no speed claim is made. Run `KIT-SELFTEST.md` in your own tool before relying on it.
