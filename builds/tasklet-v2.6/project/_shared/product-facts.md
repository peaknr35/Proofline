# Product facts (what is actually built)
<!-- Base: Proofline v2.6 candidate, kit/templates/icm/_shared/product-facts.md -->

The only source for "what works" in any report or README. If it is not here, it is not promised. Updated in the same change that adds or removes a feature, from observed evidence only.

Last checked against the running product: 2026-11-15, by independent QA (`build/handoffs/qa-report.md`) and the Lead · contract v0.6

## Built and verified
| Feature | Evidence level | Where it is checked |
|---|---|---|
| `todo add <title...>`, `list`, `done <n>`, `remove <n>`, help (`todo`, `help`, `--help`, `-h`) with the exact output, exit codes and saved file | END-TO-END TESTED (71 fixture cases through `bin/todo.mjs` child processes; journey by QA on a fresh copy and by the Lead) | `tests/cli/`; QA report AC-05, AC-06, AC-16 |
| Task file rules: `~/todo.json` or `TODO_FILE`, damaged or newer files refused and never repaired, safe save (temp file, flush, rename) | INTEGRATION TESTED (unit tests on all 49 store fixtures; QA failure drills through the CLI) | `tests/foundation/`; QA report AC-03, AC-04, section 5 |
| `todo serve [--port <n>]`: read-only page at `http://127.0.0.1:<n>/`, reads the file on every request, Host check, 403/404/405/500 answers | END-TO-END TESTED (real server child; QA raw-socket drills; Chromium browser) | `tests/web/`; QA report AC-08, AC-09, AC-22 |
| The page: Open and Done sections sorted by number, escaped titles, no scripts or external resources, fits a 375px-wide screen | END-TO-END TESTED in Chromium at 375x812 (owner accepted this for AC-17; no iPhone check) | `tests/page/`; QA report AC-07, AC-17 |
| Output piped into a reader that stops early (`todo list | head -1`) ends quietly with exit 0 | INTEGRATION TESTED (AC-24 ran; QA ran it by hand 3 times) | `tests/cli/`; QA report AC-24 |
| Runs from a fresh copy with `node bin/todo.mjs` | END-TO-END TESTED by QA (`npm link` not run) | QA report AC-16 |
| Tests leave nothing behind in the system temp folder | INTEGRATION TESTED (QA: 0 before, 0 after, real temp folder) | QA report AC-18 |

## Built, not fully verified
| Feature | Evidence level | What is missing |
|---|---|---|
| The `todo` command name through `npm link` | IMPLEMENTED (`package.json` `bin` points at an existing file) | running `npm link`, which changes the global npm folder; left to the owner |
| E_SERVE_FAILED (a listen error other than "port in use") | IMPLEMENTED, checked by code reading (AC-19) | no runtime check (hard to provoke) |
| The page on a real iPhone or in Safari | NOT RUN | the owner accepted Chromium at 375px instead; a phone cannot reach 127.0.0.1 anyway |

## Not built (do not promise)
- Everything in `SPEC.md` section 1 non-goals: editing a task's text, undo, reopening a task, due dates, priorities, tags, search, `--json` output, colours (including `list --color`), file locking, sync, accounts, sharing, changing tasks from the web page, page auto-refresh, `--version`, `--port=N`, HTTPS, any address other than 127.0.0.1.

## Limits
- Symbolic-link task files are not supported: a save replaces the link with a regular file (IR-44).
- File permissions are not kept on save; a read-only task file is refused on Windows (IR-45; QA confirmed).
- Two `todo` commands saving at the same moment: the last one wins, and both may print "Added" (IR-18; QA saw it in 9 of 10 tries).
- No limit on task count; tested size is 1000 tasks (IR-31).
- The page does not refresh itself; reload it to see changes.
- On Windows, a broken character typed on the command line reaches Node already replaced by U+FFFD, so it is stored as that character instead of being refused (QA F-2; the rule itself is unit-tested).
