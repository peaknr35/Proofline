# <Project name>

<One sentence: what it does, for whom.> <Who owns it, year.>

## Where things live
| Folder | What it holds |
|---|---|
| `<code>/` | <the code, its tests, shipped assets> |
| `planning/` | Specs, decision records, audits |
| `_shared/` | Facts every area uses: what's built, the rules, the words we use |
| `_templates/` | Copy these to start a new <run / record / decision> |

## Route by intent
| If you need to | Read first | Then stop at |
|---|---|---|
| Know the current state | `CONTEXT.md` § Current state | - |
| Run it or test it | `CONTEXT.md` § Current state ("Run it"); details in `<README.md or docs/quickstart.md, or "not written yet">` | - |
| Fix a bug or change code | `<code>/CONTEXT.md` | tests pass, the owner reviews the diff |
| <Change content> | `<content>/CONTEXT.md` | draft saved, reviewed |
| Deploy or release | `ops/CONTEXT.md` | the owner approves the release |
| Plan a feature or record a decision | `planning/CONTEXT.md` | spec or decision drafted |

## Naming
- Dated files: `YYYY-MM-DD_topic.md`. Versioned outputs: `<slug>-v<N>.<ext>`.
- Statuses in frontmatter or file names: `draft → review → final`.

## The rules
- Nothing moves to the next step until the owner has read the last output.
- Agents draft. They never send, publish, pay, delete or deploy without asking.
- Load only what the step needs. Each `CONTEXT.md` lists what to skip.
- Full rules: `_shared/rules.md`.
