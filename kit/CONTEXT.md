# kit: everything that ships

This folder is the plugin. `python _tools/build-plugin.py` zips it as it is (leaving out the research PDFs, `.venv`, caches and `uv.lock`) and adds the manifest and the repo `README.md`. Nothing outside `kit/` ships.

Paths inside `skills/proofline-build/` are relative to that folder, because they must resolve after install.

## Read this folder when
- Changing a rule, agent, template, skill or tool → find its row below, open that one file
- Asked "what does the plugin contain?" → this table

## Do not load
- `skills/proofline-build/library/*.pdf` (not in git; `skills/proofline-build/library/SOURCES.md` links each one), `skills/proofline-build/tools/eyes/.venv/`
- More than the one part you are changing

## Contents
| Part | Path | What it is | Check |
|---|---|---|---|
| The method | `skills/proofline-build/SKILL.md` | rules, phases, gates, evidence labels | K1, K5, K6, K8, K9 |
| Prompt forms | `skills/proofline-build/UNIVERSAL-PROMPT.md`, `skills/proofline-build/COMPACT-PROMPT.txt` | the method for chat tools and short boxes | K3, K7, K8 |
| Self-test | `skills/proofline-build/KIT-SELFTEST.md` | the checks a version must pass, run as a build | K2 |
| Templates | `skills/proofline-build/templates/` | intake, PRD, SPEC, gate, plan, handoff, report, evidence card; `icm/` scaffold | K4, K9 |
| Library | `skills/proofline-build/library/` | `ARCHETYPES.md`, `PATTERNS-LOG.md`, `SOURCES.md`, `EVIDENCE-CARDS.md` | K4 |
| Research checker | `skills/proofline-build/scripts/check-research.mjs` (+ `.test.mjs`) | fails misquotes, dangling citations, uncited MUSTs | its own test |
| eyes | `skills/proofline-build/tools/eyes/` | the researcher's free web, video and social reader | its own tests, `eyes doctor --live` |
| Companion skills | `skills/proofline-plan/`, `skills/proofline-audit/`, `skills/proofline-runtime/` | split and staff work; audit a team; design a runtime | K6 |
| Agents | `agents/proofline-{lead,researcher,architect,builder,qa}.md` | the five specialists | K10 |

## Status
- Version and candidate status: the `SKILL.md` title and `../CHANGELOG.md`.
