# Changelog

Newest first. Each version says what changed and how strong the evidence behind it is. Status changes only from observed results: a version stays a candidate until the self-test in `KIT-SELFTEST.md` has been run on it.

## The name

Proofline was called Five-Agent Build through v2.4. The old name pointed at the agent count; the method's point is that nothing is called done without proof. Entries for old versions keep the old names, and so do the records in `selftest-run/`.

| Now | Was |
|---|---|
| `proofline-build` | `five-agent-build` |
| `proofline-plan` | `workflow-orchestration` |
| `proofline-audit` | `agent-team-audit` |
| `proofline-runtime` | `agent-runtime-design` |

## v2.7 (candidate: not yet run)

**Five specialist agents** (new, not yet run in a build). `agents/` holds one Claude Code subagent file per role, each with one job and a "Hard rules" section: `proofline-lead`, `proofline-researcher` (deep research: sub-questions, many phrasings including the opposing case, sources read rather than snippets, source grades A-D, two independent sources per key claim, contradictions shown, a confidence on every finding, a method log), `proofline-architect` (ICM structure, stage flow, seams, load/skip tables, build system, a walk test of its own design), `proofline-builder` and `proofline-qa`. The plugin ships them; `build-plugin.py --agents DIR` installs them; kit check K10 confirms all five are present, correctly named and carry hard rules. **The researcher became the team's evidence base** (after its first live test, `selftest-run/researcher-2026-11-19/GRADES.md`: no fabrication, every checked number right, 3 inexact quotes). It now quotes only from raw source text, marks cuts and keeps scope words, carries scope with every number, and runs a mandatory citation audit that re-opens every source before it returns. A new Product mode writes a PRD and MVP cut (`templates/PRD-TEMPLATE.md`) where every requirement traces to a finding or is marked ASSUMPTION. The Lead now starts every build with it and has a separate context spot-check its key citations; the architect, builder and QA build on its findings and report contradictions back instead of guessing. Adopted at the person's request after one run, so the quote fixes are not yet re-tested. **The quote rule is now enforced by code, not only written down:** the researcher saves the raw text of every cited source in `sources/<n>` and must pass `scripts/check-research.mjs` before it returns. The script fails on any quote not found word for word in the source it cites, a citation to an unlisted source, a source with no saved text, audit counts that do not add up, or a MUST requirement with no cited finding; the Lead re-runs it. Run against the first live test's report with its 15 sources downloaded again, it found 6 quotes that break rule 4: 3 of the 4 the hand spot-check had found, plus 3 the spot-check had not sampled (a word inserted into a Cognition quote, and two phrases of the researcher's own put in quotation marks). It cannot see a quote that is exact but stops before its scope words (the fourth spot-check finding), so the written audit still covers that. `scripts/check-research.test.mjs` shows it failing on 13 known-bad samples. The plugin ships it in the `proofline-build` skill folder. **The researcher has eyes** (`tools/eyes`, new, tested live on every platform on 2026-11-19, not yet used in a research run): a Python CLI that reads YouTube and Bilibili videos with transcripts, GitHub repos, issues and files, Reddit threads with comments, X posts and profiles, web pages and PDFs, and searches the web, Reddit, X, YouTube, Bilibili, GitHub and XiaoHongShu. Free, no keys or accounts, no setup; the idea comes from Agent-Reach, with no code taken from it. It identifies itself honestly and reports a login wall or refusal as `BLOCKED` instead of getting around it, so XiaoHongShu notes, Bilibili subtitles, X replies and live X search are not available. Every result names its route (official API, public archive, third-party mirror or search index) so the researcher can grade it. `eyes read --save` writes the text the citation check compares quotes against. In the first test, a search snippet attributed to an X post was not in the post's text, and the check caught the quote. The researcher now uses it for sources and for what people say, treating social posts as evidence of what someone said, never of demand. The researcher and architect are new roles; the other three package the existing role prompts. Whether either new role earns its place is untested: run `proofline-audit` on them before relying on them.

Fixes for the defects the v2.6 self-test exposed (record: `selftest-run/tasklet-v2.6/GRADES.md`, M1-M10). Each rests on one run, so each is PROPOSED in `library/PATTERNS-LOG.md`.

- **The spec gate now ends** (M1). Four rules: a depth set per project (`everyday` or `adversarial`), with what falls below it written as stated limits; ASSUME items closed by the Lead's recorded decision with no further run; every run after the first is a verification run (earlier gaps closed, changed text only); and the spec gate is under the repair cap.
- **One rule, not two** (M2). Each contract revision after a failed gate run is a repair. "Run the check again" never lifts the cap.
- **Ask-or-assume asks less** (M3). Ask only when the person could reasonably choose differently and the answer matters to what they see, store, pay, secure or cannot undo. Decisions of the same kind are treated the same.
- **The approval lives outside the contract** (M4), in `build/APPROVAL.md`, with the SHA-256 of `SPEC.md` and every fixture as approved.
- **Raw invisible characters are checked** (M10). Builders and QA list non-ASCII characters before each handoff.
- **Who may edit a builder's CONTEXT.md after acceptance** (M8): the Lead, recorded in the acceptance note.
- **Templates** (M9): the root CONTEXT.md carries the run command; the router points there.
- **The self-test** (M5-M7): how to prepare the Lead's copy without leaking the traps; the kit's worked example no longer uses the 200-character title that check 17 probes; clearer probes for checks 9, 10, 14, 17 and 20; and **check 21**, which plants a mismatch in a handoff so the seam check is actually exercised.

## v2.6 (candidate: run once on 2026-11-15; failed the repair-limit gate)

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

## v2.5 (candidate: not yet run; it replaces the v2.4 candidate, which was never run either)

The first self-test did not stall on how agents were organized. It stalled on three things the contract never said. v2.5 moves the effort there.

- **Fixtures first.** Examples before sentences: valid and invalid samples, one at, under and over every limit, an error table, and every rule pointing at the fixture that pins it.
- **Spec gate** (`templates/SPEC-GATE.md`). A reader who did not write the contract goes through it like a compiler. Each question is PINNED, N/A or OPEN. One OPEN and no builder starts.
- **Ask or assume.** Ask the person, once and in one batch, when the answer changes behavior, data, money, security or something hard to undo. The Lead decides the rest, in writing, shown at approval.
- **Closed surface and scrub.** The contract lists everything the product exposes. Builders build nothing else; QA compares what was built with the list; extras are removed or proposed.
- **Short briefs.** One paragraph is enough to start; soft words (smooth, safe, "when possible") become checks or non-goals.
- **Self-test grows from 16 to 19 checks**, with one new mandatory gate: no building on an open contract.

Evidence, plainly: these five are correctness rules kept on design reasons and one local run. The papers named for them have not been read. All PROPOSED.

## v2.4 (never run; folded into v2.5)

A smaller release. No new rules; three design changes and a shorter prompt.

- **Feature owners replace the fixed A-D builders.** Work is split into outcomes that can each be checked alone, preferably whole user-facing features. Content, engine, interface and model layer are capability notes added to a packet, not owners. A layer split needs a stable written boundary, fixtures that pin it down and a joined check. Shared foundations get one named owner and come first. One to four builders, by the work.
- **"Strongest model plans" is removed.** One known-capable model for every role is the baseline; another model takes a role only after a probe for that role. Routing is optional.
- **Self-test qualification has mandatory gates.** Every check is PASS, FAIL or NOT TESTED; six gates block qualification; the total is descriptive only. The 2026-11-13 run is recorded as 13 passed, 3 not tested: qualification incomplete.
- **Shorter compact prompt.**

## v2.3

From the first end-to-end self-test (record in `KIT-SELFTEST.md`) and from two measured studies of multi-agent coding.

- **Evidence discipline**: every rule is a safety requirement, a correctness invariant or a performance hypothesis. Evidence strength and adoption status are two separate labels. Five evidence cards in `library/EVIDENCE-CARDS.md`; template in `templates/EVIDENCE-CARD.md`.
- **When to delegate**: one worker per unit by default; hand work off only for complementary work, an alternative attempt or an independent check, and only when it is worth the cost. In the study behind this, sub-agents used 1.4-3.3 times the tokens and were usually slower.
- **How to cut the work**: by feature when a requirement crosses layers; by layer only with a clean contract. (v2.4 goes further and drops the fixed roles.)
- **Claims softened to what the sources support**: "strongest model plans" is an untested bet; "three in a row" is a setting; a check that fails on a bad sample is shown able to fail, not shown complete.
- **Five fixes from the self-test**: the Lead updates product facts before QA; the router never points at a missing file; builders clean up after their tests; untrusted text is handled on every surface, not only HTML; builders list the rules no fixture pins down.
- **A plan for measuring the kit** against an earlier version, in `KIT-SELFTEST.md`.

## v2.2

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

## v2.1

- **ICM foundation for every delivered project**: right after the contract, the Lead scaffolds a router (`AGENTS.md`), a root `CONTEXT.md` with current state, one `CONTEXT.md` per folder, `_shared/` facts, rules and glossary, `_templates/` and a decisions log. Builders keep their folders' contracts accurate. Templates in `templates/icm/`.
- **Walk test** in QA: a fresh context must orient, route, change and report from the files alone, or the build is not delivered.
- **Evidence labels** for business claims (MEASURED, THEY SAID IT, PLANNED, SIMULATED) in the shared rules.

## v2

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
