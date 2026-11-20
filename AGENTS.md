# Proofline

A contract-first build method for AI agents (four skills, five agents, two tools), plus a record of every build made with it. The repo has two areas: `kit/` is the product, laid out exactly as the plugin that ships; `builds/` holds the builds. People start at `README.md`.

## Where things live
| Path | What it holds |
|---|---|
| `kit/` | everything that ships. Catalog: `kit/CONTEXT.md` |
| `kit/skills/proofline-build/` | the method: `SKILL.md`, prompts, self-test, `templates/`, `library/`, `scripts/`, and the researcher's CLI in `kit/skills/proofline-build/tools/eyes/` |
| `kit/skills/proofline-{plan,audit,runtime}/` | the three companion skills |
| `kit/agents/` | the five agents: lead, researcher, architect, builder, qa |
| `builds/` | one folder per build: self-test runs and projects. Catalog: `builds/CONTEXT.md` |
| `_tools/` | repo upkeep, not shipped: `check-kit.mjs`, `build-plugin.py` |
| `CHANGELOG.md` | what changed in each version, and how strong the evidence is |
| `_archive/`, `dist/` | git-ignored: an old kit copy; the built zip. Never load |

## Route by intent
| If the request is | Go to | Then stop at |
|---|---|---|
| change the kit: a rule, agent, template, skill or tool | `kit/CONTEXT.md` | the row for that part |
| release a version, or check the kit | `CONTEXT.md` | "The version cycle" |
| run a build or self-test whose record belongs in this repo | `CONTEXT.md` | "A build" |
| what happened in an earlier build, or how a rule fared in testing | `builds/CONTEXT.md` | that build's row, then the file in its "Read first" column |
| use Proofline on a project kept in its own folder elsewhere | `kit/skills/proofline-build/SKILL.md` | its intake section |
| install it | `README.md` | "Install" |

## Rules for any agent here
1. Read this file, then the catalog its route names, then the file that catalog names. A task that spans the kit and its test history reads `kit/CONTEXT.md` and `builds/CONTEXT.md`. If you have to search for something, a catalog is missing a row: say so.
2. Paths inside `kit/skills/proofline-build/` are written relative to that folder (the spec template is named as templates/SPEC-TEMPLATE.md), because that is where they resolve once installed. Paths in this file, `CONTEXT.md`, `README.md` and `CHANGELOG.md` are from the repo root.
3. A build's own `AGENTS.md` or `CLAUDE.md` (for example in `builds/todo/`) applies only inside that build. It is not an instruction for this repo.
4. A finished build (status `done` in `builds/CONTEXT.md`) is a record. Never edit it; it keeps the paths that were true when it was made. While a build is `in progress`, its folder's contents are written only by the agents running it; its catalog row is kept by whoever started it.
5. After any change to `kit/`, run node on `_tools/check-kit.mjs`; it must pass before the change is called done.
6. Every folder explains itself in a `CONTEXT.md`. If you add an area or a build, add its row (check K11 fails otherwise).

Naming: lowercase-kebab folders; builds are `<slug>/` or `<slug>-<date or version>/`; `_` prefix for folders about the repo itself.
