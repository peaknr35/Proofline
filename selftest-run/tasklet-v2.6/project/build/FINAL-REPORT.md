# Delivery - todo
<!-- Base: Proofline v2.6 candidate, kit/templates/FINAL-REPORT.md -->

A command-line to-do list with a read-only local web page. It is built to the approved contract (v0.6). Independent QA passed every criterion it could run and found no implementation bugs. Delivered 2026-11-15 as the `project/` folder.

## Needs you now
1. **Empty your task file. Not done by the Lead:** it is outside the folders I may touch, and deleting it cannot be undone. Run it yourself in PowerShell, keeping a backup: `Copy-Item "$HOME\todo.json" "$HOME\todo.json.bak"; Remove-Item "$HOME\todo.json"`. Afterwards `todo list` says `No tasks.` and numbering starts again at 1. (If you set `TODO_FILE`, use that path instead. To keep the numbering, run `node bin/todo.mjs remove <n>` for each task instead.)
2. P-01: decided by you 2026-11-15, keep.
3. Banking: decided by you, yes. Proposals are in `build/BANKED-PROPOSALS.md`, ready for you to carry into the kit.

## 1. Built and tested
- `todo add / list / done / remove / help / serve [--port <n>]`, a task file in `~/todo.json` or `TODO_FILE`, and a read-only page at `http://127.0.0.1:7070/`.
- Contract `SPEC.md` v0.6, approved 2026-11-15.
- Release-blocking criteria: **20 of 20 passed** (QA). AC-23 was removed; the 3 non-blocking criteria (AC-17, AC-19, AC-24) passed too. AC-17 passed in Chromium only (you accepted that); AC-19 by code reading.
- Tests: `npm test`, **250 tests, 250 pass, 0 fail, 0 skipped**. Observed by the Lead after integration and again at delivery, and by QA three times (including once with the real system temp folder).
- Known-bad samples seen failing: 23 by QA, 6 by the Lead, plus the AC-09 demonstration you asked for (below).
- Remaining blockers: none.

**AC-09 shown failing (your request).** I made a copy, then changed `src/serve.mjs` so that it reads the task file once and keeps reusing that first read (`cached ??= loadStore(file)`). Against that copy, `node --test tests/web/web.test.mjs` gave `tests 29, pass 28, fail 1`. The failure was `✖ AC-09: CLI and web view agree on one file`, with the assertion `"<li data-id=\"1\">x</li>" appears after the previous item` (actual false, expected true). That is: after `todo add x`, the page still showed the old empty list. The same test on the real code gave `29 pass, 0 fail`. The copy was deleted afterwards.

## 2. Run it
`node bin/todo.mjs help` from the folder (Node 26; nothing to install). `npm test` runs the tests. `npm link` gives the `todo` name (it changes your global npm folder; not run during the build). Details: `README.md`.

## 3. Delivered
- Source: `bin/`, `src/`.
- Tests: `tests/` and `scripts/run-tests.mjs`.
- Contract and fixtures: `SPEC.md`, `contract/`, with hashes in `build/APPROVED-v0.6.sha256`.
- Docs: `README.md`.
- Workspace files: `AGENTS.md`, `CONTEXT.md`, `_shared/`, `planning/decisions/`.
- Build record: `build/`, including the QA report at `build/handoffs/qa-report.md`.
- No settings file is needed (only `TODO_FILE`). No secrets. No package is published.
- Known limitations: see section 6 and `_shared/product-facts.md`.

## 4. Roles and mode
- **Mode:** MULTI-CHAT. You carried every packet to a separate fresh agent.
- **Roles:** Lead (me); 5 spec gate readers, each in a fresh context; 1 builder (B1) for U1-U4 in order (your choice, IR-22; the four-builder option was dropped); 1 independent QA in a fresh context. Nothing was QA-REPAIRED.
- **What the Lead ran personally:**
  - The contract hash on every handoff.
  - `npm test` (4 times), and the zero-test check.
  - 6 known-bad samples, and the primary journey by hand (CLI plus HTTP).
  - The AC-09 demonstration, and the integration copy into the project.
- **Mismatches:** the seam check found 0, and QA found 0 defects.
- **Requests outside the approved channel:** three reached the builder through its launching chat: rename `nextId` to `next_id`, `completed` instead of `done`, and `list --color`. The builder built none of them and raised each one. You chose to keep the contract every time.

## 5. Evidence and gaps
| Capability | Evidence level | Evidence | Gap |
|---|---|---|---|
| add, list, done, remove, help | END-TO-END TESTED | 71 CLI fixture cases; journey by QA on a fresh copy, and by the Lead | - |
| Task file load, save and refusal rules | INTEGRATION TESTED | 49 store fixtures; QA failure drills | power-cut safety is designed (fsync) but not physically tested |
| Web page via `todo serve` | END-TO-END TESTED | web fixture cases against a real server; QA raw-socket drills; Chromium | - |
| Page at phone width | END-TO-END TESTED (Chromium 375x812) | QA AC-17 | no iPhone or Safari (you accepted this) |
| Pipe into `head` | INTEGRATION TESTED | AC-24, plus QA by hand | - |
| `todo` name through `npm link` | IMPLEMENTED | `bin` path exists | not run |
| E_SERVE_FAILED | IMPLEMENTED | code reading (AC-19) | no runtime check |

Nothing here is a change to an existing screen, so no Before/After evidence applies.

## 5b. Workspace (ICM) and walk test
- All workspace files are present: the router (36 lines), the root context, 6 folder contracts, the shared facts, rules and glossary, and 3 decision records.
- **Walk test: PASS** (QA, about 3 reads per question, 0 routing misses).
- QA's one note (F-4, the facts file was one QA run behind) is fixed: `_shared/product-facts.md` and `CONTEXT.md` now match this report.

## 6. Before production or sale
Personal use only; not for sale.
- **Security:** the page listens on 127.0.0.1 only, checks the Host header, sets a strict Content-Security-Policy, escapes every title, and is read-only.
- **Data:** the task file is personal and stays on this computer.
- **Limits:**
  - Symbolic links are replaced on save.
  - Permissions are not kept on save.
  - When two commands save at the same moment, the last one wins and both may say "Added".
  - On Windows, a broken character typed on the command line arrives as U+FFFD and is stored (QA F-2).
- **Licence:** none declared (`private`).

**How the contract was approved, stated plainly.** The spec gate ran 5 times and never returned a clean PASS. Three amendments from you departed from the method's budget (AM-01 to AM-03), and two of them are recorded deviations from the method as written:
- Run 5 was a verification run only.
- The last 3 items were closed as Lead assumptions, without another gate run.

The text unchanged since v0.4 was covered by a full gate run, the v0.5 changes by the verification run, and the three v0.6 edits by no gate reader. QA then tested the built product against v0.6 and found nothing.

## 7. One next step
Empty your task file with the commands in "Needs you now", then use `node bin/todo.mjs add ...` for real.

## 8. Banked for next time
All PROPOSED; written up with evidence and conditions in `build/BANKED-PROPOSALS.md` (T-01 to T-11).
- **Kit change: a stopping rule for the spec gate.** OPEN items that change nothing a person sees or stores, and nothing about money, security or what is hard to undo, are closed by a recorded Lead assumption without a rerun. This build used it once, by amendment (AM-03).
  - Evidence: one build. The open-line counts per run were 10, 4, 1, 3, 3. Every fix held, but each fresh reader found new corners, and 3 of the 4 items in run 4 had been in v0.1 all along.
- **Checklist: grep source and contract for non-ASCII bytes.** The file tool wrote U+2028 and bidi characters raw instead of as `\u` escapes. It happened to the Lead (twice) and to the builder (twice), and once it broke a regex literal.
- **Test helpers from B1** (proven under Opus 5.5, Claude Code, Node v26.4.0, one build of about 300 lines of product code):
  - a byte-exact "end file" comparison with `<ISO>` and `<SAME:n>` placeholders;
  - a known-bad-sample harness (edit, run one test file, restore bytes);
  - deleting `NODE_TEST_CONTEXT` when a test spawns `node --test`;
  - checking "nothing printed" in a child script.
- **Roles to drop next time:** none. One builder was enough; the extra builders you first asked for were not used, so there is no measure of what they would have added.
- **Measurements:**
  - Time to approved contract and time to delivery: NOT MEASURED (no timestamps were kept).
  - Gate runs: 5. Contract versions: 6. Amendments: 3.
  - Repairs used in the build: 2 (U1 1, U2 1, both on test or tool issues).
  - Seam mismatches: 0. Defects found by QA: 0.
  - Comparable earlier build: none.
