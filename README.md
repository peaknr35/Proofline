# Proofline
**Build software with AI agents, and prove it works before you call it done.**

Proofline is a build method you give to an AI model. It turns an idea into a working, tested, packaged project by writing the contract before any code, checking that every check can fail, and putting an evidence level on every claim in the final report. It is plain text, so it works with any model that can read instructions; it runs best in a coding agent that can run commands and launch helpers.

> **Status, plainly.** v2.7 is a candidate. The last full self-test, on v2.6 (2026-11-15), passed 19 of 20 checks but failed one mandatory check: the repair limit. v2.7 fixes what that run found and has not been run yet. No speed claim is made. Record: [`builds/tasklet-v2.6/GRADES.md`](builds/tasklet-v2.6/GRADES.md).

## How it works

1. **Intake.** One paragraph is enough. The model probes its own tools and asks only questions where your answer could differ from its recommendation and matters.
2. **Contract, examples first.** Valid and invalid sample files for every shared format, with one example at, under and over each limit; an error table; then the rules, each pointing at the example that pins it; then a closed list of everything the product exposes.
3. **Spec gate.** A reader who did not write the contract looks for anything left unsaid. No code starts while a gap is open. The gate has a set depth and a repair limit, so it ends.
4. **Your approval.** You see the contract and every decision the model made for you. Your approval is recorded with fingerprints of exactly what you approved.
5. **Build.** The fewest builders that fit, usually one. Each owns its files, builds nothing the contract does not list, and stops to ask rather than change the contract.
6. **Fresh QA.** A reviewer that built nothing runs the real thing, tries to break it, and checks that a newcomer can find their way around the project from its files alone.
7. **Delivery.** A report that says what was built, how each part is proven, and what was not run.
8. **Lessons.** What worked is proposed for reuse, never adopted silently.

## The four skills

| Skill | What it does | Status |
|---|---|---|
| `proofline-build` | The full build method (this folder's `SKILL.md`) | v2.7 candidate, not yet re-run; v2.6 ran once and failed one mandatory gate |
| `proofline-plan` | Decides whether work needs organizing at all, then splits and staffs it | Experimental: followed once, no benefit shown |
| `proofline-audit` | Tests whether each agent in a team earns its place | Written, not yet tried |
| `proofline-runtime` | Designs the software that enforces a workflow instead of trusting prompts | Written, not yet tried |

`proofline-build` is the one most people need. The other three are for specific moments.

## The five agents

Each one is a specialist with a single job and its own hard rules. They live in [`kit/agents/`](kit/agents/) as Claude Code subagent files and ship in the plugin. Status: written, not yet run in a build.

| Agent | Its one job | Strict about |
|---|---|---|
| [`proofline-lead`](kit/agents/proofline-lead.md) | Owns scope, the contract, the plan and integration; sends work to the other four | Nothing built before approval; every packet complete; builder reports are claims, not proof |
| [`proofline-researcher`](kit/agents/proofline-researcher.md) | Deep research on any topic, Perplexity-style, and the evidence the other four build on. In Product mode it also writes a PRD and MVP cut ([`templates/PRD-TEMPLATE.md`](kit/skills/proofline-build/templates/PRD-TEMPLATE.md)) | Every claim cited to raw source text it read; quotes character-exact; key claims checked against two independent sources; a citation audit that re-opens every source before anything leaves, and a machine check ([`scripts/check-research.mjs`](kit/skills/proofline-build/scripts/check-research.mjs)) that fails any quote not found word for word in the saved source; reads YouTube, Bilibili, GitHub, Reddit, X and XiaoHongShu as well as the web through [`tools/eyes`](kit/skills/proofline-build/tools/eyes/README.md), free and without accounts; contradictions shown, not averaged; `NOT FOUND` instead of guessing; every requirement traced to evidence or marked as an assumption |
| [`proofline-architect`](kit/agents/proofline-architect.md) | Designs the ICM structure, the flow and the build system; scaffolds the workspace | One job per folder; one home per fact; every flow edge is a named file; a project a fresh agent can find its way around in about three reads |
| [`proofline-builder`](kit/agents/proofline-builder.md) | Builds one owned unit to the approved contract | Only its own paths; nothing the contract does not list; actual commands and results |
| [`proofline-qa`](kit/agents/proofline-qa.md) | Verifies the build from a fresh context | Runs everything itself; a check that cannot fail proves nothing; it never repairs the code it is checking |

Five is a ceiling, not a target: the Lead launches only the specialists the work needs. The researcher and architect are also useful on their own, outside a build: ask for `proofline-researcher` on any question, or `proofline-architect` to restructure a repository. Subagents cannot launch other subagents, so run the Lead as the main conversation (`claude --agent proofline-lead`) when it should dispatch the others; as a subagent it returns ready-to-send packets instead.

## Install

**Claude (claude.ai or the desktop app):** build the plugin, then upload it under **Plugins → Add → Upload plugin**. It installs all four skills and the five agents.

```bash
python _tools/build-plugin.py
```

The zip lands in `dist/proofline-plugin.zip`. Rebuild and upload again after each change.

**Claude Code, as personal skills:** the same script writes the four skill folders into your skills folder, replacing earlier copies of them.

```bash
python _tools/build-plugin.py --install ~/.claude/skills --agents ~/.claude/agents
```

`--agents` writes the five agent files into that folder; leave it out to install the skills only.

**Other tools:**

- **Coding agents with a project instruction file:** point that file at `kit/skills/proofline-build/SKILL.md`, or copy its text in.
- **Chat assistants with custom instructions:** paste `kit/skills/proofline-build/UNIVERSAL-PROMPT.md`, and attach its `SKILL.md` and the templates if the tool allows files.
- **Short instruction boxes:** use `kit/skills/proofline-build/COMPACT-PROMPT.txt` (about 1,230 characters), a summary rather than the whole method, and paste the templates as each phase needs them.

## Start a project

> Use proofline. Idea: … Who uses it: … The one journey that must work: … Not in v1: … Will it be sold: …

Or fill in [`templates/INTAKE.md`](kit/skills/proofline-build/templates/INTAKE.md) and paste it. For an existing project:

> Use proofline to upgrade this repository. Keep: … Change: … Existing spec and test results: …

## Works with Shark Tank Proof

[Shark Tank Proof](https://github.com/peaknr35/shark-Tank-proof) tests whether a business is worth building; Proofline builds it. Shark Tank Proof's `/kill-or-build` ends with `founder/build-brief.md`, and `proofline-build` takes that file as its intake ([`templates/FROM-SHARK-TANK-PROOF.md`](kit/skills/proofline-build/templates/FROM-SHARK-TANK-PROOF.md)).

| Shark Tank Proof says | Proofline builds |
|---|---|
| Incomplete, or Not yet | nothing |
| Unproven | only the small test asset the brief names: the thing a real person can pay, sign or book through |
| Profitable | version 1 of what the real buyer bought |

Both kits use the same four labels (MEASURED, THEY SAID IT, PLANNED, SIMULATED), so a fact keeps its label across the handoff. A guessed price becomes a setting, not a constant. Built is not sold: only a real buyer changes the verdict. Each kit works without the other, and this join has not yet been run on a real project.

## Without sub-agents: one role per chat

If your tool cannot launch helpers, you carry files between chats:

1. **Lead chat:** intake, the contract with examples and folder map, then the spec gate in a **new** chat (contract, examples and `templates/SPEC-GATE.md` only), close every gap, your approval, the project scaffold, the plan.
2. **Builder chats:** shared foundation first if there is one, then one chat per unit of work: contract, plan row, builder prompt, handoff template.
3. **Back in the Lead chat:** collect the handoffs, compare every shared interface against the examples, send repairs back, put the parts together.
4. **A new QA chat:** contract, integrated files, run instructions and handoffs, never the builders' reasoning. It also runs the walk test.
5. **Repairs** go back to the builder's chat, and QA checks again. The Lead chat writes the final report.

A chat that cannot run code can review and write tests, but cannot show that anything runs.

## What a delivered project looks like

```
project/
  AGENTS.md  CLAUDE.md      where things are, and how to route a task
  CONTEXT.md                current state, how to run it, what to read per task
  SPEC.md                   the approved contract
  contract/fixtures/        valid and invalid examples of every shared format
  <code>/  tests/           each folder has its own CONTEXT.md
  _shared/                  what is built, the rules, the words used
  planning/decisions/       why things are the way they are
  build/                    plan, approval, handoffs, evidence, final report
```

Full shape and rules: [`templates/icm/README.md`](kit/skills/proofline-build/templates/icm/README.md).

## What is in this repository

Two areas under one entry file ([`AGENTS.md`](AGENTS.md); the map is [`CONTEXT.md`](CONTEXT.md)): `kit/` is what ships, laid out exactly as the plugin, and `builds/` holds every build made with it.

| Path | Use |
|---|---|
| `kit/skills/proofline-build/SKILL.md` | The full method, in skill format |
| `kit/skills/proofline-build/UNIVERSAL-PROMPT.md` | The method as one prompt for any chat model |
| `kit/skills/proofline-build/COMPACT-PROMPT.txt` | About 1,230 characters, for short instruction boxes |
| `kit/skills/proofline-build/KIT-SELFTEST.md` | A 21-point test to run once per tool before relying on it, plus a short probe for builder-only models |
| `kit/skills/proofline-build/templates/` | Intake, PRD (research-backed requirements and MVP cut), contract, spec gate, plan, role prompts, handoff, final report, evidence card, the Shark Tank Proof handoff, and `icm/` (the project scaffold) |
| `kit/skills/proofline-build/library/` | Starting shapes (`ARCHETYPES.md`), reusable patterns and their status (`PATTERNS-LOG.md`), the research behind each rule and how strong it is (`SOURCES.md`, `EVIDENCE-CARDS.md`) |
| `kit/skills/proofline-build/scripts/check-research.mjs` | The researcher's machine check: every quote found word for word in the saved raw text of its source, every citation listed, audit counts that add up, every MUST requirement cited. `node kit/skills/proofline-build/scripts/check-research.mjs <research-folder>`; `node --test kit/skills/proofline-build/scripts/check-research.test.mjs` proves it can fail |
| `kit/skills/proofline-build/tools/eyes/` | The researcher's eyes: a Python CLI that reads any page, PDF, video transcript, GitHub repo or issue, Reddit thread or X post, and searches the web, Reddit, X, YouTube, Bilibili, GitHub and XiaoHongShu. Free, no keys or accounts. `uv tool install -e kit/skills/proofline-build/tools/eyes`, then `eyes doctor --live`. See [`kit/skills/proofline-build/tools/eyes/README.md`](kit/skills/proofline-build/tools/eyes/README.md) |
| `kit/skills/proofline-plan/`, `-audit/`, `-runtime/` | The three companion skills |
| `kit/agents/` | The five specialist agents: lead, researcher, architect, builder, QA |
| `builds/` | Every build made with the kit, kept as it was made: self-test runs now, real projects later. Catalog: [`builds/CONTEXT.md`](builds/CONTEXT.md) |
| `_tools/check-kit.mjs` | Checks the kit's own text: one version everywhere, counts that agree, links that resolve, every rule classified, core rules in every prompt form, all five agents named and carrying hard rules, and an entry file and catalog in every area. `node _tools/check-kit.mjs`; `node --test _tools/check-kit.test.mjs` proves each check can fail |
| `_tools/build-plugin.py` | Zips `kit/` as the plugin for upload, or installs it into Claude Code |
| `CHANGELOG.md` | What changed in each version, and how strong the evidence is |

The research papers themselves are not in the repository, because they are other people's copyright; `library/SOURCES.md` links to each one.

## Honest limits

- **Instructions are not enforcement.** Budgets, permissions and file ownership hold only where the tool running the agents enforces them.
- **One small project, one tool.** Every run so far was a single small build in one agent environment. A careful method is not yet a proven one.
- **No speed claim.** Nothing has been compared against another way of working. The real gain the kit aims for is fewer integration mistakes and more reuse; measure yours with the numbers in the final report.
- **Most rules about speed rest on other people's measurements or on design arguments.** `library/SOURCES.md` and `library/PATTERNS-LOG.md` say which is which.
- **Not enough alone** for agents that talk to each other live, for many users at once, or for decisions made with no person in between. Those need a real runtime underneath (see `proofline-runtime`).
- **Separate workspaces prevent collisions; they are not a security boundary.** Version control does not undo actions outside it, and a typed "yes" is not proof of who typed it.

Run `KIT-SELFTEST.md` in your own tool before relying on Proofline. When it is run on v2.7, all 21 checks must be exercised before the candidate label changes.
