# GATE-RESULT - spec gate for todo, run 2

Project: todo · Contract version: 0.2 (DRAFT) · Run by: Claude Opus 5.5 (claude-opus-5-5), Claude Code subagent · Fresh context (did not run gate run 1; given only PACKET.md, SPEC-GATE.md, SPEC.md, contract/fixtures/ and GATE-RESULT-run1.md, which was read only for the closure table) · Date: 2026-11-15

Checks run with node v26.4.0, read-only, against a literal reading of the SPEC text:
- `titles.json`: 41 of 41 cases match SPEC 6.2 (join, NFC, trim, refused class, empty, code-point count, count value).
- `ids.json`: 17 of 17 cases match SPEC 6.3.
- `stores/`: 45 of 45 files match `stores/index.json` under SPEC 6.1 steps 1-6 (error name, `fileVersion`, ids in display order, `nextId`); no file unlisted, none missing.
- A file starting with two BOMs, run through both possible readings of step 2: one reading loads it, the other gives E_FILE_DAMAGED (see A3).
- Every `cli-cases.json` case (70) and `web-cases.json` case (21 + 3 startup) read against 6.5, 7.1, 7.2 and 8.2; every fixture name cited in 6.4, section 2 and section 14 exists.

## A. Every piece of text that comes in (titles, names, messages, file contents)

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| A1 | Length limit counted in what? | PINNED. Unicode code points (`[...s].length`) after join, NFC and trim; max 200; the count is printed in E_TITLE_TOO_LONG. | `titles.json` 199/200/201 ascii, "200 emoji (at limit, 400 UTF-16 units)", "201 emoji", skin-tone cases, "zero width joiner allowed", 200/201 decomposed e-acute; AC-01 |
| A2 | Normalized before counted, compared, stored? Which form? | PINNED. NFC before trim, refused check and count; stored titles must already be NFC (else damaged). Commands compared case-sensitive, not normalized. Host header compared case-insensitively. | `titles.json` "decomposed e-acute stored as one code point"; `invalid-title-not-nfc.json`; cli "commands are case sensitive"; web "host header is case-insensitive" |
| A3 | Encoding on disk and on the wire | OPEN. Settled: file is UTF-8, written without BOM; invalid bytes -> E_FILE_DAMAGED, never repaired; lone surrogates refused (title) / damaged (file); HTTP bodies `charset=utf-8`; request bodies never read. Gap: step 2 prescribes `new TextDecoder('utf-8', { fatal: true })`, which already drops a leading BOM by itself (default `ignoreBOM: false`, confirmed in node), and then says "One leading BOM (U+FEFF) is dropped" as if a separate step. Read as one combined step, a file starting with two BOMs is E_FILE_DAMAGED; read as decoder plus an extra strip, it loads (and the next write removes both). No fixture has two BOMs. | Checked in node: double-BOM file -> E_FILE_DAMAGED under one reading, valid under the other. Settled parts: `invalid-bad-utf8.json`, `invalid-title-lone-surrogate.json`, `valid-bom.json`, `valid-escaped-title.json`; cli "invalid UTF-8 is damaged, not repaired", "BOM file is accepted and written back without BOM" |
| A4 | Empty, and only spaces | PINNED. Trimmed with `String.prototype.trim` (includes no-break and ideographic space); empty after trim -> E_TITLE_EMPTY; `add` with no args at all -> E_USAGE_MISSING_TITLE. In a file, an untrimmed or empty title is damaged. | `titles.json` "empty string", "only spaces", "only tab and newline", "no-break space trimmed", "ideographic space trimmed"; cli "title empty", "add without title"; `invalid-title-empty.json`, `invalid-title-untrimmed.json` |
| A5 | Control characters, line breaks, null bytes | PINNED. Refused with E_TITLE_CONTROL by the exact class `/[\p{Cc}\p{Cs}  ‪-‮⁦-⁩]/u`, checked after trim and before empty and length; in a file -> E_FILE_DAMAGED; in paths replaced by `?` (`safeText`). ZWJ allowed. | `titles.json` tab, newline, CR, NUL, ESC, DEL, C1, U+2028, U+2029, bidi override, bidi isolate, lone surrogates, "control and too long: control wins"; `invalid-title-control.json`; AC-14 |
| A6 | Fixtures at limit, one under, one over; emoji; accented | PINNED. | `titles.json` 199/200/201 ascii, 200/201 emoji, 200/201 decomposed e-acute, "100 + 99 joined", "100 + 100 joined"; `valid-title-200.json`, `invalid-title-201.json`; cli "title at limit is accepted", "title too long" |
| A7 | Made safe on each surface | PINNED. Page: `escapeHtml` on every title, CSP without scripts. Terminal: titles carry no control/bidi characters (validated at input and load); unknown commands never echoed; paths through `safeText`. Plain-text web bodies: only `safeText` paths. Logs: none written. File names: none derived from input. | web "html in titles is escaped"; cli "unknown command is not echoed", "damaged file: control char in stored title"; AC-07, AC-14; SPEC 9 |

## B. Every number, date and id

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| B1 | Lowest and highest; zero; negative; not a number | PINNED. Id argument: `^[1-9][0-9]*$`, <= 2^53-1. Port: same syntax, 1..65535. Stored id: integer 1..2^53-1, unique. `nextId`: integer 1..2^53 and above every id; at 2^53 `add` -> E_ID_LIMIT, other commands work; above -> damaged. `version`: integer, 1 only. All checks are on the parsed JSON value. | `ids.json` (17); cli "serve port zero/too high/not a number/leading zero/missing value"; `invalid-id-zero.json`, `invalid-id-string.json`, `invalid-nextid-zero/-low/-missing/-over/-huge.json`, `valid-nextid-max.json`, `valid-nextid-exhausted.json`; cli "last task number is usable", "no task numbers left: ..." (2), "nextId above the limit is damaged" |
| B2 | Ids: who makes them, reused after delete, duplicates | PINNED. todo assigns `nextId` and increments it; never reused after remove; duplicate id in a file -> damaged. | cli "ids are never reused", "nextId gap is respected"; `invalid-dup-id.json` |
| B3 | Dates: format, time zone, who sets the clock | PINNED. `new Date().toISOString()` from the system clock (UTC, ms, `Z`); load requires the exact pattern and a round trip through `Date`; `doneAt` null when open, timestamp when done; `done` twice keeps the first `doneAt`. | `invalid-createdAt-format.json`, `invalid-createdAt-impossible.json` (30 February), `invalid-done-without-doneAt.json`, `invalid-open-with-doneAt.json`; cli "done twice" (`<SAME:2>`); AC-11 |
| B4 | Rounding and units | N/A. No money, percentages or fractional quantities; every number is an integer count, id or port. | - |

## C. Every list and every output

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| C1 | Order of results; tie-break | PINNED. Id ascending everywhere (list, each page section, the file after any write); ids are unique so no ties. | cli "list two tasks, sorted by id", "write sorts tasks by id"; web "tasks sorted by id within each section" |
| C2 | Empty result | PINNED. CLI `No tasks.`; page `Open (0)`, `Done (0)` and two `<p class="empty">None.</p>`; missing file is an empty store and is not created. | cli "list with no file", "list empty store", "parent folder missing: list is empty"; web "empty list", "no file at all" |
| C3 | Exact shape of anything another program reads | OPEN. Settled: stdout lines (7.1), stderr messages (6.5), help bytes, exit codes, web statuses/bodies/headers, file whitespace (`JSON.stringify(store, null, 2) + '\n'`, no BOM). Gap: the key order of objects todo creates (a new file's top level, a new task) is not stated in the text; the 6.1 example and the fixture "end" objects show `version, nextId, tasks` and `id, title, done, createdAt, doneAt`, but the cli-cases rule does not say whether "end" is compared as parsed values (order ignored) or as bytes (order fixed). Two builds can write different bytes for the same command and both pass under the first reading. | Settled parts: `cli-cases.json` (exact stdout/stderr), `help.txt`, `web-cases.json`, AC-05, AC-06; gap: cli-cases `rule` text |
| C4 | Limits | PINNED. No limit on number of tasks or file size; tested at 1000 (list prints 1000 lines, page 1000 items); title 200 code points; ids up to 2^53-1; HTTP request limits are Node defaults (non-goal); request bodies never read. | `valid-1000.json`; cli "1000 tasks are listed"; web "1000 tasks"; AC-20; SPEC 10 "Limits" |

## D. Every way it can fail

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| D1 | Every error named, with exit code or status and exact message, in one table | OPEN. Settled: the 6.5 table names all 19 CLI errors with exit code and exact message, including E_INTERNAL (exit 1, AC-21), `--help x`/`-h x` (E_USAGE_EXTRA_ARGS naming `help`), E_SERVE_FAILED (AC-19, code reading). Web 403/404/405 and the three file-error 500s are exact in 7.2, 6.5 and `web-cases.json`. Gap: the web "any other unexpected error" response (500, body `Internal error\n`) has no stated content-type (7.2 says "a content-type from the fixtures" and no fixture covers it), no name, and no criterion, fixture or known-bad sample, so a server that shows the error detail or a stack passes every check. | Settled: `cli-cases.json` (every CLI error except E_INTERNAL, E_SERVE_FAILED, E_PORT_IN_USE), startupCases "port in use", AC-19, AC-21; gap: SPEC 6.5 last paragraph, 7.2 "content-type from the fixtures" |
| D2 | Every invalid fixture names its error | PINNED. Every `invalid-*.json` names its error in `stores/index.json` (E_FILE_VERSION also its `fileVersion`); every failing `titles.json`/`ids.json` case names its error; every failing cli/web case gives exact exit or status and message. | `stores/index.json`, `titles.json`, `ids.json`, `cli-cases.json`, `web-cases.json` |
| D3 | Missing, unreadable, damaged, wrong version | PINNED. Missing (ENOENT, incl. missing parent) -> empty store, nothing created; other read error -> E_FILE_UNREADABLE (3); damaged -> E_FILE_DAMAGED (3); integer version other than 1 -> E_FILE_VERSION (3) with the version; file never rewritten in any of these. Web: 500 with the matching body. | cli "task file is a directory" (2), "parent folder missing" (2), "damaged file: ..." (3), "newer version refused"; web "damaged file", "newer version file", "task file is a directory", "no file at all"; AC-03, AC-12 |
| D4 | Unknown fields | PINNED. Kept at top level and per task, at value level: big numbers lose digits, last duplicate key wins, `__proto__` kept as an own field. | `valid-unknown-fields.json`, `valid-unknown-bignum.json`, `valid-dup-key.json`, `valid-proto-key.json`; cli "unknown fields survive a write", "unknown __proto__ key kept as a plain field", "unknown fields keep their parsed value", "duplicate unknown key: last one kept" |
| D5 | Two errors at once | PINNED. CLI: usage -> input -> file -> lookup or id limit -> save. Inside `serve`: args left to right, first problem wins, `--port` always takes the next arg, a second `--port` -> E_USAGE_EXTRA_ARGS. Titles: control -> empty -> too long. Web: Host -> method -> path -> load. Load: steps 1-6, first failure wins. | cli "two errors: ..." (4), "serve: ..." (4), "serve port given twice"; `titles.json` "control and too long: control wins"; web "DELETE on unknown path: method checked first" |

## E. State, time and cleanup

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| E1 | Two writers at once | PINNED (as a stated non-goal). Last rename wins; one change can be lost; no locking. | SPEC 10, non-goals, IR-18 (no fixture: non-goal) |
| E2 | Stopped halfway through a write | PINNED. Temp file in the same folder, then rename: the target is the old or the new whole file; a stray `*.tmp-*` can remain only on a kill between write and rename; it is never read, changed or removed. (See F3 on whether AC-04's check can catch an in-place writer.) | AC-04; cli "stray temp file is never read"; SPEC 6.1 "Save", 10 |
| E3 | Same request twice | PINNED. `add` twice adds two; `done` twice is a no-op with no write; `remove` twice -> E_NOT_FOUND; GET is read-only. | cli "done twice", "full journey" (second `remove 2` -> exit 4); AC-11 |
| E4 | What it creates outside its data file | PINNED. Only the temp file (removed on success and failure); no logs, no caches; `serve` writes nothing; tests use `todo-test-*` folders under the OS temp folder and remove them. | AC-04, AC-12, AC-18; SPEC 9 "no logs", 11 |
| E5 | Outside action with unknown outcome | N/A. No outside actions: no network, no external services (SPEC 10 "External outcomes: none"). | - |

## F. The surface is closed

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| F1 | Every command, flag, route, screen action, setting, env var, output format and file written is listed | PINNED. 7.4 lists commands, `--port`, `TODO_FILE`, routes, outputs, exit codes, the data file and its temp file, and `package.json`; no screen actions (page is read-only); stopping `serve` is stated (no signal handler, exit code outside the contract). | SPEC 5, 7.1, 7.4, 8.2; IR-30 |
| F2 | Anything not on the list is not built | PINNED. "Nothing outside this table is built. An extra found later is removed or proposed as an amendment." plus the non-goals list. | SPEC 7.4, 1 |
| F3 | Every listed item has a criterion; every criterion has a check and a known-bad sample | OPEN. Every 7.4 item names a criterion and every AC-01 to AC-21 has a check and a known-bad sample; run 1's gaps are closed. Gap: AC-04's check cannot fail on its own known-bad sample as written. The check "inspects the folder after a successful save and after a failed save (target is a directory)". A save that writes the target in place leaves no temp file in either case, so it passes. "Simulated by a save that throws mid-way" needs a way to make `saveStore` throw between write and rename, and 7.3 defines none (`saveStore(file, store)` only). Whether the test spies on `node:fs` (for example `mock.method` on rename and write) or uses an injection point is unstated. | SPEC 2 AC-04, 7.3; every other AC checked row by row |
| F4 | Every seam has a check only the joined system passes | PINNED. CLI and store round trip both ways (AC-10); CLI and server on one file with the server running (AC-09); server and page in a real `todo serve` child (AC-08); CLI to `startServer` startup line and port in use (AC-08 startupCases); test runner on an empty folder (AC-15). | AC-08, AC-09, AC-10, AC-15 |

## G. Words that are not yet requirements

| Soft word and where | Turned into (criterion ID) or moved to non-goals |
|---|---|
| "one-page" (request; SPEC 1) | AC-07, AC-08: exactly one HTML route `/`, no external resources (web cases "unknown path", "index.html is not an alias", mustNotContain `http://`, ` src=`, `<link`) |
| "list" (request: to-do list) | AC-05: exact `list` output format |
| "readable" (run 1, contract) | IR-32: no `font-size`, no `px` widths; web "style sets no font sizes and no pixel widths"; AC-07, AC-17 |
| "harmless" (run 1, stray temp file) | removed; replaced by "never read, changed or removed", cli "stray temp file is never read" |
| "usable at phone width" (AC-17) | viewport meta (AC-07, web "page with two tasks") plus no element wider than 375px (QA, browser, or `NOT RUN`; non-blocking) |
| "safe" (7.1 "titles printed to the terminal are safe") | defined by the 6.2 refused class at input and at load (AC-01, AC-03) and `safeText` for paths (AC-14) |
| "real browser if available" (AC-16, AC-17) | the fallback is stated for each (AC-16: HTTP; AC-17: `NOT RUN`, non-blocking), so a check runs in either case |
| "how done items look is the builder's choice" (8.2) | a deliberate freedom, not a requirement; still bounded by the style check and the section structure |
| "small" (help.txt) | product copy; fixed bytes by AC-06 |

No soft word remains as a requirement. G is PINNED.

## Ask or assume

| # | The gap | Would a different answer change what a user sees, what is stored, money, security, or something hard to undo? | So | The one answer | Fixture added | Register row |
|---|---|---|---|---|---|---|
| A3 | Step 2: the prescribed decoder already drops one BOM; is "one leading BOM is dropped" that same drop, or another one? A file starting with two BOMs is damaged under one reading and loads under the other. | Yes, narrowly: what the user sees for such a file (a "damaged" error or their list). No data is lost either way, and the next write removes both BOMs. | Ask (the Lead may judge it small enough to assume) | | | |
| C3 | Key order of objects todo creates (new file top level, new task) is not in the text, and the cli-cases rule does not say whether "end" is compared as parsed values or as bytes. | No: the stored JSON value is the same; only byte order of keys differs. No reader in the contract depends on key order. | Assume | | | |
| D1 | Web "any other unexpected error" (500 `Internal error\n`): content-type unstated, no name, no criterion, fixture or known-bad sample. A server that leaks the error detail passes. | No for normal use: only reached through a bug, local only, single user. Security impact is minimal (detail shown to the owner on 127.0.0.1). | Assume | | | |
| F3 | AC-04's check (inspect the folder after success and after a directory-target failure) does not fail on its known-bad sample (in-place write); how the test makes a save throw between write and rename is unstated. | No: the save rule in 6.1 is clear, so a correct build behaves the same. Only whether a regression to in-place writing (data loss on crash) would be caught depends on it. | Assume (the Lead states the method, for example a `node:test` mock of `node:fs`, or adds an injection point to 7.3) | | | |

## Run 1 OPEN lines, checked on v0.2

| Run 1 line | v0.2 | Reason |
|---|---|---|
| A3 | original gaps closed; line still OPEN on a new gap | Invalid UTF-8 (fatal decoder, `invalid-bad-utf8.json`, cli case) and lone surrogates (refused class `\p{Cs}`, titles cases, `invalid-title-lone-surrogate.json`, cli case) are pinned and verified. New: the BOM step can be read two ways (double BOM). |
| B1 | closed | `nextId` <= 2^53, E_ID_LIMIT at the ceiling, damaged above it; four store fixtures and four cli cases, verified. |
| C1 | closed | cli "write sorts tasks by id" (unsorted start, sorted end array). |
| C4 | closed | SPEC 10 "Limits", AC-20, `valid-1000.json`, cli and web 1000-task cases. |
| D1 | (a), (b), (c) closed; line still OPEN on a new gap | (a) E_INTERNAL row + AC-21; (b) cli "--help with extra", "-h with extra"; (c) AC-19, code reading, non-blocking. New: the web generic 500 has no content-type and no check. |
| D4 | closed | Value-level rule in 6.1 + `valid-unknown-bignum`, `valid-dup-key`, `valid-proto-key` and their cli cases. |
| D5 | closed | Left-to-right serve rule in 6.5 + four "serve: ..." cases, plus "serve port given twice". |
| F1 | closed | 7.1 serve row: no signal handler, nothing printed, exit code outside the contract (IR-30). |
| F3 | original gaps closed; line still OPEN on a new gap | AC-16 bad sample, AC-19, web "host header is case-insensitive", "write sorts tasks by id", web "style sets no font sizes and no pixel widths" all present. New: AC-04's check does not catch its own bad sample. |
| G | closed | "readable" -> IR-32 + web style fixture; "harmless" replaced by a checked statement. |

Note for the Lead (not a gate line): IR-23 to IR-26 are pinned in the text with fixtures, so their gate lines count as PINNED, but they are still marked "ASKED AT APPROVAL, Lead recommends", which means the person has not answered yet. If the person picks a different answer at approval, the fixtures change and the gate must run again. Run 1 also classed D1 (a)/(b) and D5 as "ask"; v0.2 records them as ASSUMED BY LEAD (IR-27 to IR-29). That is the Lead's call, and those rows will be shown at approval.

Observations outside the gate lines (questions the gate does not ask; recorded so the Lead can decide whether to add them, per the gate's closing paragraph):
- If `TODO_FILE` is a symbolic link, "rename over the target" replaces the link with a regular file. The linked file then stops getting updates and nothing warns the user. The contract does not mention links.
- SPEC 11 says tests "set `TODO_FILE` to a folder under `os.tmpdir()`". Read literally, that conflicts with the cli cases, where `TODO_FILE` is a file inside such a folder.

## Result

`UNDERSPECIFIED`. OPEN lines: A3, C3, D1, F3 (4). Asked (by this reader's reading): 1 (A3). Assumed by Lead: 3 (C3, D1, F3). The Lead makes the final ask/assume call.

Status: ready (gate complete. The result is UNDERSPECIFIED, so builders stay blocked until the Lead resolves the four OPEN lines and the gate runs again.)

Needs a person: nothing
