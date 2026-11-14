# Delivery - Tasklet (kit self-test project)

## 1. Built and tested
A command-line to-do list in one JSON file (`add`, `list`, `done`, `remove`) plus a read-only web page of the same list. Contract SPEC 1.0.

- Release-blocking criteria passed: 11 of 11 (AC-10 is the one non-blocking criterion; it also passes).
- `npm test`: 6 test files, 182 tests, 182 pass, 0 fail (Lead, after the repair, 2026-11-13). QA got the same number on two earlier runs.
- Remaining blockers: none. Three decisions are open for the owner (section 6).

## 2. Run it
```
npm test
node cli/todo.mjs add "Buy milk" --file my-tasks.json
node web/server.mjs --file my-tasks.json --port 4173
```
Full steps: `docs/quickstart.md`.

## 3. Delivered
Source (`cli/`, `web/`) · contract (`SPEC.md`, 13 fixtures) · joined checks (`tests/integration/`) · quickstart (`docs/`) · evidence (`build/evidence/`, `build/handoffs/`) · ICM foundation (router, root and folder contracts, shared facts) · this report. No settings file is needed. No release package: personal test project.

## 4. Roles and mode
Mode: PARALLEL. Roles: Lead, Builder B (CLI), Builder C (web), fresh QA. Dropped: A (content), D (AI layer).

- Builder C: nothing in a real project would have broken without it; one builder could have done both units in order. It was here so a mismatch could be planted. Drop it next time for a project this size.
- QA was independent: a fresh worker that saw the contract, files and handoffs, not the builders' reasoning. QA edited no implementation; nothing is QA-REPAIRED.
- Lead ran personally: the full suite (three times), the zero-tests case, the wrong-file variant of the joined check, and the journey in a real browser at desktop and 375px.
- Mismatches caught before QA: the planted `completed` note (refused and reported by Builder C itself) and R-1, the title length unit (seam check, from the two handoffs). Caught by QA: 13 findings, none of them a mismatch between the parts that the seam check missed.
- Repairs: one. F-02 (CLI tests left 81 temp folders per run) went back to Builder B. The fix landed, then the worker was cut off by a server overload before writing its repair note. The Lead verified it: 87 of 87 pass, leftover count before and after one run 1130 and 1130. One repair attempt used of two.

## 5. Evidence and gaps
| Capability | Evidence level | Evidence | Gap |
|---|---|---|---|
| The four commands, exit codes, typed confirmation on `remove` | LOCAL TESTED (real process, no fakes) | `cli/tests/`, QA drills | terminal output of odd titles (F-04) |
| Bad data file refused, never overwritten | LOCAL TESTED | both part suites, QA drills | none |
| Web page and `/api/tasks`, titles escaped, no cache, never writes | LOCAL TESTED (real server) | `web/tests/`, QA mutation: removing the escaping fails 2 tests | none |
| CLI changes show in the web view (AC-08, AC-09) | INTEGRATION TESTED | `tests/integration/joined.test.mjs`; fails when the server reads another file | the server runs in-process there; the separate process is covered in `web/tests/run.test.mjs` |
| Primary journey | END-TO-END TESTED | QA by hand with real processes; Lead and QA in the browser pane, desktop and 375px | emulated width, not a phone |
| Test runner fails on zero tests | LOCAL TESTED | `TEST_ROOTS=docs node scripts/test.mjs` exits 1 | none |
| A physical phone, Firefox, Safari, a screen reader, Node 20-25, macOS, Linux | NOT RUN | - | no such environment here |

Nothing in the test suite is faked: both parts are real in every test.

## 5b. Workspace (ICM) and walk test
Router (36 lines), root context, three folder contracts, shared facts, glossary, rules, one decision record: present. Walk test by QA from the files alone: PASS in 5 reads, with one miss (the release route pointed at a quickstart that did not exist yet) and one friction (run commands not reachable from the root). Both fixed in `AGENTS.md`; not re-walked by a fresh context after the fix. `_shared/product-facts.md` and root `CONTEXT.md` updated to match this report.

## 6. Before anyone relies on it
Open decisions for the owner (each is a contract change, so none was applied):
1. **R-1 / F-01** How to count the 200-character title limit. The CLI counts UTF-16 units, the web counts code points; a hand-made file with a 101-200 emoji title is shown by the web and refused by the CLI. Recommended: code points in both, plus one fixture.
2. **F-04** Titles are printed raw to the terminal; a title with a line break can forge a `list` line. Recommended: refuse control characters on `add` and show them escaped in `list`.
3. **F-12** Things built sensibly that the contract does not name (`Removed #<id>`, exit 3 on a failed write, `HEAD` answers 405). Recommended: write them into SPEC 7 as built.

Known limits: no file locking (one user by design) · `--file NUL` on Windows makes an undeletable file · a file with a byte-order mark is refused.

Machine: the system drive (C:) is full (about 2 MB free). 1,130 `tasklet-*` folders from earlier test runs sit in the system temp folder. They were not deleted: that is outside this project and needs the owner's say.

## 7. One next step
Decide R-1 (code points or UTF-16 units). It is the only place the two parts disagree.

## 8. Banked for next time
Reuse candidates, all PROPOSED, proven under: Claude Fable 5.2 in the Claude desktop app, PARALLEL mode, size S, one build.
- A packet line that tells builders to list every reader rule no fixture pins down. It is what let the seam check find R-1 without running anything.
- Tests remove every temp folder they create; QA counts leftovers before and after a run.
- "Untrusted text" in the contract names every place the text is shown (page, terminal, logs), not only HTML.
- The router never routes to a file that does not exist yet.
- The Lead updates product facts and current state before QA starts, so the walk test has something true to check, and again after.

Time and counts: contract to approval in one exchange · builders about 5 and 8 minutes · QA about 10 minutes · 1 repair · 13 QA findings, 0 release-blocking · no comparable earlier build, so no speed claim.
