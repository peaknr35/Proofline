# Sources - why the rules are here, and how far to trust them

Two labels, kept apart:

- **Evidence** says how well a source supports a claim: `UNREAD` (supports nothing) · `DESIGN_RATIONALE` (an argument, a design, or practitioners' reports; no controlled result) · `EMPIRICAL_EXTERNAL` (someone measured it, elsewhere) · `REPRODUCED_LOCAL` (measured on builds run with this kit).
- **Adoption** says what this kit does with it: `PROPOSED` · `EXPERIMENTAL` · `APPROVED` · `REJECTED` · `RETIRED`. Adoption of each rule is tracked in `PATTERNS-LOG.md`; the five heaviest rules have cards in `EVIDENCE-CARDS.md`.

Nothing in this kit is REPRODUCED_LOCAL yet. One build has been run with it (the Tasklet self-test, 2026-11-13, one run).

## Read

| Source | Read | Evidence it gives | What the kit took | Where |
|---|---|---|---|---|
| When Sub-Agents Work in Parallel (Li et al., Oct 2026), alphaxiv.org/abs/2610.10263 | pages 1-11, 17-18, online; PDF not in this folder | EMPIRICAL_EXTERNAL: 354 tasks, 3 coding agents, sub-agents on vs off, 2,124 runs, one run each | Delegating costs 1.4-3.3 times the tokens and is usually slower; it helps on long many-part work and hurts on small bounded tasks; it pays for complementary work, alternative attempts and independent checks; a Lead that launches a batch and waits misses failures | Rule 9; Step 1 Staff; card E-1 |
| An Empirical Study of Coordination Mode in From-Scratch Multi-Agent Coding, MSEval (Ren et al., Jul 2026), alphaxiv.org/abs/2607.27877 | pages 1, 4-6, 10-12, online; PDF not in this folder | EMPIRICAL_EXTERNAL: 10 team arrangements x 10 full-stack web projects, 3 models on the full grid, mostly one run per cell | No arrangement wins everywhere; owning a whole feature is the most balanced; a cut by layer breaks when a requirement crosses layers; acceptance tests first does well; heavy approval chains do worst; later repairs can break what worked | Step 1 "How to cut the units"; card E-2 |
| Decoupled Multi-Agent Orchestration, DeOrch (Wu, Lu, 2026; under review) | in full | EMPIRICAL_EXTERNAL, but on question-answering and planning tasks with small open models, not software builds | Split first, staff second; one worker per subtask keeps most of the gain (50.4 at 1.68 calls vs 51.5 at 5.35); change one decision at a time when something fails; try a new worker on a fixed probe set | Step 1; Phase 3; `KIT-SELFTEST.md` builder probe |
| WorkflowArena (Jiang et al., Nov 2026) | in full | EMPIRICAL_EXTERNAL, one run per task | Checks that unjoined parts cannot pass; test the checker on submissions that should fail; organizing time counts; workers start empty; who writes the plan matters (one strong model's plans helped weaker builders by 6.41 points, another's hurt two of four); the best set-up fully solved 36.95% of long tasks | Rule 8; Phase 1 joined-only checks; Phase 2; card E-3 |
| Interpretable Context Methodology (Van Clief, McDermott, 2026) | in full | DESIGN_RATIONALE: a method plus reports from 33 practitioners, self-reported, one model family, no controlled comparison | Five context layers; one stage one job; rules apart from working material; outputs a person can edit; people edit most at the first and last stage; a Verify section; stale dependents; fix the source when an edit repeats (proposed as future work); where the method stops | Context layers; Phase 1; Phase 2 stale work; Phase 5; card E-5 |
| From ICM Folder Methodology to an Advanced Agent Runtime (design note) | in full | DESIGN_RATIONALE: an architecture plan, not run | The model never decides its own authority; propose, approve and execute kept apart; approval tied to exact content; the validation ladder; a model is never the only judge; baseline comparison by test name; four memory tiers; packet manifest | Rules 4, 5, 8; validation ladder; Phase 3 baseline; Phase 5 tiers |
| Automated Multi-Agent Organization Design, AMOD (Xia et al., 2026) | in full | DESIGN_RATIONALE: a research program, no results | A role written as a responsibility (receives, owes, delivers, to whom, done when); an interface checker that reports and cannot edit; remove a role to see if it is missed; one failed run is not a rule; record the conditions a lesson held under | Phase 2 packets and seam check; Phase 5; card E-4 |
| Control Plane as a Tool (Kandasamy, 2025) | in full | DESIGN_RATIONALE: a pattern, no evaluation | One narrow interface with checks in and out and a record of calls; ask for a capability, not a vendor | Builder D prompt |
| Toward Super Agent System with Hybrid AI Routers (Yao et al., 2025) | first two thirds | DESIGN_RATIONALE: a position paper | Route by intent; send easy work to cheap models | Router template (already there); Step 1 |
| The Landscape of Emerging AI Agent Architectures (Masterman et al., 2024) | key-findings sections only | DESIGN_RATIONALE here: a survey of others' results, not checked against them | One clear lead; plan before doing; no free chatter between agents | Step 1 "No free conversation" |
| Building LLM Agents by Incorporating Insights from Computer Systems (Mi et al., 2025) | first half | DESIGN_RATIONALE: an analogy | Nothing new; it agrees with the context layers | - |

## Safety rules are not waiting on papers
Rules 1, 4, 5, 6, 7, 10 and 11 (no false claims, no self-granted authority, separate confirmation, data is not instructions, no invented facts, abstain, nothing promoted silently) are safety requirements. They are APPROVED on design reasons. No benchmark is needed to keep them and none read here argues against them.

## Findings that point against the kit
- MSEval found a cut by technical layer fragile. Through v2.3 the kit's default roles were a layer cut. v2.4 drops the fixed roles for whole-feature owners.
- Li et al. found concurrent runs at least 20% faster in 12.6% of tasks both modes solved. "One worker" is a default, not a ban.
- WorkflowArena's second strong model wrote plans that made weaker builders worse. The "strongest model plans" rule was removed in v2.4.
- The self-test's second builder was not needed.

## Deliberately not adopted
- Trained planners, learned routers and bandits: they need training data and infrastructure.
- A compiler, scheduler, policy engine and provenance graph: right for a product that runs unattended; too heavy for a build kit.
- A fixed "2,000-8,000 tokens per stage" target: reported as typical in one paper's own workspaces, not a tested optimum.
- Debate and large ensembles: where priced, several times the calls for about one point.
- "Rotation" and "competitive teams" (MSEval): they scored well on average there, but each multiplies cost and neither fits one owner per path.

## UNREAD (named in earlier chats; not in this folder; support nothing)
Named for the v2.5 contract rules (fixtures first, spec gate, ask or assume, closed surface), all from a pasted chat, none opened, not even checked to exist: The Specification Paradox (2608.16618) · Ask or Assume? (2603.26233) · SpecPath (2608.09799) · SpecFirst (2607.27167) · Spec-Driven Development for Agentic Software Engineering (2609.00252) · SWE-Gate (2609.04167). The v2.5 rules do not rest on them. They are correctness invariants kept on design reasons plus what the one Tasklet run showed (its open questions were contract gaps), and they are PROPOSED.

Earlier: Agentic Transaction (ACID-compliant agents) · More Agents, More Reliable? · Rethinking Multi-Agent Collaboration: When More Is Less · CORAL · Athanor · The Meta-Agent Challenge · Self-Improvements in Modern Agentic Systems · AgentEvolver · "Exploring Super-agent Design".
