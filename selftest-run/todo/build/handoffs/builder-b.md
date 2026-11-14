# Handoff - Builder B (U1: CLI + store)

Project: Tasklet (kit self-test) · Build ID: not given in my packet · Contract version: 1.0 · Plan version: not read (build/PLAN.md is outside my packet) · Mode: PARALLEL

## Files
| Path | Created / changed | Purpose |
|---|---|---|
| `cli/store.mjs` | created | Reads, validates (SPEC 6) and writes the data file; temp-file-then-rename writer; never prints |
| `cli/todo.mjs` | created | Argument parsing, the four commands, the `remove` question, messages, exit codes |
| `cli/tests/store.test.mjs` | created | Reader against every fixture, each section 6 rule, writer format, AC-10 |
| `cli/tests/cli.test.mjs` | created | The real command run as a process: AC-01..04, AC-05, AC-06, settings, usage errors |
| `cli/CONTEXT.md` | changed | Real commands, observed test count, layer rule, what to avoid |
| `build/handoffs/builder-b.md` | created | This handoff |

Nothing else was touched. `web/` was not read.

## Behavior delivered
- **AC-01** `add "<title>"`: appends `{id: nextId, title, done:false, created: new Date().toISOString()}`, `nextId` + 1, prints `Added #<id>: <title>`. Title trimmed first (I-07). 201 characters, empty, blank or missing title: exit 1, nothing written. Ids never reused (I-02).
- **AC-02** `list`: `[ ] #<id> <title>` / `[x] #<id> <title>` in id order; `No tasks.` when empty or when the file is missing; `list --json` prints the tasks array. `list` never writes.
- **AC-03** `done <id>`: sets `done:true`, prints `Done #<id>`; unknown id exit 2 with `No task #<id>` on stderr; already done prints `Already done #<id>`, exit 0, file rewritten (I-01).
- **AC-04** `remove <id>`: asks, only the word `yes` removes; anything else, or a closed/empty stdin (I-06), prints `Cancelled`, exit 0, file byte-identical; `--yes` skips the question.
- **AC-05 (CLI reader)**: verdict on all 13 fixtures equals `expected.json`, both by calling the reader and by running `list` on each.
- **AC-06 (CLI side)**: any invalid or unreadable data file: exit 3, stderr exactly one line `Cannot read <path>: <reason>`, file never overwritten, by any command.
- **AC-10**: the writer saves `.<name>.<pid>.<random>.tmp` in the same folder and renames it over the data file; the data file is never opened for writing; a failed write leaves the old file byte-identical and removes the temp file.

## Checks
| Check | Command or method | Actual result | Evidence | Faked or live? |
|---|---|---|---|---|
| CLI unit tests, folder form (as instructed) | `node --test cli/tests/` | DOES NOT WORK on Node 26.4.0: `Cannot find module ...\cli\tests`, reported as 1 test, 0 pass, 1 fail. Not a product failure; Node treats the folder as a module path | terminal output of this session | live |
| CLI unit tests, files listed | `node --test cli/tests/cli.test.mjs cli/tests/store.test.mjs` | tests 87, pass 87, fail 0, cancelled 0, skipped 0 | terminal output of this session | live (real processes, real temp files; AC-10 failure cases use an injected failing `rename`/`write`, see below) |
| Same, glob form | `node --test "cli/tests/*.test.mjs"` | tests 87, pass 87, fail 0 | terminal output | live |
| Fixtures vs `expected.json` | inside the 87: one reader test and one `list` test per fixture (13 + 13), plus overwrite tests for the 8 invalid ones | all pass | same run | live |
| AC-10 failed write | `store.test.mjs`: rename throws; write tears half-way; folder missing | old file byte-identical, no temp left | same run | the first two are faked failures (injected `fsImpl`), the third is a real failure |
| Hand check | `echo no \| node cli/todo.mjs remove 1 --file <temp copy of valid-two>` | stdout `Cancelled`, exit 0 | terminal | live |
| Hand check | `node cli/todo.mjs list --file contract/fixtures/invalid-not-json.json` | stderr `Cannot read contract/fixtures/invalid-not-json.json: not valid JSON`, exit 3 | terminal | live |
| `npm test` / integration | - | NOT RUN (Lead's script and tests; outside my folder) | - | - |
| No `./tasks.json` created in the project root | `ls` after the runs | none present | terminal | live |

## Interfaces as built
| Interface (SPEC reference) | Produce or consume | Fixture it was tested against | Any difference from the contract |
|---|---|---|---|
| Data file, read (SPEC 6) | consume | all 13 fixtures, verdicts equal `expected.json` | None. Rules applied: root is an object; `version === 1`; `nextId` integer >= 1 and > every id; `tasks` array; each task an object with `id` positive integer and unique, `title` string with 1-200 characters after `trim()`, `done` boolean, `created` any string. Unknown fields ignored. Missing file = empty list, `nextId` 1. Task order in the file is NOT a validity rule (see Interpretations) |
| Data file, write (SPEC 5, 6) | produce | all 5 valid fixtures rewritten and read back; byte format asserted | None. Exactly `JSON.stringify({version, nextId, tasks:[{id,title,done,created}]}, null, 2) + "\n"`, UTF-8, no BOM, LF newlines, keys in that order, tasks sorted by id, unknown fields dropped, `done` always a boolean under the name `done`, `created` from `toISOString()` for new tasks and kept as read for old ones |
| Write method (AC-10) | produce | own temp files | None. A temp file `.<basename>.<pid>.<random>.tmp` appears briefly next to the data file; a reader of the folder could see it; the data file itself is replaced by one rename. On Windows the rename is retried up to 5 times (20-100 ms) on EPERM/EBUSY/EACCES, for the moment another process holds the file open |
| CLI commands (SPEC 7) | produce | own temp files + fixtures | None on the specified parts. `node cli/todo.mjs <add\|list\|done\|remove> [args] [--file p]`; also accepted: `--file=p`, `--` to end options. Additions the contract does not specify are in Interpretations |
| Exit codes (SPEC 7) | produce | as above | 0 ok (incl. `Cancelled`, `Already done`) · 1 bad usage · 2 `No task #<id>` · 3 invalid/unreadable data file. One addition: a failed WRITE also exits 3, message `Cannot write <path>: <reason>` (contract names no code for it; see Mismatches) |
| stdout texts | produce | asserted exactly | `Added #<id>: <title>` · `[ ] #<id> <title>` / `[x] #<id> <title>` · `No tasks.` · `Done #<id>` · `Already done #<id>` · `Cancelled` · `Removed #<id>` (last one not in the contract) · `list --json`: the tasks array, two-space indented, four fields per task |
| stderr texts | produce | asserted | `No task #<id>` · `Cannot read <path>: <reason>` (one line; `<path>` is exactly the string given by `--file` / `TODO_FILE` / `./tasks.json`, not made absolute) · usage errors: a message line plus a `Usage:` line · the `remove` question |
| Settings (SPEC 5) | consume | own tests | None. `--file` > `TODO_FILE` > `./tasks.json`; an empty `TODO_FILE` counts as unset |
| `contract/fixtures/expected.json` | consume | itself | None; a test also fails if a fixture file has no verdict or a verdict has no file |
| Web interfaces | neither | - | The CLI exports nothing the web needs. `store.mjs` has exports, used only by `todo.mjs` and my tests |

## Baseline comparison (upgrades and repairs)
Not applicable: new build, no baseline.

## Interpretations
None of these change a verdict in `expected.json` or an AC result in my tests; each could matter at the seam or to the Lead's integration tests.

| Contract reference | What I assumed | Why | Risk if wrong |
|---|---|---|---|
| SPEC 6 "1-200 characters after trimming" | "Characters" = JavaScript `string.length` (UTF-16 units) and "trimming" = `String.prototype.trim()` | The simplest reading in a JS project; the contract does not define the unit | **Seam risk**: if the web reader counts code points or trims differently, a title of e.g. 150 emoji is refused by the CLI (300 units) but would be valid for the web, or the reverse. No fixture covers it. Builder C should state their unit; a fixture would settle it |
| SPEC 6 "Tasks stay in id order" | A rule for the writer, not a validity rule. A file with tasks out of id order is accepted, shown sorted, and written sorted | The "Valid when all hold" list does not include order | If the web reader refuses an out-of-order file, the two readers disagree on a hand-edited file. No fixture covers it. The CLI itself never writes one |
| SPEC 6 validity, JSON root | A root that is not an object (array, null, number) is invalid. A UTF-8 BOM at the start makes the file "not valid JSON" (plain `JSON.parse`, no BOM stripping) | Strict reading | A file saved by a Windows editor with a BOM is refused with exit 3. If the web strips BOMs, readers disagree. No fixture covers it |
| SPEC 6 integers | `Number.isInteger`: `1.0` in the file counts as `1`; ids above 2^53 are not specially handled | JSON has no integer type | Negligible |
| SPEC 6 / I-07 | Titles already in the file are written back exactly as read (not re-trimmed); only `add` trims | "dropped on write" is said only of unknown fields | A hand-edited title with outer spaces keeps them |
| SPEC 7 `remove` success | Prints `Removed #<id>` on stdout, exit 0 | The contract gives no success text for `remove` | A test expecting other text fails |
| AC-04 "asks for the word `yes`" | The question `Remove #<id> <title>? Type yes to confirm: ` is written to **stderr**, so stdout holds only `Cancelled` or `Removed #<id>`. The answer is the first line of stdin, whitespace-trimmed, and must equal `yes` exactly, lower case (`YES`, `y`, `yes please` cancel). Only the first line counts | SPEC 8 says success text on stdout, errors on stderr; a question is neither. stderr keeps stdout exact for scripts and tests | A check that stderr is empty after `remove` without `--yes` would fail; a check that looks for the question on stdout would fail |
| AC-04 order of checks in `remove` | Unknown id exits 2 before any question; invalid file exits 3 before any question | No point asking about a task that does not exist | None seen |
| SPEC 7 exit 1 vs exit 3 order | Usage errors are detected before the file is read: `add` with a 201-character title on an invalid file exits 1, not 3 | Bad usage does not depend on the file | A test expecting 3 there fails |
| SPEC 7 "non-numeric id" | An id must match `^\d+$` and be >= 1. `0`, `-1`, `1.5`, `1x`, `+1`, empty: exit 1. `007` is accepted as 7. Extra arguments after the id: exit 1 | "Ids are positive integers" | `done 0` is exit 1 here, where another reading might say exit 2 |
| SPEC 7 `add "<title>"` | Several words without quotes are joined with one space: `add Buy milk` = `add "Buy milk"`. A title starting with `--` needs `--` before it (`add -- --weird`) | Friendlier than refusing | A test expecting exit 1 for extra words fails |
| SPEC 7 options | Unknown `--option`: exit 1. `--json` only on `list`, `--yes` only on `remove`; elsewhere exit 1. `--file` with no value: exit 1. No command: exit 1. `list` with extra words: exit 1 | "1 bad usage" | A test passing `--yes` to another command gets exit 1 |
| AC-02 `list --json` | Prints the validated tasks, four fields each, id order, two-space indented, `[]` when empty or file missing. Unknown task fields are not echoed | "prints the tasks array" gives no format | A consumer expecting compact one-line JSON or the raw file fields: still parses; unknown fields are absent |
| SPEC 6 "missing file ... is created on the first write" | Reading commands never create the file. `done`/`remove` on a missing file exit 2 and create nothing. The parent folder is not created: a `--file` in a folder that does not exist fails on the first write | "First write" = the first `add` | A user pointing at a new folder gets `Cannot write ...` |
| SPEC 6 unreadable file | A path that is a folder, or a permission error, is exit 3 with reason `file cannot be opened (<code>)`; only "does not exist" counts as missing | "unreadable ... data file" → 3 | None seen |
| I-01 | `done` on an already-done task really rewrites the file (temp + rename), so unknown fields are dropped and formatting normalised by it | "file rewritten unchanged in content"; AC-09 depends on the rewrite | None seen |

## Mismatches and blockers
No blocker. Three items for the Lead:

1. **Test command.** Expected: `node --test cli/tests/` runs the tests. Observed: on Node 26.4.0 it fails with `Cannot find module ...\cli\tests` (1 test, 0 pass, 1 fail). Evidence: this session's output. Affected owner: Lead (`scripts/test.mjs`, SPEC 11), QA. Proposed: pass explicit file paths to `node --test` (SPEC 11 already says the script lists files, which is the working form), or the quoted glob `"cli/tests/*.test.mjs"`.
2. **No exit code for a failed write.** Expected: SPEC 7 names a code for every outcome. Observed: it names none for "the data file is valid but cannot be written" (folder missing, disk full, no permission). Built: exit 3, stderr `Cannot write <path>: <reason>`, old file intact. Options: (a) keep 3 and add it to SPEC 7; (b) a new code; (c) exit 1. Affected owner: Lead (contract). Not an AC result today.
3. **Three reader rules no fixture pins down** (title length unit, out-of-order tasks, BOM), listed in Interpretations. Expected: both readers agree on every file. Observed: unknowable from my side; the fixtures leave these open. Affected owner: Lead (fixtures), Builder C. Proposed: add fixtures, e.g. `valid-out-of-order.json`, a title of 150 astral characters, and a BOM file, each with a decided verdict; I will follow whatever is decided.

## Abstentions
- AC-05 web reader, AC-06 web side, AC-07, AC-08, AC-09 (web half), AC-11, AC-12: not mine; not built, not tested.
- `npm test` and `tests/integration/`: not run; owned by the Lead.
- A real mid-write crash (power loss, killed process) was not staged; AC-10 is shown with injected failures at the write and at the rename, plus one real failed write.
- A real permission-denied data file was not tested (not portable to stage on Windows); the code path is the same as the folder-in-place-of-file case, which is tested.
- macOS and Linux: not run; only Windows 11, Node 26.4.0.

## Repair history
| Attempt | Failure addressed | Change | Result |
|---|---|---|---|
| - | none; the first full run passed 87/87 | - | - |

## Folder contracts
Updated `cli/CONTEXT.md`: real run command with options; test commands that work (files listed, or glob) with the observed count 87/87; a note that the bare folder form fails on Node 26; the layer rule as followed (`todo.mjs` prints and sets exit codes, `store.mjs` does all file work and only throws); test file names; extended Avoid list (`process.exit()`, imports from `web/`, dependencies).

Proposed to the Lead (not edited by me):
- Root `CONTEXT.md` / `AGENTS.md`: wherever a per-folder test command is shown, use explicit files or the glob, not `node --test <folder>/`.
- `_shared/glossary.md`: add "character (in a title) = one JavaScript string unit (`title.length`)" or whatever unit is decided, so both readers count the same.
- SPEC 7 (contract change, owner decides): a row for write failure; the `remove` success text `Removed #<id>`; where the `remove` question is printed.

## For the next role
- Required inputs: none beyond the repo. Environment: Node 20+ (run on 26.4.0), no install.
- Commands: `node cli/todo.mjs add "Buy milk" --file <path>` · `list [--json]` · `done <id>` · `remove <id> [--yes]`. Tests: `node --test cli/tests/cli.test.mjs cli/tests/store.test.mjs`.
- For the integration tests: stdout texts are exact and newline-terminated; `remove` without `--yes` needs stdin (`yes\n`), and its question goes to stderr; use `--yes` for unattended runs. For AC-09, `done <id>` on an already-done task rewrites the file and prints `Already done #<id>`. While the CLI writes, a file named `.<name>.<pid>.<random>.tmp` exists briefly beside the data file.
- For Builder C (via the Lead): the file the CLI writes is described byte for byte in "Interfaces as built"; please compare your reader on the three open rules in Mismatches item 3.
- Known limits: no file locking, so two CLI commands at the same moment can lose one update (last rename wins; the file is never corrupt). Single user by design (SPEC 1).
- Approval needed: none for this unit. Contract changes above need the owner.

## Reuse candidates (optional)
- Candidate: temp-file-then-rename JSON writer with an injectable `fsImpl` for failure tests, and Windows rename retry · from: `cli/store.mjs` `saveStore` · proven under: Fable 5.2, Claude Code agent, small build (2 source files, 87 tests) · applies to: any single-file JSON store · how to test: `cli/tests/store.test.mjs` AC-10 tests · status: PROPOSED
- Candidate: fixture loop that fails when a fixture has no verdict or a verdict has no file · from: `cli/tests/store.test.mjs` first test · proven under: same · applies to: any contract-fixture build · how to test: add an unlisted file to a copy of the fixtures folder · status: PROPOSED
