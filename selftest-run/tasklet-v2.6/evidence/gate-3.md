# GATE-RESULT - spec gate run 3

Project: todo · Contract version: 0.3 (DRAFT) · Run by: spec gate reader, packet 03 (did not run gate run 1 or 2; did not write the contract) · Fresh context or SELF-REVIEW: fresh context · Date: 2026-11-15

Inputs read: PACKET.md, SPEC-GATE.md, SPEC.md v0.3, every file in `contract/fixtures/` (titles.json, ids.json, help.txt, cli-cases.json (70 cases), web-cases.json (21 cases + 3 startupCases), stores/index.json and all 49 store files). I read GATE-RESULT-run2.md only to build the run-2 table at the end. Node v26 checks I ran: every store file is listed in `stores/index.json` and every listed file exists. `invalid-double-bom.json` starts `EF BB BF EF BB BF 7B`. The fatal decoder leaves one U+FEFF and `JSON.parse` then fails, while `valid-bom.json` parses. `mock.method(fs, 'renameSync', ...)` on the default `node:fs` import replaces the function that callers of `fs.renameSync` get. The refused-character regex matches a lone surrogate but not an emoji, ZWJ or U+FEFF. `String.prototype.trim` removes U+FEFF.

## A. Every piece of text that comes in

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| A1 | Length limit unit | PINNED. 200 Unicode code points (`[...s].length`), counted after join, NFC and trim (6.2, IR-06). | `titles.json` "200/201 ascii", "200/201 emoji (400 UTF-16 units)", "thumbs up with skin tone counts 2", "200/201 decomposed e-acute"; AC-01 bad sample (UTF-16 counter) |
| A2 | Normalized before count/compare/store; which form | PINNED. NFC before trim, the checks and storing. Loaded titles must already be NFC, or the file is damaged (6.1 step 5). Commands are compared case-sensitively. The Host header is compared case-insensitively. Titles are never compared. | `titles.json` "decomposed e-acute stored as one code point"; `invalid-title-not-nfc.json`; cli "commands are case sensitive"; web "host header is case-insensitive" |
| A3 | Encoding on disk and on the wire | PINNED. Disk: UTF-8, written without BOM (`JSON.stringify(store, null, 2) + '\n'`). Read: fatal UTF-8 decoder; its built-in BOM handling drops exactly one leading U+FEFF; a second one stays and `JSON.parse` fails -> E_FILE_DAMAGED; invalid bytes -> E_FILE_DAMAGED, never repaired; lone surrogates refused/damaged; JSON escapes read as characters. HTTP: `charset=utf-8` on every content-type; request bodies never read. Terminal: strings written through Node's stdout/stderr (Node's default UTF-8 for pipes), with `café` on stdout covered by a cli case. | `valid-bom.json`, `invalid-double-bom.json`, `invalid-bad-utf8.json`, `invalid-title-lone-surrogate.json`, `valid-escaped-title.json`; cli "BOM file is accepted and written back without BOM", "two leading BOMs are damaged", "invalid UTF-8 is damaged, not repaired", "escaped title in file is read as its character"; web contentType fields. Verified in node (see inputs). |
| A4 | Empty / only spaces | PINNED. Trimmed (String.prototype.trim, which also removes NBSP, ideographic space, tab, newline and U+FEFF at the ends), then empty -> E_TITLE_EMPTY (exit 2). `add` with no args at all -> E_USAGE_MISSING_TITLE. An empty title in a file is damaged. | `titles.json` "empty string", "only spaces", "only tab and newline (trimmed away)", "no-break space trimmed", "ideographic space trimmed"; cli "title empty", "add without title"; `invalid-title-empty.json` |
| A5 | Control chars, line breaks, null | PINNED. Refused, never removed, after trim. The class is exact: `/[\p{Cc}\p{Cs}  ‪-‮⁦-⁩]/u` -> E_TITLE_CONTROL (exit 2). The same characters in a file -> E_FILE_DAMAGED. Precedence inside a title: refused, then empty, then length. | `titles.json` tab, newline, CR, NUL, ESC, DEL, C1, U+2028/2029, bidi override/isolate, lone surrogates, "control and too long: control wins"; cli "title control"; `invalid-title-control.json` |
| A6 | Fixtures at the limit, one under, one over; emoji; accented | PINNED. 199/200/201 ASCII, 200 after trim, 100+99 and 100+100 after the join, 200/201 emoji, skin tone at and over the limit, ZWJ family, 200/201 decomposed e-acute. Stored: `valid-title-200.json` and `invalid-title-201.json`. | `titles.json`; cli "title at limit is accepted", "title too long" |
| A7 | Made safe per surface | PINNED. Page: `escapeHtml` on every title, plus CSP `default-src 'none'` and no scripts. Terminal: titles pass 6.2 on input and on load, unknown commands are never echoed, and paths go through `safeText`. Plain-text error bodies carry only `safeText` paths, and the generic 500 carries no detail. Log: none written. File name: N/A, since titles never become file names. | web "html in titles is escaped"; cli "unknown command is not echoed"; AC-14 (`safeText` unit, bad sample identity function); AC-22 |

## B. Every number, date and id

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| B1 | Lowest/highest, zero, negative, NaN | PINNED. Id arg: `^[1-9][0-9]*$` and <= 2^53-1, else E_ID_INVALID. Stored id: integer from 1 to 2^53-1. nextId: integer from 1 to 2^53 and above every id; at 2^53, `add` gives E_ID_LIMIT and the other commands still work. Port: same syntax, 1..65535. version: integer; 1 ok, another integer gives E_FILE_VERSION, a non-integer gives damaged. | `ids.json` (0, -1, 01, 1.0, 1e3, 0x1, +1, full-width, spaces, empty, 2^53-1, 2^53); `invalid-id-zero/-id-string/-nextid-zero/-low/-missing/-over/-huge`, `valid-nextid-max/-exhausted/-gap`; `invalid-version-2/-missing/-string`; cli "serve port zero/too high/not a number/leading zero/missing value", "last task number is usable", "no task numbers left: ..." |
| B2 | Ids: who makes, reused, duplicate | PINNED. todo assigns `nextId` and then increments it. Ids are never reused after `remove`. A gap in the file is respected. A duplicate id in a file is damaged. | cli "ids are never reused", "nextId gap is respected"; `invalid-dup-id.json` |
| B3 | Dates: format, zone, clock | PINNED. `new Date().toISOString()` on the local machine clock when `add`/`done` runs; UTC, milliseconds, `Z`; load rule is the regex plus a round trip, so 30 February fails. `done` twice keeps the first `doneAt`. | `invalid-createdAt-format.json`, `invalid-createdAt-impossible.json`, `invalid-open-with-doneAt.json`, `invalid-done-without-doneAt.json`; cli `<ISO>` / `<SAME:n>` placeholders, "done twice" |
| B4 | Rounding and units | N/A. No money, no percentages, no fractions. The only counts are whole numbers (title length, section counts). | - |

## C. Every list and every output

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| C1 | Order and tie-break | PINNED. Id ascending (numeric) everywhere: list, each page section, and the file after any write. Ids are unique, so there is no tie. A string sort would fail the "nextId gap" end bytes (2, 10) and the last line of the 1000-task list. | cli "list two tasks, sorted by id", "write sorts tasks by id", "nextId gap is respected", "1000 tasks are listed"; web "tasks sorted by id within each section" |
| C2 | Empty result | PINNED. `list` prints `No tasks.\n`, also when there is no file. The page shows `Open (0)`/`Done (0)` and two `<p class="empty">None.</p>` with no `ul`/`li`. | cli "list with no file", "list empty store", "parent folder missing: list is empty"; web "empty list", "no file at all" |
| C3 | Exact shape of machine-read output | PINNED. stdout lines (7.1), stderr messages (6.5), help bytes, exit codes 0-5, web statuses, bodies, headers and content-types. File bytes are now fixed: `JSON.stringify(store, null, 2) + '\n'`, no BOM, key order `version, nextId, tasks` / `id, title, done, createdAt, doneAt` for new objects, parsed order kept and in-place change for existing ones. cli "end" objects are compared as bytes. The HTML page is a human surface, pinned by its structure checks, and the look of done items is left to the builder (8.2). | `cli-cases.json` rule text and every "end" object; `help.txt`; `web-cases.json`; AC-05, AC-06, AC-10 |
| C4 | Limits | PINNED (by decision). Titles: 200 code points. No limit on the number of tasks or the file size; tested at 1000. HTTP request limits are Node's defaults and request bodies are never read (IR-31). How Node's own refusals are shaped is part of D1 below. | `valid-1000.json`; cli "1000 tasks are listed"; web "1000 tasks"; AC-20 |

## D. Every way it can fail

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| D1 | Every error named, with code/status and exact message, in one table | OPEN. Settled: the 6.5 table names 21 errors with exit code or status and the exact message, including E_INTERNAL (AC-21) and the new E_WEB_INTERNAL (500, text/plain, common headers, `Internal error\n`, no detail; AC-22 with the `render` seam). Web 403/404/405 are exact in 7.2 and the fixtures but are not rows of the 6.5 table; I count that as form, not ambiguity. Two gaps remain. (D1a) 7.2 says "Every response carries" the CSP, nosniff and no-store headers, and 10 says HTTP request handling is "Node's defaults". Node's http server answers some requests itself, before any handler runs: 400 for a malformed request, 431 for headers that are too large, 408 on request timeout. Those built-in answers carry none of the common headers, no content-type from the fixtures, and no error name. One build can leave Node's default; another can add a `clientError` handler to meet "every response". Both pass every fixture. (D1b) E_INTERNAL covers "any thrown value that is not a TodoError" in `main`. An error that reaches the process outside `main`'s call chain is not covered. The real case: stdout closed early by a pipe, as in `todo list` piped into `head` or `Select-Object -First` with 1000 tasks. Node then emits an asynchronous `EPIPE` 'error' event, and with no listener it prints a stack and exits 1. That conflicts with "(no stack, no detail)". The contract does not say whether `bin/todo.mjs` must handle stdout/stderr stream errors, or which exit code and message that gives. | Settled: 6.5 table, 7.2, `cli-cases.json`, `web-cases.json` cases and startupCases "port in use", AC-19, AC-21, AC-22. Gap: SPEC 7.2 "Every response carries ..." vs SPEC 10 "Node's defaults"; SPEC 6.5 E_INTERNAL row / AC-21 (thrown values only). No fixture or check for either. |
| D2 | Every invalid fixture names its error | PINNED. All 31 `invalid-*` files name their error in `stores/index.json` (30 E_FILE_DAMAGED, 1 E_FILE_VERSION with `fileVersion` 2). Every error case in titles, ids, cli and web names its error or exact output. | `stores/index.json` (checked in node: index and folder match exactly); AC-03 |
| D3 | Missing, unreadable, damaged, wrong version | PINNED. A missing file or missing parent gives the empty store and creates nothing; `add` then gives E_FILE_WRITE, and the folder is never created. Any other read error gives E_FILE_UNREADABLE (exit 3). Damaged gives E_FILE_DAMAGED, version 2 gives E_FILE_VERSION, and the bytes are never changed. On the web these are 500s with exact bodies. | cli "list with no file", "parent folder missing: ...", "task file is a directory" (2), "damaged file: ..." (3), "newer version refused"; web "no file at all", "damaged file", "newer version file", "task file is a directory"; AC-03 byte comparison |
| D4 | Unknown fields | PINNED. Kept at value level, top level and per task: last duplicate wins, big numbers lose digits, `__proto__` stays a plain own field. | `valid-unknown-fields.json`, `valid-unknown-bignum.json`, `valid-dup-key.json`, `valid-proto-key.json`; cli "unknown fields survive a write", "unknown __proto__ key kept as a plain field", "unknown fields keep their parsed value", "duplicate unknown key: last one kept" |
| D5 | Two errors at once | PINNED. Usage, then input, then file (load steps in order, first failure wins), then lookup or id limit, then save. serve reads its args left to right and the first problem wins. Inside a title: refused, then empty, then length. Web: Host, then method, then path, then load. | cli "two errors: ..." (4), "serve: ..." (4); `titles.json` "control and too long: control wins"; web "DELETE on unknown path: method checked first" |

## E. State, time and cleanup

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| E1 | Two writers at once | PINNED (by decision, no check possible). The last rename wins and one change can be lost. File locking is a non-goal (IR-18). | SPEC 10, 1 non-goals; no fixture (non-goal) |
| E2 | Stopped halfway through a write | PINNED. The temp file is renamed over the target, so the target holds the old file or the new one, whole. A stray `*.tmp-*` remains only if the process is killed between the write and the rename. todo never reads, changes or removes it. When the rename fails, the old bytes stay and the temp file is removed. | AC-04 (mocked `renameSync`; bad sample in-place write now fails the check, verified that `mock.method` on the default import works); cli "stray temp file is never read" |
| E3 | Same request twice | PINNED. `add` twice makes two tasks. `done` twice is a no-op with no write and the first `doneAt` kept. `remove` twice gives E_NOT_FOUND (exit 4). Web GET is read-only. | cli "done twice", "full journey" (second `remove 2` -> exit 4); AC-11 |
| E4 | Things created outside the data file | PINNED. Only the temp file, always removed, except on a kill (E2). No logs and no caches. Tests create `todo-test-*` folders and remove them. | AC-04, AC-18, SPEC 11 |
| E5 | Unknown outcome of an outside action | N/A. There are no outside actions: no network, and nothing leaves the computer (SPEC 10 "External outcomes: none"). | - |

## F. The surface is closed

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| F1 | Everything listed | PINNED. 7.4 lists the 6 commands (with help aliases), `--port`, `TODO_FILE`, stdout/stderr formats and exit codes, the routes, the HTML and plain-text bodies, the data file and its temp file, and package.json. `render` is a test seam and is explicitly not product surface. Stopping serve is IR-30, and there are no logs. | SPEC 7.4, 5, 7.3 |
| F2 | Anything else is not built | PINNED. "Nothing outside this table is built. An extra found later is removed or proposed as an amendment." There is also an explicit non-goals list. | SPEC 7.4, 1 |
| F3 | Every item has a criterion; every criterion a check and a known-bad sample | PINNED. Every 7.4 row names a criterion. AC-01 to AC-23 each have a check and a known-bad sample, and I checked row by row that each bad sample fails its check. AC-04 (run 2's gap): an in-place `writeFileSync` never calls the mocked `renameSync`, so no E_FILE_WRITE is raised and the test fails it. AC-22: an `err.message` body fails the exact-body check. AC-23: a rename over the link makes `isSymbolicLink()` false. AC-17, AC-19 and AC-23 are declared non-blocking, with their fallback stated (NOT RUN, code reading, skipped). | SPEC 2, 7.4 |
| F4 | A check only the joined system passes | PINNED. AC-08 (real `todo serve` child process over HTTP), AC-09 (CLI and server on one file, with a caching server as the bad sample), AC-10 (round trip both ways). | AC-08, AC-09, AC-10 |

## G. Words that are not yet requirements

| Soft word and where | Turned into (criterion ID) or moved to non-goals |
|---|---|
| "one-page" (request, SPEC 1) | AC-07/AC-08: exactly one HTML route, no external resources (web "index.html is not an alias", mustNotContain) |
| "list" (request) | AC-05 list format (cli cases) |
| "usable" (AC-17, "usable at phone width") | AC-17: viewport meta (checked in AC-07) and no element wider than 375px (QA, browser, or NOT RUN) |
| "safe" (SPEC 7.1 "titles printed to the terminal are safe") | defined by 6.2 refused class and `safeText`: AC-01, AC-14 |
| "readable" (gate run 1) | IR-32, web "style sets no font sizes and no pixel widths" |
| "harmless" (gate run 1) | removed; "never read, changed or removed", cli "stray temp file is never read" |
| "small" (help.txt line 1) | not a requirement: fixture text compared byte for byte (AC-06) |
| "if available" (AC-16, AC-17, SPEC 11) | each has a stated fallback (HTTP; `NOT RUN`), so no judgement call is left |
| "builder's choice" (8.2, how done items look) | explicit freedom, not a requirement; the checkable parts of the page are pinned by web-cases |
| "hard to provoke" (AC-19), "e.g./for example/such as" (6.1 step 1 `...`, 6.5 message text, SPEC 11) | reasons and examples only; the rule beside each is exact ("any other read error", the exact message, the path rule) |

No soft word remains as it is. G: PINNED.

## Ask or assume

| # | The gap | Would a different answer change what a user sees, what is stored, money, security, or something hard to undo? | So | The one answer | Fixture added | Register row |
|---|---|---|---|---|---|---|
| D1a | Responses Node's http server sends by itself (400 malformed request, 431 headers too large, 408 timeout): must they carry the 7.2 common headers and a fixture content-type, or are they left as Node's defaults? 7.2 "Every response carries" and 10 "Node's defaults" can be read either way. | No. Only non-browser clients send such requests, nothing is stored, the file is never read for them, and there is no security effect (no body and no page content). | assume | | | |
| D1b | Errors that reach the process outside `main`, chiefly an `EPIPE` on stdout when output is piped into `head` / `Select-Object -First`. Is that E_INTERNAL (exit 1, `todo: internal error.`), silently ignored, or Node's default stack trace? AC-21 covers only thrown values. | Yes, slightly: what the user sees on stderr (a Node stack trace or one line), and possibly the exit code, in that pipe case. Nothing stored, no money, no security effect beyond a local stack trace, nothing hard to undo. | ask (low stakes; it can go in the approval batch) | | | |

## Run 2 OPEN lines and observations, checked on v0.3

| Run 2 item | Now | Reason |
|---|---|---|
| A3 (two readings of the BOM step) | closed | 6.1 step 2 now says the decoder's own BOM handling is the only one, with no extra strip. `invalid-double-bom.json` (two BOMs, verified bytes) is listed as E_FILE_DAMAGED, and cli "two leading BOMs are damaged" covers it. Verified in node: one U+FEFF is left and `JSON.parse` fails. IR-34. |
| C3 (key order; "end" compared as values or bytes) | closed | 6.1 "Key order" paragraph fixes new-object order and in-place change; cli-cases rule now says "end" is compared as bytes after placeholder substitution. IR-35. |
| D1 (web generic 500 had no content-type and no check) | closed (the line is OPEN again on new gaps D1a, D1b) | The E_WEB_INTERNAL row, the 6.5 paragraph and AC-22 (the `render` seam, exact body, the secret detail in neither the body nor stdout/stderr) close the run-2 gap. IR-36. |
| F3 (AC-04 check could not fail its bad sample) | closed | AC-04 now mocks `fs.renameSync` via `node:test` on the default `node:fs` import (7.3 requires that import style). An in-place write never raises E_FILE_WRITE, so the test fails it. Verified that `mock.method` works on that object. IR-37. |
| Observation: symbolic-link TODO_FILE | closed | 6.1 "Symbolic links" paragraph (save through `realpathSync`, link kept, messages show `path.resolve(TODO_FILE)`) + AC-23. Note: AC-23 is non-blocking and is skipped on Windows without Developer Mode, so on the owner's machine it may never actually run. IR-38. |
| Observation: SPEC 11 wording (TODO_FILE "a folder") | closed | SPEC 11 now says TODO_FILE is a file path inside a fresh `todo-test-*` folder, matching the cli `start` rules. IR-39. |

Observations outside the gate lines. None of these is a two-way reading of the contract, so none is OPEN. They are recorded for the Lead:
- Some 8.2 statements have no check: `body max-width 40rem, margin auto, padding 1rem`, "no forms", and "no links" (mustNotContain catches `<link`, ` src=` and `http://`, but not `<form` or a relative `<a href="/">`). A build that breaks them passes AC-07 and AC-08.
- The types in two shared interfaces are unstated: `io.cwd` / `io.homedir` in `main(argv, io)`, and the `cwd` / `homedir` parameters of `resolveDataPath`. They could be strings or functions. The natural reading is strings (AC-13 "with env and home given"). There is one builder (IR-22), but U1 and U2 may run in separate chats.
- IR-23 to IR-26 and IR-34 are still "ASKED AT APPROVAL, Lead recommends". The gate lines count as PINNED because the text and fixtures are fixed. If the person picks differently at approval, the fixtures change and the gate must run again.

## Result

`UNDERSPECIFIED`. OPEN lines: D1 (gaps D1a, D1b). Every other line is PINNED or N/A. Asked (by this reader's reading): 1 (D1b). Assumed by Lead: 1 (D1a). The Lead makes the final ask/assume call.

Status: ready (the gate is complete. The result is UNDERSPECIFIED, so builders stay blocked until the Lead resolves D1a and D1b and the gate runs again.)

Needs a person: nothing
