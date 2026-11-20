# Evidence cards - the five rules that carry the most weight

Format: `templates/EVIDENCE-CARD.md`, shortened. Sources are listed in `SOURCES.md`. "Local" means measured on a build run with this kit. So far there is exactly one such build (the Tasklet self-test, 2026-11-13, one run), so nothing here is REPRODUCED_LOCAL.

## E-1 Worker count: one worker per unit; delegate only for three reasons
- **Type:** performance hypothesis.
- **Rule:** SKILL rule 9 and Step 1 "Staff".
- **Sources read:** *When Sub-Agents Work in Parallel* (Li et al., Oct 2026), pages 1-11 and 17-18 read. *Decoupled Multi-Agent Orchestration* (Wu, Lu, 2026), read in full.
- **What they establish:** Li et al.: 354 tasks, three coding agents, sub-agents switched on or off, 2,124 runs, one run per setting. Full-task success changed by between minus 11.9 and plus 2.3 points; tokens rose 1.41 to 3.31 times; mean runtime rose in 14 of 15 agent-benchmark pairs. Gains appeared on long, many-part tasks; small bounded tasks got worse for two of three agents. Where it helped, sub-agents did complementary parts, tried an alternative, or checked the main agent's work. Wu and Lu: on question-answering and planning benchmarks with small open models, a learned split with one worker per subtask scored 50.4 at 1.68 calls against 51.5 at 5.35 calls for the full system.
- **What they do not establish:** anything about a Lead that plans from a written contract with fixtures, as this kit does. Li et al. tested agents deciding by themselves when to spawn. Wu and Lu did not test software builds.
- **Pointing the other way:** Li et al. also found concurrent runs finished at least 20% faster in 12.6% of tasks both modes solved, so "never parallel" is wrong too.
- **Evidence:** EMPIRICAL_EXTERNAL. **Adoption:** APPROVED as the default (it is the cheaper, safer default), with the three exceptions EXPERIMENTAL.
- **Local:** Tasklet used two builders in parallel. Both units passed first time. The second builder was not needed (Lead's judgement, no comparison run). No measurement.
- **Test next:** same small project, one builder doing both units in order vs two in parallel; same model; compare time to verified delivery, tokens, defects found by QA.

## E-2 Splitting: cut by seams first; by feature when a requirement crosses layers
- **Type:** performance hypothesis.
- **Rule:** SKILL Step 1 "Split" and "How to cut the units".
- **Sources read:** *An Empirical Study of Coordination Mode ... in From-Scratch Multi-Agent Coding*, MSEval (Ren et al., Jul 2026), pages 1, 4-6, 10-12 read. Wu and Lu (above).
- **What they establish:** MSEval: 10 ways of organizing a four-agent team on 10 full-stack web projects, three models on the full grid, up to three repair rounds, graded by an automated checker against the running app. No way of organizing won everywhere; averages ran from 73.5 to 83.3, but within one project the spread reached 30 points and more. Giving one agent a whole user-facing feature was the most balanced and won the hardest project. Splitting by technical layer won only where the contract between layers was clean and gave the lowest score in the grid where one requirement crossed layers. Writing acceptance tests first tied for the best average. Heavy review-and-approve arrangements were weakest.
- **What they do not establish:** that any cut is best for non-web work, or for teams of other sizes. Mostly one run per cell. The grader is partly a model.
- **Pointing the other way:** through v2.3 this kit's default roles (content, engine, interface, model layer) were a cut by layer, the arrangement MSEval found fragile. v2.4 removes the fixed roles: whole-feature owners are the default and those four are capability notes.
- **Evidence:** EMPIRICAL_EXTERNAL. **Adoption:** EXPERIMENTAL.
- **Local:** Tasklet was cut at its one seam (the data file), which was also a layer cut with a clean contract. It worked; the one mismatch found was at that seam. One run, no comparison.
- **Test next:** one project where a requirement crosses screen, API and storage, built once cut by layer and once cut by feature.

## E-3 Model routing: one baseline model; another model per role only after a probe
- **Type:** performance hypothesis.
- **Rule:** SKILL Step 1 "Models". History: v2.2 and v2.3 said "strongest model on contract, packets and QA". That rule was REJECTED in v2.4 because nothing read supports it as written.
- **Source read:** *WorkflowArena* (Jiang et al., Nov 2026), read in full.
- **What it establishes:** on a 32-task subset, with weaker models doing all the work, plans written by one strong model raised their scores by 6.41 points on average; plans written by another strong model lowered two of the four. One run per task. So who writes the plan matters, and "strong" does not predict which way.
- **What it does not establish:** any routing policy for a contract-first build, anything about QA by a stronger model, or anything about cost.
- **Evidence:** DESIGN_RATIONALE for the rule as now written (it is the cautious default: change nothing until a probe says so). **Adoption:** PROPOSED.
- **Local:** Tasklet used one model for every role, which is the baseline this rule describes. No routing was tried.
- **Test next, one assignment at a time:** (a) same contract, builders and evaluator; change only the model that writes the contract and packets. (b) same packets and evaluator; change only the builder model. Comparing an all-strong team with a mixed team tests the whole set-up and cannot say which role made the difference.

## E-4 Seam check before integration
- **Type:** correctness invariant (it finds mismatches) and performance hypothesis (it finds them more cheaply than QA).
- **Rule:** SKILL Phase 2 "Seam check before joining".
- **Sources read:** *Automated Multi-Agent Organization Design* (Xia et al., 2026), read in full: a proposal with no results that describes an interface-checking responsibility. Li et al. (above) list shared-state and merge problems and lost interface agreements among the ways concurrent runs fail.
- **What they do not establish:** that a separate check before joining saves time or catches more than fixtures and joined tests already do.
- **Evidence:** DESIGN_RATIONALE. **Adoption:** EXPERIMENTAL.
- **Local (one run, Tasklet):** the check found one real mismatch (the two parts counted a 200-character limit differently) from the two handoffs alone, before anything was run; fresh QA later reproduced it. It was found only because both builders had listed the rules no fixture pinned down. The planted mismatch was caught earlier still, by the builder. One case; no run without the check to compare against.
- **Test next:** plant the same mismatch in two runs, one with the seam check and one without; record where it is caught and the time lost.

## E-5 Learning from corrections: fix the source after repeated edits
- **Type:** performance hypothesis.
- **Rule:** SKILL Phase 5 "Fix the source, not the output".
- **Source read:** *Interpretable Context Methodology* (Van Clief, McDermott, 2026), read in full. Section 6.3 argues for it and suggests "three runs in a row" as an example. It is described as future work, not built or measured.
- **What it does not establish:** that the idea works, or that three is the right number.
- **Evidence:** DESIGN_RATIONALE. **Adoption:** PROPOSED. The number three is a setting.
- **Local:** none; it needs several builds of the same kind.
- **Test next:** keep a log of owner corrections across the next five builds; see whether any correction repeats, and whether a source change makes it stop.

## What to test first
E-1's exceptions add the most cost, and E-2 is now the kit's default without a local run behind it. A first pilot: six tasks (two new builds, two upgrades, two integration repairs), each run on v2.1 and on v2.3 in a fresh workspace with the same model, requirements and limits, acceptance checks fixed beforehand. Record criteria passed, time to verified delivery, review and repair time, cost, integration defects, regressions, and claims that were not backed by a run. Failed and unfinished runs count.
