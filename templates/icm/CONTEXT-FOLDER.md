# <folder>: <one-line name>

One job: <one sentence. If you need "and", it may be two folders.>

## Commands (if this folder runs anything)
| Do | Command |
|---|---|
| Install | `<cmd>` |
| Run | `<cmd>` |
| Test (<count, from observed output>) | `<cmd>` |

## Inputs
- **Reference (every time):** `<../_shared/file.md>`, `<sub-folder>/CONTEXT.md`
- **Working (this task):** only the files the change touches
- **Do NOT load:** `<dependency folders>`, `<build output>`, `<private or raw data>` - <why>

## Process
1. <concrete step on a named input>
2. <the layer rule, e.g. "pages → hooks → repositories → storage; pages never touch storage">
3. Add or update a test next to the behavior.
4. Run <checks>. <Format or schema changes need a version bump plus an upgrade test.>

## Verify (before the human check)
- Against `<earlier output or contract section>`: <what must still agree, e.g. "every claim traces to an id in ../01_research/output/facts.json">.
- Against `<../_shared/rules.md or a reference file>`: <the constraint>.
- Stale when: <the inputs whose change means this folder's output must be rechecked>.

## Outputs
<Exact paths. What this folder never produces, e.g. "deploying is a separate step (`../ops/CONTEXT.md`)".>

## Human check
<Who> reviews <what> against <what>. Pass = <observable result>. Recorded as <status field / commit / note>.

## Avoid
- <the mistakes a newcomer would make here>
- Hand-editing generated files: <which ones>.
