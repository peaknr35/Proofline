# GATE-RESULT - spec gate run 4

Project: todo · Contract version: 0.4 (DRAFT) · Run by: spec gate reader (run 4, did not run 1-3, wrote none of the contract) · Fresh context · Date: 2026-11-15

Inputs read: PACKET.md, SPEC-GATE.md, SPEC.md v0.4, every file in `contract/fixtures/` (inspected with `node`), GATE-RESULT-run3.md (only for the closure table; its answers were not copied).

## A. Every piece of text that comes in

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| A1 | Length unit | PINNED. 200 Unicode code points (`[...s].length`) after join, NFC and trim. Emoji = 1, skin-tone emoji = 2, ZWJ family = 5. | `titles.json` "200 emoji (at limit, 400 UTF-16 units)", "thumbs up with skin tone...", "zero width joiner allowed"; AC-01 bad sample (UTF-16 counter) |
| A2 | Normalization | PINNED. NFC before trim, refusal and count. Stored titles must already equal `normalizeTitle([title])`, so a non-NFC stored title is damaged. Titles are never compared (no search), so nothing else needs it. | `titles.json` "decomposed e-acute...", "200/201 decomposed e-acute"; `invalid-title-not-nfc.json` |
| A3 | Encoding on disk and wire | PINNED. Disk: UTF-8, no BOM written, fatal decoder, exactly one leading BOM dropped, invalid bytes damaged. Wire: `text/html; charset=utf-8` and `text/plain; charset=utf-8`. Terminal: strings through `write(string)` (Node default UTF-8). JSON escapes read as characters. | `invalid-bad-utf8.json`, `valid-bom.json`, `invalid-double-bom.json`, `valid-escaped-title.json`; cli "BOM file is accepted and written back without BOM", "two leading BOMs are damaged"; web contentType fields |
| A4 | Empty, only spaces | PINNED. Trimmed (String.trim, includes NBSP and ideographic space), then empty -> E_TITLE_EMPTY. `add` with no args -> E_USAGE_MISSING_TITLE; `add ""` -> E_TITLE_EMPTY. Empty stored title -> damaged. | `titles.json` "empty string", "only spaces", "only tab and newline", "no-break space trimmed", "ideographic space trimmed"; cli "title empty", "add without title"; `invalid-title-empty.json`, `invalid-title-untrimmed.json` |
| A5 | Controls, line breaks, NUL | PINNED. Refused with E_TITLE_CONTROL by the 6.2 regex (Cc, Cs, U+2028/2029, bidi embed/override/isolate); control check comes before length. In a loaded file -> E_FILE_DAMAGED. In paths: `safeText` replaces each with `?`. | `titles.json` tab/newline/CR/NUL/ESC/DEL/C1/LS/PS/bidi/surrogate cases, "control and too long: control wins"; `invalid-title-control.json`, `invalid-title-lone-surrogate.json`; AC-14 |
| A6 | Limit fixtures, emoji, accented | PINNED. 199/200/201 ASCII, 200 after trim, 100+99 / 100+100 joins, 200/201 emoji, skin tone at/over, 200/201 decomposed e-acute, single emoji, café. | `titles.json`; `valid-title-200.json`, `invalid-title-201.json`; cli "title at limit is accepted", "title too long" (message shows `it has 201`) |
| A7 | Made safe on each surface | PINNED. Terminal: titles cannot hold control/bidi characters (validated on input and load), unknown commands never echoed, paths through `safeText`. Page: `escapeHtml` + CSP without scripts. Plain-text 500 bodies: `safeText` path only. Log: none written. File name: titles never become file names. JSON file: `JSON.stringify`. | cli "unknown command is not echoed", "damaged file: control char in stored title"; web "html in titles is escaped", commonHeaders; AC-14; 9 "Untrusted text" |

## B. Every number, date and id

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| B1 | Low/high, zero, negative, NaN | PINNED. Id arg: `^[1-9][0-9]*$` and <= 2^53-1 (zero, negative, `01`, `1.0`, `1e3`, `0x1`, `+1`, spaces, empty, full-width digit refused). Stored id 1..2^53-1. nextId 1..2^53, above every id; at 2^53 `add` -> E_ID_LIMIT. Port `^[1-9][0-9]*$`, 1..65535, default 7070. version: non-integer damaged, integer other than 1 -> E_FILE_VERSION. | `ids.json`; `invalid-id-zero.json`, `invalid-id-string.json`, `invalid-nextid-*` (5), `valid-nextid-max/-exhausted/-gap.json`; cli "last task number is usable", "no task numbers left: ..." (2), "serve port zero/too high/not a number/leading zero/missing value"; `invalid-version-2/-string/-missing.json` |
| B2 | Ids: who makes, reuse, duplicates | PINNED. Made from `nextId` by `add`, never reused after remove, a gap in the file is respected, duplicate id in a file -> damaged. | cli "ids are never reused", "nextId gap is respected"; `invalid-dup-id.json`, `invalid-nextid-low.json` |
| B3 | Dates: format, zone, clock | PINNED. `new Date().toISOString()` from the machine clock at `add`/`done`; UTC, ms, `Z`; load checks regex plus round trip (30 Feb fails); `done` twice keeps the first `doneAt`; open task must have `doneAt: null`. | `invalid-createdAt-format.json`, `invalid-createdAt-impossible.json`, `invalid-open-with-doneAt.json`, `invalid-done-without-doneAt.json`; cli `<ISO>`/`<SAME:n>` placeholders, "done twice" |
| B4 | Rounding and units | N/A. No money, percentages or fractions; the only numbers are integer ids, counts, ports and the version. | - |

## C. Every list and every output

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| C1 | Order and tie-break | PINNED. Id ascending everywhere (file after a write, `list`, each page section); ids are unique, so no ties. | cli "list two tasks, sorted by id", "write sorts tasks by id", "list does not rewrite a BOM file"; web "tasks sorted by id within each section" (see observation O2) |
| C2 | Empty result | PINNED. `No tasks.\n` (also with no file or a missing parent folder). Page: `Open (0)`, `Done (0)`, two `<p class="empty">None.</p>`, no `ul`/`li`. | cli "list with no file", "list empty store", "parent folder missing: list is empty"; web "empty list", "no file at all" |
| C3 | Exact machine-read shape | PINNED. stdout lines (7.1), stderr messages (6.5), help bytes, exit codes 0-5; file bytes `JSON.stringify(store,null,2)+'\n'`, fixed key order for new objects, parsed order kept for existing ones, "end" compared as bytes; web statuses, bodies, headers, content-types. | `cli-cases.json` rule text and every "end"; `help.txt` (ends in `\n`); `web-cases.json`; AC-05, AC-06, AC-10 |
| C4 | Limits | PINNED. No limit on task count or file size; tested at 1000 tasks; title 200 code points; HTTP request limits are Node defaults; request bodies never read. | cli "1000 tasks are listed"; web "1000 tasks"; `valid-1000.json`; AC-20; IR-31 |

## D. Every way it can fail

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| D1 | Every error named, code/status, exact message, one table | PINNED. 6.5 names every CLI error with exit code and exact message, plus E_INTERNAL (now also uncaught exceptions, unhandled rejections and stream errors caught in `bin/todo.mjs`; nothing printed if stderr is broken), READER_GONE (EPIPE/EOF on stdout -> exit 0, nothing printed) and E_WEB_INTERNAL. Web 403/404/405 bodies are exact in 7.2 and fixtures (not rows of 6.5: form, not ambiguity). Node's own 400/431/408 answers are now explicitly outside the contract, no `clientError` handler, and the common-header rule is scoped to "responses the request handler sends". | 6.5 table; 7.2; `cli-cases.json`; `web-cases.json` cases and startupCases "port in use"; AC-19, AC-21, AC-22, AC-24; IR-40, IR-41 |
| D2 | Every invalid fixture names its error | PINNED. All 31 `invalid-*` files map to E_FILE_DAMAGED or E_FILE_VERSION (with `fileVersion: 2`); bytes must be unchanged. | `stores/index.json`; AC-03 |
| D3 | Missing, unreadable, damaged, wrong version | OPEN (D3a). Settled: ENOENT (also missing parent) -> empty store, nothing created; other read errors -> E_FILE_UNREADABLE; damaged -> E_FILE_DAMAGED; version -> E_FILE_VERSION; `add` with a missing parent -> E_FILE_WRITE. Gap D3a: TODO_FILE is a symbolic link whose target does not exist (a dangling link). Load gives ENOENT -> empty store, so `list` shows `No tasks.`. On `add`, 6.1 says "if the target path exists and is a symbolic link, the save goes to ... `fs.realpathSync(target)`". Reading 1: the link exists (`lstat`), `realpathSync` throws, so "on any error ... E_FILE_WRITE": nothing saved, link kept. Reading 2: the target does not "exist" (`existsSync` follows links), so the normal save renames the temp file over the link: the link is replaced by a regular file and the file it pointed at is never created. Both pass every fixture and AC-23 (which uses a live link). | Settled: cli "task file is a directory" (2), "parent folder missing: ..." (2), "damaged file: ..." (3), "newer version refused"; web "damaged file", "newer version file", "task file is a directory". Gap: SPEC 6.1 "Symbolic links" sentence; no fixture or check for a dangling link |
| D4 | Unknown fields | PINNED. Kept at value level, top level and per task; big numbers lose digits, last duplicate key wins, `__proto__` kept as a plain own field. | `valid-unknown-fields.json`, `valid-unknown-bignum.json`, `valid-dup-key.json`, `valid-proto-key.json`; cli "unknown fields survive a write", "unknown __proto__ key kept as a plain field", "unknown fields keep their parsed value", "duplicate unknown key: last one kept" |
| D5 | Two errors at once | PINNED. usage -> input -> file -> lookup or id limit -> save; inside the title rule control -> empty -> length; load steps first failure wins (version stops further checks); serve args left to right; web Host -> method -> path -> load. | cli "two errors: ..." (4), "serve: ..." (4), "--help with extra", "-h with extra"; `titles.json` "control and too long: control wins"; web "DELETE on unknown path: method checked first" |

## E. State, time and cleanup

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| E1 | Two writers at once | PINNED (as a non-goal). Last rename wins; one change can be lost; no locking. The server never writes. | SPEC 10; IR-18; non-goals "file locking" |
| E2 | Stopped halfway through a write | OPEN (E2a, E2b). Settled: temp file in the same folder, rename over the target; on error the temp is removed and E_FILE_WRITE is raised; a killed process leaves the old or new whole file plus possibly a stray `*.tmp-*` that is never read or touched. Gap E2a: power loss or OS crash. The contract claims "the target is either the old or the new whole file", but does not say whether the temp file is flushed to disk (`fsync`) before the rename. 7.3 lists the `fs` calls only to fix the import style, so it can be read as exhaustive (no fsync) or not. Without a flush, after a power cut the renamed file can be empty or partly zero on some file systems: the whole list is lost, and the next run reports it damaged. One build flushes, one does not; both pass every check. Gap E2b: what the replaced file keeps. The rename gives the target the new temp file's permissions (POSIX mode from the umask, Windows ACL inherited from the folder), not the old file's; a hard link to the old file is cut; a read-only target is replaced on POSIX but refused (EPERM -> E_FILE_WRITE) on Windows. The contract does not say whether the old file's mode/permissions are copied, so a list the owner made private (`0600`) or read-only can lose that on the next `add`. | Settled: AC-04 (rename fails -> old bytes, no temp), cli "stray temp file is never read", SPEC 10 "Crash during save". Gap: SPEC 6.1 "Save", 7.3 fs call list, 10; no check for either |
| E3 | Same request twice | PINNED. `add` twice adds two tasks; `done` twice is a no-op with no write; `remove` twice -> E_NOT_FOUND. GET is read-only. | cli "done twice...", "full journey" (second `remove 2` exits 4); AC-11 |
| E4 | What is created outside the data file | PINNED. Only `<target>.tmp-<pid>-<random>`, always removed by todo except when killed mid-save (then left for the owner). No logs, no caches; serve writes nothing. Tests create `todo-test-*` folders and remove them. | AC-04, AC-18; cli "stray temp file is never read"; 7.4 "file written"; SPEC 11 |
| E5 | Outside action outcome unknown | N/A. No outside actions: no network, no external services (SPEC 10 "External outcomes: none"). | - |

## F. The surface is closed

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| F1 | Every command, flag, route, screen action, setting, env var, output format and file written is listed | OPEN (F1a). Settled: 7.4 lists the commands, `--port`, `TODO_FILE`, output formats, routes, page, file written and package; the page has no screen actions; `render` is named as a test seam outside the surface. Gap F1a: route matching on the request target. 7.2 says "path (before `?`) must be exactly `/`". A request in absolute form (`GET http://127.0.0.1:7070/ HTTP/1.1`, as a proxy sends) has `req.url` = `http://127.0.0.1:7070/`. Reading 1: the raw target before `?` is not `/` -> 404. Reading 2: the path of that URL is `/` -> 200 page. Both pass every fixture (all fixtures use origin form). | Settled: 7.4 table, 7.1, 7.2, 5; AC-05, AC-08, AC-13. Gap: SPEC 7.2 step (3); no fixture |
| F2 | Anything not listed is not built | PINNED. 7.4 "Nothing outside this table is built. An extra found later is removed or proposed as an amendment." Non-goals in 1 name the likely extras. | SPEC 7.4, 1 |
| F3 | Every item has a criterion; every criterion a check and known-bad sample | PINNED. Every 7.4 row names criteria; AC-01 to AC-24 each have a check and a known-bad sample. AC-17, AC-19, AC-23, AC-24 are non-blocking and may be `NOT RUN`/skipped with a reason, never passed. | SPEC 2 table; 7.4; SPEC 11 (QA shows AC-01, AC-03, AC-07, AC-08 failing on their bad samples) |
| F4 | Every seam has a check only the joined system passes | PINNED. CLI <-> server on one file (AC-09), CLI file <-> `loadStore` both ways (AC-10), real `todo serve` child over HTTP (AC-08), fresh-copy install and journey (AC-16). | AC-08, AC-09, AC-10, AC-16 |

## G. Words that are not yet requirements

| Soft word and where | Turned into (criterion ID) or moved to non-goals |
|---|---|
| "one-page" (request, 1) | AC-07/AC-08: exactly one HTML route, no external resources |
| "list" (request) | AC-05 `list` format |
| "readable" (run-1 contract text) | IR-32; web "style sets no font sizes and no pixel widths" (AC-07, AC-17) |
| "harmless" (run-1 contract text) | removed; replaced by "never read, changed or removed" (cli "stray temp file is never read") |
| "usable at phone width" (AC-17) | viewport meta (AC-07, exact string in web "page with two tasks") + no element wider than 375px (QA, browser, else `NOT RUN`) |
| "stops quietly" (AC-24, IR-41) | defined in the same row: stderr empty, exit 0; AC-24 |
| "safe" (7.1 "Titles printed to the terminal are safe") | explanation backed by AC-01, AC-03 (refused characters) and AC-14 (`safeText`) |
| "if available" (AC-16, AC-17, SPEC 11) | explicit rule: else HTTP / reported `NOT RUN`, never passed |
| "hard to provoke" (AC-19) | reason text only; the check is the code reading in AC-19 |
| "small" (`help.txt`) | product text, byte-fixed by AC-06; not a requirement |

No soft word stays as it is.

## Ask or assume

| # | The gap | Would a different answer change what a user sees, what is stored, money, security, or something hard to undo? | So | The one answer | Fixture added | Register row |
|---|---|---|---|---|---|---|
| D3a | Dangling symbolic-link TODO_FILE on `add`: E_FILE_WRITE and link kept, or the link replaced by a regular file | Yes: what is stored and where (the link is destroyed and the list lives in a different file than the owner set up; hard to notice and undo) | Ask | | | |
| E2a | Flush (`fsync`) of the temp file before rename, so the "old or new whole file" claim also holds after a power cut | Yes: what is stored (the whole list can be lost after a power cut; cannot be undone) | Ask | | | |
| E2b | Whether a save keeps the old file's permissions/mode (and so read-only or private files, hard links) | Yes: security (a private file can become readable by others on POSIX) and what is stored (a read-only file is overwritten on POSIX, refused on Windows) | Ask | | | |
| F1a | Absolute-form request target (`GET http://127.0.0.1:<port>/`): 404 or the page | No: only a proxy sends this form; the page is read-only and nothing is stored, no security or money effect (the Host check still applies) | Assume | | | |

## Run-3 OPEN lines and observations, checked on v0.4

| Run-3 item | Closed / still open | Reason |
|---|---|---|
| D1a: Node's own 400/431/408 responses vs "every response carries" the common headers | closed | 7.2 now scopes the header rule to "every response the request handler sends" and states that Node's built-in 400/431/408 answers are left as defaults, no `clientError` handler, outside the contract (IR-40). One reading only; checkable by code reading. |
| D1b: EPIPE on a closed stdout pipe (stack, exit 1) | closed | 6.5 adds READER_GONE (EPIPE/EOF on stdout -> nothing printed, exit 0 at once; stdout written only after any save) and widens E_INTERNAL to uncaught exceptions, unhandled rejections and other stdout/stderr errors caught in `bin/todo.mjs` (nothing printed if stderr is broken). AC-24 checks it with `valid-1000-long.json` and a known-bad sample; skipped, never passed, if no EPIPE happens. IR-41 (asked at approval). |
| Observation: unchecked 8.2 statements (style values, "no forms", "no links") | closed | 8.2 now leaves the style content to the builder within section 3 (IR-42), and web "page with two tasks" mustNotContain adds `<form`, `<a `, `<img`, `<iframe`, `href=`. |
| Observation: types of `io.cwd`, `io.homedir`, `io.env` and `resolveDataPath` parameters | closed | 7.1 states strings (`env` an object of strings), not functions; 7.3 says `resolveDataPath` takes the same types (IR-43). |

Observations outside the gate lines (not two-way readings, so not OPEN; for the Lead):
- O1. IR-23 to IR-26, IR-34 and IR-41 are still "ASKED AT APPROVAL, Lead recommends". Their gate lines count as PINNED because text and fixtures are fixed; if the person picks differently, fixtures change and the gate runs again.
- O2. web "tasks sorted by id within each section" uses `valid-unsorted.json`, which has one task per section, and `valid-1000.json` is already sorted in the file. So no web fixture actually checks sorting inside a section; a renderer that keeps file order passes AC-07/AC-08. The rule itself is unambiguous (8.2 "Id ascending in each section").
- O3. The Host check is literal `127.0.0.1:<port>` / `localhost:<port>`. A browser on `--port 80` sends `Host: 127.0.0.1` with no port, so the page answers 403 there. A missing Host header also gives 403. Unambiguous; no fixture for either.
- O4. ENOTDIR (TODO_FILE under an existing regular file, e.g. `notes.txt/todo.json`) is "any other read error" -> E_FILE_UNREADABLE on POSIX, while Windows reports the same path as ENOENT -> empty store. Behavior keys on the error code as written, so it differs by OS; no fixture.
- O5. `<FILE>` is defined as `path.resolve(TODO_FILE ...)` (process cwd), while `main` receives `io.cwd`. Identical when run through `bin/todo.mjs`; can differ only in an in-process test that passes a different `io.cwd`.
- O6. `scripts/run-tests.mjs --dir` is in 7.3 and AC-15 but not a row of 7.4; read as covered by the package row.

## Result

`UNDERSPECIFIED`. OPEN lines: D3 (D3a), E2 (E2a, E2b), F1 (F1a). Every other line is PINNED or N/A. Asked (by this reader's reading): 3 (D3a, E2a, E2b). Assumed by Lead: 1 (F1a). The Lead makes the final ask/assume call. All run-3 items are verified closed.

Status: ready (the gate is complete; the result is UNDERSPECIFIED, so builders stay blocked until the Lead resolves D3a, E2a, E2b and F1a and the gate runs again).

Needs a person: nothing.
