# Research: Do multi-agent LLM systems beat a single LLM agent on software-engineering/coding tasks at equal cost or token budget?
Date: 2026-11-19 · Depth: standard · Stopped because: answered (every sub-question has an answer or a named gap; the last 3 searches added only 2 new primary sources, both opened)

> Produced by `agents/proofline-researcher.md` (run as a general-purpose subagent given that file). The subagent was not allowed to write files, so the Lead saved its returned text here unchanged. Grading and citation spot-checks: `GRADES.md` in this folder.

Purpose: to decide when the Proofline build kit should hand work to several agents and when one agent should do it.

## Answer
Not as a general rule. Few studies hold cost equal on coding tasks. In most of the cost-aware coding studies found, a single agent matched or beat multi-agent setups and cost less [3][4][7][10]. Multi-agent setups pulled ahead at equal budget only in two situations. One is search-style designs (evolved agent systems, or parallel teams plus a picker) on hard, long tasks, where a lone agent cannot usefully spend extra budget [12][13]. The other is tasks that split into independent parallel parts [2][5]. Overall confidence: **Medium** that one agent should be the default at equal cost for typical coding work. **Low** for any precise size of the gap, because the equal-budget coding evidence is thin, mostly self-reported by the authors of the system being tested, and mixed.

## Key findings
1. **No single architecture wins on the SWE-bench issue-repair leaderboards.** Single-agent and multi-agent entries reach similar top scores. On SWE-bench Lite the difference between architecture groups was not statistically significant (Kruskal-Wallis p = 0.0579). Warp reported that a single primary agent was more reliable than its multi-agent attempts [9]. Confidence: Medium. Labels: MEASURED (leaderboard analysis) and THEY SAID IT (Warp).
2. **Single-agent frameworks did better in two controlled code studies.**
   - Seven agent frameworks run on code tasks with the same model (DeepSeek-V3.1): the single-agent frameworks did better overall. The multi-agent AgentOrchestra had the longest trajectories "due to coordination overhead" [7].
   - A controlled LeetCode experiment (133 problems): no accuracy gain from multiple agents (98.50% vs 97.74% acceptance), and generation took four times as long [10].

   Confidence: Medium. Label: MEASURED.
3. **The same workflow run as one agent matches or slightly beats its multi-agent version, at lower cost.** On HumanEval and MBPP with GPT-4o mini, OneFlow on HumanEval scored 92.1% at $0.020 as a single agent vs 91.6% at $0.026 as multi-agent [4]. The single-agent cost is a KV-cache estimate, not a measured bill. [single source for the coding numbers] Confidence: Medium. Label: MEASURED (cost partly estimated).
4. **Agent teams cost far more for small or uncertain gains.**
   - Vibe Code Bench (50 apps, Oct 2026): teams cost 1.8x to 5.1x as much as a single agent. Only 1 of 4 team-vs-single comparisons was significant: GPT 6 Sol at medium effort, +7.3 points, p = 0.005. For that model, raising reasoning effort gained more than adding a team [5].
   - Anthropic: multi-agent systems use about 15x the tokens of a chat [6].

   Confidence: Medium (each setup run once, n = 50, not cost-matched). Label: MEASURED.
5. **Mixed result from a 10-benchmark study with GPT-4.1 (June/Oct 2026).** Pooled over all ten benchmarks, 5 of 6 multi-agent workflows trailed the single-agent "Core". On the two coding benchmarks, though, CAMEL and Jarvis beat Core while using 0.38x to 0.51x its tokens, while ChatEval used 11x to 14x the tokens for little gain. In the authors' words, "Higher token consumption does not guarantee higher accuracy" [3]. Confidence: Medium. Label: MEASURED.
6. **The strongest equal-budget counter-evidence is EvoMAS on SWE-bench Verified.** At a matched 31M-token budget with Claude-4.5-Sonnet, the evolved multi-agent system scored 79.1%. A single agent looped up to the same budget scored 71.4%, and looping gave it no gain over its natural 2.3M-token run [12]. The authors are testing their own method. [single source] Confidence: Low-Medium. Label: MEASURED (self-reported).
7. **Parallel teams beat independent agents on 12 long-horizon tasks**, several of them GPU-kernel or code tasks [13].
   - At a fixed budget of 100 agents, teams of ten beat 100 independent agents on 10 of 12 tasks.
   - At equal agent-hours, a team of two 6-hour agents averaged 57.4, against 52.7 for one 12-hour agent.
   - The method needs a verifier to pick the best team.

   [single source; preprint dated 6 Nov 2026] Confidence: Low. Label: MEASURED.
8. **Budget-controlled studies outside coding mostly favour one agent.**
   - Multi-hop question answering at equal reasoning tokens: single agents "consistently match or outperform" multi-agent systems [1].
   - A 180-configuration agent study [2]:
     - Coordination "yields diminishing or negative returns" once single-agent accuracy is above about 45%.
     - "tool-heavy tasks suffer disproportionately from multi-agent overhead".
     - Sequential tasks got worse.
     - Parallelisable tasks improved by 80.8% with a central coordinator.

   Neither study tested a coding benchmark. Confidence: High for those task types, indirect for coding. Label: MEASURED.
9. **Anthropic and Cognition, who disagree on multi-agent design in general, both say coding is a poor fit.**
   - Anthropic: "most coding tasks involve fewer truly parallelizable tasks than research" [6].
   - Cognition: running agents in collaboration "only results in fragile systems". Its workable pattern is a read-only subagent "only tasked with answering a well-defined question, not writing any code" [8].
   - Cognition's piece is opinion with no data.

   Confidence: Medium (two independent organisations agree). Label: THEY SAID IT.
10. **Multi-agent frameworks fail often.** A study of 1,600+ traces from 7 frameworks, including the coding frameworks ChatDev and MetaGPT, found failure rates of 41% to 86.7%. It says gains over single-agent frameworks and best-of-N are "often minimal" [14], but that claim rests on cited work, not a head-to-head test in the paper. Confidence: Medium. Label: MEASURED (failure taxonomy) / THEY SAID IT (gains claim).

## Details

**SQ1. Is there a direct equal-budget comparison on coding tasks?** Only three come close:
- **EvoMAS** [12], Table 6 on SWE-bench Verified:
  - Claude-3.5-Sonnet: EvoMAS 42.7% at 29M tokens vs 33.6% for the looped single agent; best-of-10 with selection reached 37.8% at 40M tokens.
  - Claude-4.5-Sonnet: 79.1% vs 71.4% at a matched 31M tokens.
- **Parallel agent teams** [13]: the budget is counted in agents or agent-hours, not tokens. At equal dollar cost the teams "beat a frontier model on half the tasks".
- **OneFlow** [4]: the same workflow run single vs multi. The single agent matches or beats the multi-agent run at lower cost.

What these studies found: equal-budget multi-agent wins appear when the multi-agent design is a search procedure (evolve or sample many candidates, then pick the best) and a single agent cannot turn extra tokens into progress [12][13].

What this suggests for Proofline (inference, not a measured result): multi-agent work pays off as parallel exploration plus a verifier, not as role pipelines (planner, then coder, then reviewer) working on one tightly coupled change.

**SQ2. Cost-aware but not cost-matched coding studies.**
- **Framework evaluation [7]:** single-agent frameworks did better on development, vulnerability detection and SWE-bench Lite repair, all with DeepSeek-V3.1.
- **LeetCode experiment [10]:** cyclomatic complexity fell 4.8% and lines of code 3.6%, at 4x the generation time. The authors "recommend defaulting to a single agent".
- **Vibe Code Bench [5]:** teams cost 1.8x to 5.1x as much, with a significant gain in 1 of 4 setups.
- **GPT-4.1 study, coding rows [3]:**

  | Workflow | Result vs single-agent Core | Tokens vs Core |
  |---|---|---|
  | LLM-Debate | +9.67 points on HumanEval | 2.54x |
  | AutoGen | -23.92 points on HumanEval | not recorded here |
  | ChatEval | +0.51 points on HumanEval | 11.31x |
  | CAMEL, Jarvis | beat Core on HumanEval and MBPP | 0.38x to 0.51x |

- **AgentCoder (2023-24, self-reported) [11]:** 96.3% / 91.8% pass@1 on HumanEval / MBPP using 56.9K / 66.3K tokens, against a "state-of-the-art" baseline using 138.2K / 206.5K. The abstract does not say whether that baseline was a single agent, so this does not settle the question.

**SQ3. Equal-budget evidence from other domains.**
- **Multi-hop reasoning [1]:** a single agent wins at equal thinking tokens. Multi-agent systems become competitive only when the context is noisy or corrupted. The authors argue "many reported MAS gains are better explained by compute and context effects than by inherent architectural superiority".
- **Agentic benchmarks [2]:** matched at a mean of 4,800 reasoning tokens per trial. Findings: overhead on tool-heavy tasks, saturation at about 45% single-agent accuracy, errors amplified 17.2x with independent agents and 4.4x with a central coordinator, and gains on parallelisable work.
- **Transfer to coding:** inference, not something either paper tested. Coding is tool-heavy and mostly sequential, which points toward one agent.

**SQ4. Why multi-agent setups lose or win.**
- **They lose** through split context and conflicting implicit decisions between agents [8]. Context lost in hand-offs led the SWE-bench entry Lingxi to merge two of its agents [9]. Inter-agent misalignment is the most common failure category [9][14]. Coding has fewer parallel parts than research [6]. Token spend explained 80% of performance variance in Anthropic's research-agent tests [6], so multi-agent wins that are not budget-matched may mostly be extra compute [1][6].
- **They win** with parallel, separable exploration plus selection [12][13], with noisy context [1], and on parallelisable tasks [2].

**SQ5. The opposing case.** Searched for deliberately. It is real but narrow: search or selection designs on hard, long tasks, with a verifier [12][13][3]. Agyn reported 72.2% on SWE-bench (500 tasks) against 65.0% for single-agent mini-SWE-agent [15]. This does not show a win at equal cost:
- The team used GPT-5 and GPT-5-Codex, while the baseline used GPT-5 only.
- The paper reports no cost.
- A single GPT-5.2 agent reached 71.8%, close to the team's 72.2%.

**SQ6. Recency.** The newest sources are [13] (6 Nov 2026), [5] (9 Oct 2026) and [3] (v2, 9 Oct 2026). No independent, strictly cost-matched SWE-bench-style repair study with current frontier models was found.

## Where sources disagree
- **Does multi-agent win at equal budget on SWE-bench Verified?**
  - Yes, per EvoMAS [12] (Grade A, but the authors are testing their own method).
  - No winner, per the independent leaderboard analysis [9] (Grade A, not budget-controlled).
  - Single agent better, per the framework evaluation [7] (Grade A, SWE-bench Lite, not budget-matched).
  - Likely reason: EvoMAS compares against a single agent that loops to spend its budget, which is a weak way to use extra tokens. [7] and [9] compare systems at their normal running cost, where single agents spend far fewer tokens. The two sides answer different questions: "best use of a large budget" versus "best result per typical run".
- **Pooled vs coding results in [3].** The pooled verdict favours the single agent, but on HumanEval and MBPP several multi-agent workflows win, some with fewer tokens. The pooled score is dominated by non-coding benchmarks.
- **Anthropic vs Cognition [6][8].** Their titles conflict, but they agree that coding is a poor fit for multi-agent work. They differ on research and read-heavy tasks, where Anthropic reports a 90.2% gain (not cost-matched, about 15x the tokens).
- **Vibe Code Bench by model [5].** Teams gave a significant gain for GPT 6 Sol at medium effort and no significant change for Opus 5.5 (-0.3 and +3.4 points). This looks model-dependent. That it matches the saturation finding in [2] is inference.

## Gaps and open questions
- **NOT FOUND: an independent, strictly cost-matched comparison on SWE-bench-style repair with frontier models.** Search queries 4, 8, 9 and 11 were aimed at this.
- **NOT FOUND: a cost-matched evaluation of Claude Code subagents or agent teams.** A CircleCI page claiming a 75% gain failed to load, so it is not cited.
- **Not verified or only partly read:** the type of AgentCoder's baseline [11]. The full texts of [2] and [14] were cut off by the fetch tool, so only parts were read.
- **What would settle it:** run Proofline's own tasks on one model in three ways: (a) a single agent at budget B; (b) a single agent at 2-5B, using more effort or retries plus a verifier; (c) a lead agent with subagents, at B and at 2-5B. Score on hidden tests over repeated runs. This separates "more compute" from "more agents".

## Sources
[1] Tran & Kiela, "Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets", arXiv 2604.02460, v1 2 Apr 2026, v2 11 Apr 2026. https://arxiv.org/abs/2604.02460 - Grade A (preprint). "We find that SAS consistently match or outperform MAS on multi-hop reasoning tasks when reasoning tokens are held constant."

[2] Kim et al. (Google Research, Google DeepMind, MIT), "Towards a Science of Scaling Agent Systems", arXiv 2512.08296v2, 17 Dec 2025. https://arxiv.org/html/2512.08296v2 - Grade A. "tool-heavy tasks suffer disproportionately from multi-agent overhead"; "coordination yields diminishing or negative returns"; "independent agents amplify errors 17.2×"

[3] Fu et al., "Do More Agents Help? Evaluating Accuracy and Cost in LLM Multi-Agent Workflows", arXiv 2606.05670, v1 4 Jun 2026, v2 9 Oct 2026. https://arxiv.org/html/2606.05670v2 - Grade A. "LLM-Debate gains 9.67 points on HumanEval but loses 1.96 points in pooled accuracy"; "Higher token consumption does not guarantee higher accuracy."

[4] Xu et al., "Rethinking the Value of Multi-Agent Workflow: A Strong Single Agent Baseline", arXiv 2601.12307v1, 18 Jan 2026. https://arxiv.org/html/2601.12307v1 - Grade A. "Single-agent execution is substantially more efficient and cheaper than multi-agent execution."

[5] Katrina Drozdov (Vals AI), "Do Agent Teams Pay Off? A Case Study on Vibe Code Bench", 9 Oct 2026. https://www.vals.ai/blog/multi-agent-vibe-code-bench - Grade A for its own data (one run per setup, n = 50). "Whether a team is worth it depends on the model, task, and budget."

[6] Anthropic Engineering, "How we built our multi-agent research system", 13 Jun 2025. https://www.anthropic.com/engineering/multi-agent-research-system - Grade A for its own system (internal evaluation). "multi-agent systems use about 15× more tokens than chats"; "token usage by itself explains 80% of the variance"; "most coding tasks involve fewer truly parallelizable tasks than research"

[7] Yin et al., "A Comprehensive Empirical Evaluation of Agent Frameworks on Code-centric Software Engineering Tasks", arXiv 2511.00872v1, 2 Nov 2025. https://arxiv.org/html/2511.00872v1 - Grade A. "AgentOrchestra tends to exhibit the longest trajectories and the most correction attempts due to coordination overhead"; "single-agent system consistently demonstrates superior performance"

[8] Walden Yan (Cognition), "Don't Build Multi-Agents", 12 Jun 2025. https://cognition.com/blog/dont-build-multi-agents - Grade C as evidence (opinion from a vendor, no data). "running multiple agents in collaboration only results in fragile systems"

[9] Martinez & Franch, "Dissecting the SWE-Bench Leaderboards", arXiv 2506.17208v3, 5 Feb 2026. https://arxiv.org/pdf/2506.17208 - Grade A. "Notably, no single architecture consistently achieves state-of-the-art performance."; "ultimately found that a single primary agent yielded the most consistent and reliable results"

[10] Yu, Alégroth, Chatzipetrou & Gorschek, "Single-Agent versus Multi-Agent LLM Systems for Automated Programming: A Controlled Experiment in Software Engineering", 2025, submitted to TOSEM. https://liang-y-yu.github.io/publication/2025-10-01-paper-title-number-10 - Grade B (abstract on the author's page; paper under review). "Average acceptance rate was 98.50% (single-agent) and 97.74% (multi-agent)"; "These gains came with a fourfold increase in end-to-end generation time."

[11] Huang et al., "AgentCoder", arXiv 2312.13010, v1 Dec 2023, v3 May 2024. https://arxiv.org/abs/2312.13010 - Grade A (self-reported, dated). "with an overall token overhead of 56.9K and 66.3K"

[12] Hu et al., "EvoMAS: Evolutionary Generation of Multi-Agent Systems", arXiv 2602.06511 (ICML 2026), v4 27 May 2026. https://arxiv.org/pdf/2602.06511 - Grade A (self-reported on the authors' own method). "With Claude-4.5-Sonnet, the gap widens to 79.1% vs. 71.4% at matched 31M budgets."

[13] Wang et al., "Test-Time Compute Scales Better with Parallel Agent Teams", arXiv 2611.09798v1, 6 Nov 2026. https://arxiv.org/html/2611.09798v1 - Grade A (very recent preprint). "With a 27B model and a budget of 100 agents, parallel teams of ten beat parallel agents on 10 of 12 tasks."; "Picking the best team would become its own problem without a verifier."

[14] Cemri et al. (UC Berkeley), "Why Do Multi-Agent LLM Systems Fail?", arXiv 2503.13657v3, 26 Oct 2025. https://arxiv.org/html/2503.13657v3 - Grade A. "1600+ annotated traces collected across 7 popular MAS frameworks"

[15] Benkovich & Valkov, "Agyn: A Multi-Agent System for Team-Based Autonomous Software Engineering", arXiv 2602.01465v2, 7 Feb 2026. https://arxiv.org/html/2602.01465v2 - Grade A for its own result (self-reported, no cost data). "it resolves 72.2% of tasks, outperforming single-agent baselines using comparable language models"

Also opened but not cited as evidence: Dong & Shigida, arXiv 2605.08478 (8 May 2026), on 216 Codeforces problems: "k-shot consistently achieves a better accuracy-cost and accuracy-query tradeoff" than agent-based reasoning.

Note on quotes: most quotes are excerpts returned by the WebFetch tool. Quotes for [9] and [12] come from PDF text extracted locally with pdftotext.

## Method log
- **Sub-questions:** (1) direct equal-budget coding comparisons; (2) cost-aware coding comparisons that are not cost-matched; (3) equal-budget results from other domains, and whether they transfer; (4) why multi-agent setups lose or win; (5) the opposing case; (6) recency.
- **Searches run: 11**
  1. multi-agent vs single-agent LLM coding equal token budget comparison
  2. Towards a science of scaling agent systems multi-agent single-agent compute-matched
  3. Cognition "Don't build multi-agents" context engineering
  4. SWE-bench single agent vs multi-agent architecture cost tokens study 2026
  5. "Why Do Multi-Agent LLM Systems Fail" ChatDev MetaGPT ProgramDev
  6. Anthropic "How we built our multi-agent research system" tokens 15x coding tasks
  7. multi-agent coding framework outperforms single agent lower token cost AgentCoder MapCoder HumanEval tokens (opposing)
  8. multi-agent software engineering agents SWE-bench Verified beats single agent same model 2026 arXiv (opposing)
  9. single agent vs multi-agent coding agents controlled experiment cost-matched 2026 subagents Claude Code
  10. multi-agent coding wins at matched compute parallel subagents test-time scaling software engineering evidence (opposing)
  11. "multi-agent" coding agents token budget study November 2026 single agent outperforms
- **Sources opened: 16** ([1]-[15] plus arXiv 2605.08478).
- **Failed to load:** loop.circleci.com (DNS not resolvable from this session). Worked around: the 2506.17208 PDF (downloaded with curl, read with pdftotext); cognition.ai 301 redirect to cognition.com.
- **Suspected injected instructions:** none.
- **Depth minimums met:** 11 searches (6 required), 16 sources (8 required). Key findings 1, 2, 4, 8 and 9 each rest on two or more independent sources. Findings 3, 6 and 7 are marked [single source].
- **Model names not checked:** some 2026 sources name models such as "GPT 6 Sol", "GPT-5.6-sol", "Qwen3.8-27B" and "Claude Opus 5.5"; recorded as given.
- **Evidence card:** `templates/EVIDENCE-CARD.md` not filled; the brief limited output to the report.
