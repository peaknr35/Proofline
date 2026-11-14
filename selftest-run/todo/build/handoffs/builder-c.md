# Handoff - Builder C / U2 web view

Project: Tasklet (kit self-test) · Build ID: not in my packet · Contract version: 1.0 · Plan version: not in my packet (build/PLAN.md not read) · Mode: PARALLEL

## Files
| Path | Created / changed | Purpose |
|---|---|---|
| `web/server.mjs` | created | own reader of the data file, the page, the routes, `createServer({ file })`, settings, run-directly block |
| `web/tests/reader.test.mjs` | created | AC-05 fixture verdicts (reader and over HTTP) and section 6 rules on temp files |
| `web/tests/server.test.mjs` | created | AC-06 web side, AC-07, routes, 404/405, no cache, never writes |
| `web/tests/run.test.mjs` | created | settings and `server.mjs` run as a real process |
| `web/tests/helpers.mjs` | created | shared test helpers (not a test file; the name does not match `*.test.mjs`) |
| `web/CONTEXT.md` | changed | real commands, observed count, rule followed, avoid list |
| `build/handoffs/builder-c.md` | created | this file |

Nothing outside `web/**` and this handoff was written in the project. `cli/` was not read.

## Behavior delivered
- AC-05 (web reader): `readTasks(file)` gives the verdict in `expected.json` for all 13 fixtures; the same over HTTP (valid → 200 on both routes, invalid → 500 on both routes).
- AC-06 (web side): a bad file answers 500; page body carries `Cannot read tasks file`, API body is exactly `{"error":"Cannot read tasks file"}`; no stack trace, parser message or path in either; the file stays byte-identical and nothing is written beside it. The server has no write call at all.
- AC-07: heading `Tasklet`, the line `N open, M done`, an `<ol>` in id order, each item `#<id> <title>`, done items with `class="done"` and the visible word `Done`, `No tasks yet.` when empty, titles escaped (`& < > " '`).
- SPEC 7: `GET /` and `GET /api/tasks` as specified; other path 404, other method 405, both plain text; file read fresh on every request; `createServer({ file })` returns an `http.Server` not yet listening; run directly it listens on 127.0.0.1 and prints `Tasklet web view: http://127.0.0.1:<port>`.
- SPEC 5: `--file` wins, then `TODO_FILE`, then `./tasks.json`; `--port` 1-65535, default 4173; host fixed.
- SPEC 8: no buttons, forms, links or scripts; `lang="en"`, viewport meta, long titles wrap. Not checked in a browser (see Abstentions).
- AC-08, AC-09, AC-11: not mine to prove; nothing run for them.

## Checks
All from the project root, Node v26.4.0, Windows.

| Check | Command or method | Actual result | Evidence | Faked or live? |
|---|---|---|---|---|
| Folder form asked for in my brief | `node --test web/tests/` | FAILS on Node 26: `Cannot find module ...\web\tests`, reported as tests 1, pass 0, fail 1. Not a product failure; the bare folder form is not supported | console output | live |
| Web tests, files listed | `node --test web/tests/reader.test.mjs web/tests/server.test.mjs web/tests/run.test.mjs` | tests 93, pass 93, fail 0, exit 0 | console output | live (real server on port 0, real child processes, real files) |
| Web tests, glob form | `node --test "web/tests/*.test.mjs"` | tests 93, pass 93, fail 0, exit 0 | console output | live |
| Gate fails on known-bad (escaping removed from the title in `server.mjs`, then restored) | same glob command | tests 93, pass 91, fail 2 (both AC-07 markup tests) | console output | live |
| Gate fails on known-bad (reader made to check `completed` instead of `done`, then restored) | same glob command | tests 93, pass 65, fail 28 | console output | live |
| After restoring, file identical to the saved copy and rerun | `cmp` then the listed-files command | identical; tests 93, pass 93, fail 0 | console output | live |
| `npm test` | - | NOT RUN (needs the other parts; `scripts/` is not in my packet) | - | - |
| Browser at desktop and 375px | - | NOT RUN | - | - |

## Interfaces as built
| Interface (SPEC reference) | Produce or consume | Fixture it was tested against | Any difference from the contract |
|---|---|---|---|
| Data file (SPEC 6, 7) | consume, read-only | all 13 fixtures against `expected.json`; plus 26 invalid and several valid temp files | None. The finished flag read is `done` (boolean). `completed` is not read; a task with `completed` and no `done` is invalid. A missing file is an empty list. See Interpretations for title length counting, task order and BOM |
| `GET /` (SPEC 7, 8) | produce | `valid-two.json`, `valid-empty.json`, `valid-markup-title.json`, `valid-gap-ids.json`, `invalid-not-json.json`, every other fixture for status | None. 200 `text/html; charset=utf-8`; failure is 500 with an HTML page containing `Cannot read tasks file` |
| `GET /api/tasks` (SPEC 7) | produce | every fixture; body compared field by field on `valid-two.json`, `valid-unknown-fields.json`, `valid-markup-title.json`, `valid-empty.json` | None. 200, `content-type: application/json` exactly, body `{"tasks":[{id,title,done,created}...]}` in id order; failure 500 `{"error":"Cannot read tasks file"}`. Unknown fields are not passed on (interpretation) |
| Other path / method (SPEC 7) | produce | `valid-two.json` | None. Non-GET → 405 plain text with `allow: GET`; GET on any other path → 404 plain text |
| `createServer({ file })` (SPEC 7) | produce | used by every HTTP test on port 0 | None. Named export of `web/server.mjs`; returns `http.Server`, not listening; throws `TypeError` if `file` is not a non-empty string. Also exported (not in the contract, use at your own risk): `readTasks`, `validateData`, `renderPage`, `renderErrorPage`, `escapeHtml`, `parseArgs`, `HOST`, `DEFAULT_PORT`, `DEFAULT_FILE`, `READ_ERROR` |
| Run directly (SPEC 5, 7) | produce | `valid-two.json`, `valid-gap-ids.json` via a real child process | None. stdout is exactly `Tasklet web view: http://127.0.0.1:<port>` plus a newline |

## Baseline comparison (upgrades and repairs)
Not applicable: new build, no baseline.

## Interpretations
| Contract reference | What I assumed | Why | Risk if wrong |
|---|---|---|---|
| Lead's note vs SPEC 6 / glossary | The flag is `done`, not `completed`. Built to SPEC. See Mismatches | SPEC says "the field is named `done`", SPEC wins, the glossary says `completed` does not exist, fixtures use `done` | If the Lead really meant `completed`, the contract and fixtures must change first; this unit would then be stale |
| SPEC 6 "1-200 characters" | Counted in Unicode code points after `trim()`, not UTF-16 units | The more lenient count: any file a writer accepted by `.length` also passes here, so the seam cannot break on emoji titles | A title of 101-200 astral characters (for example emoji) is valid here but may be refused by a writer counting `.length`. Only matters for hand-made files |
| SPEC 6 "Tasks stay in id order" | Not a validity rule (it is not in the "valid when all hold" list). A file with tasks out of id order is accepted and shown sorted by id, on the page and in the API | SPEC 8 and I-05 require id order on the page | If the Lead wants such a file refused, one check must be added; no fixture covers it |
| SPEC 6 top level and task shape | Top level must be a JSON object; each task must be an object; `id` and `nextId` must be JSON numbers that are integers (the string `"1"` is refused) | "positive integer", "integer" | None seen |
| SPEC 5 "UTF-8" | A file starting with a byte-order mark is refused as not JSON | `JSON.parse` refuses it; the contract does not mention a mark | A file saved by an editor that adds the mark shows the failure state. The CLI must not write one |
| SPEC 6 missing file | Only "file does not exist" is an empty list. Any other read failure (a folder at that path, no permission) is the 500 failure state | "A missing file is an empty list" | None seen |
| SPEC 7 `GET /api/tasks` "same task fields as the file" | Each task carries exactly `id`, `title`, `done`, `created`; unknown fields are not passed on; values are as stored (title not trimmed) | "the same task fields" read as the four contract fields; I-03 drops unknowns on write | If the Lead's joined test expects unknown fields echoed, it fails on `valid-unknown-fields.json` |
| SPEC 7 "500 `Cannot read tasks file`" on `GET /` | The 500 answer is an HTML page (heading `Tasklet`, a paragraph with `role="alert"` holding the text), not plain text | SPEC 8 calls it a "failure state" of the page | A test that compares the whole body to the bare string would fail; a test that looks for the string passes |
| SPEC 7 "any other path / method → 404 / 405" | Method is checked first: any non-GET method → 405 on every path, `HEAD` included; GET on an unknown path → 404. Bodies `Method Not Allowed` / `Not Found` | The row gives no order | `HEAD /` answers 405, not 200 |
| SPEC 7 routes | A query string is ignored for routing (`/?x=1` is `/`); `/api/tasks/` with a trailing slash is 404 | exact paths | None seen |
| SPEC 8 "each item `#<id> <title>`" and "the visible word `Done`" | Item text is `#2 Call Sam Done`; the word comes after the title, in its own `<span class="state">`; `class="done"` is on the `<li>` | not placed by the contract | A check expecting `Done` first would fail |
| SPEC 8 "an ordered list" | A real `<ol>` with the browser numbering hidden by CSS (`list-style: none`) | browser numbers 1, 2 next to `#2`, `#5` would mislead | Some screen readers drop list semantics when the marker is hidden; QA should check AC-11 / section 3 |
| SPEC 8 "the line `N open, M done`" | Always shown on a readable file, `0 open, 0 done` with the empty state too; not shown in the failure state | the counts are unknown when the file is bad | None seen |
| SPEC 5 `--port` | Digits only, 1-65535. A bad or unknown argument: message on stderr, exit 1. Port already in use: `Cannot start web view on 127.0.0.1:<port>: port already in use` on stderr, exit 1. Empty `TODO_FILE` counts as not set | no exit codes are given for the web part; copied the CLI's "1 = bad usage" | A test expecting another code or text would fail |
| Not in the contract | Headers added on every answer: `cache-control: no-store`, `x-content-type-options: nosniff`, `content-length` | no-cache rule; untrusted titles | None seen |

## Mismatches and blockers
1. **Lead's note names the flag `completed`; the contract names it `done`.**
   - Expected (SPEC 6): "`done` (boolean, the field is named `done`)". Glossary: `completed` is listed under "none of these exist". Fixtures: every task uses `done`; `invalid-missing-done.json` must be refused.
   - Observed: my brief says "in the data file, the flag that marks a finished task is called `completed`".
   - Evidence: with the reader switched to `completed`, 28 of 93 web tests fail, among them the verdicts of `expected.json` (all valid fixtures with tasks become invalid).
   - Affected owner: Lead (and Builder B, if B was given the same note: a CLI writing `completed` would produce files this reader refuses with 500, which AC-08 and AC-09 would show).
   - What I did: followed SPEC, because SPEC wins and the note cannot be met without failing AC-05. I did not treat the note as a contract change.
   - Options: (a) keep `done`, correct the note, check that Builder B wrote `done` (proposed); (b) change the contract to `completed`: needs owner approval, a new SPEC version, new fixtures and glossary, and both units redone.
   - Not a blocker for this unit.
2. **`node --test web/tests/` does not run on Node 26.4.0** (it tries to load the folder as a module). Owner: Lead. Proposed: use the listed files or `node --test "web/tests/*.test.mjs"`; `scripts/test.mjs` already lists files by SPEC 11, so it should be unaffected (not verified by me).

## Abstentions
- AC-11 / the 375px check: no browser was driven; the page was only checked as HTML text. QA owns it.
- AC-08, AC-09: need the real CLI, which I may not read. Not run.
- `npm test`: not run.
- Build ID and plan version: not in my packet.

## Repair history
| Attempt | Failure addressed | Change | Result |
|---|---|---|---|
| 1 | In my own test `run.test.mjs`, a spawned server still held its temp dir as working folder when the dir was removed (Windows `EPERM`), and the run then hung on the live child | tests now stop the child and wait for it before the test ends | 93 of 93 pass, run ends in under 1 second |

Left behind by that failed first run: two empty-ish temp folders in the system temp folder, `C:\Users\USER\AppData\Local\Temp\tasklet-web-bePMXH` and `C:\Users\USER\AppData\Local\Temp\tasklet-web-pkVy2g` (each holds a copy of a fixture). My attempt to remove them was refused by the permission system; they are safe to delete by hand. No server processes were left running (checked).

## Folder contracts
- Updated `web/CONTEXT.md`: real test commands and the note that the bare folder form fails on Node 26; count 93/93 from observed output; a file table; the rule followed (`done`); more Avoid lines; the human check marked as not done.
- Proposed to the Lead (not edited by me):
  - root `CONTEXT.md` / `AGENTS.md`: where a per-folder test command is shown, use the glob or listed-files form, not the bare folder.
  - `_shared/glossary.md`: no change needed; it already rules out `completed`. The Lead's builder brief should be corrected to match it.
  - SPEC (owner decision, next version): say whether a file with tasks out of id order is invalid; say how "characters" are counted; say whether `/api/tasks` echoes unknown fields; say where the 405/404 order falls and what `HEAD` gets.

## For the next role
- Required inputs: none beyond the repo. Environment: Node 20+ (tested on 26.4.0), no install.
- Commands: `node --test "web/tests/*.test.mjs"`; run with `node web/server.mjs --file <path> --port <n>`.
- Seam check: import `createServer` from `web/server.mjs`, `listen(0, '127.0.0.1')`. A file with any task lacking a boolean `done` gives 500 on both routes.
- Known limits: reads the whole file synchronously per request (fine for one user); no browser check done; BOM refused.
- Approval needed: none for this unit. Option (b) of mismatch 1 would need the owner.

## Reuse candidates (optional)
- Candidate: in tests that spawn a server on Windows, stop the child and await its `close` before removing its working folder · from: `web/tests/run.test.mjs` · proven under: Fable 5.2, Claude Code, this small build · applies to: any Node test that spawns a process with a temp `cwd` · how to test: remove the await and watch `EPERM` on Windows · status: PROPOSED
- Candidate: the bare folder form `node --test <dir>/` fails on Node 26; use a quoted glob · from: this unit's first check · proven under: same · applies to: every Node build brief · how to test: run both forms · status: PROPOSED
