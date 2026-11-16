# GATE-RESULT - spec gate for todo

Project: todo · Contract version: 0.1 (DRAFT) · Run by: Claude Opus 5.5 (claude-opus-5-5), Claude Code subagent · Fresh context (given only PACKET.md, SPEC-GATE.md, SPEC.md and contract/fixtures/) · Date: 2026-11-15

Checks run (with node, read-only): every `titles.json` case through a literal reading of SPEC 6.2 (39 of 39 match); every `ids.json` case through SPEC 6.3 (17 of 17 match); every `stores/` file through a literal reading of SPEC 6.1 load steps 1-6 (34 of 34 match `stores/index.json`; no unlisted or missing files); the refused-character class in SPEC 6.2 checked by code point (U+2028, U+2029, U+202A-U+202E, U+2066-U+2069 plus `\p{Cc}`); every `cli-cases.json` and `web-cases.json` case read against 6.5, 7.1, 7.2 and 8.2.

## A. Every piece of text that comes in (titles, names, messages, file contents)

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| A1 | Length limit counted in what: bytes, code units, code points, or what a person sees as one character? | PINNED. Unicode code points (`[...s].length`) after join, NFC and trim; max 200 (SPEC 6.2, IR-06). | `titles.json` "200 emoji (at limit, 400 UTF-16 units)", "201 emoji", "thumbs up with skin tone counts 2", "zero width joiner allowed", "200/201 decomposed e-acute"; AC-01 |
| A2 | Is text normalized before it is counted, compared or stored? Which form? | PINNED. NFC, before trim, refused check and count; stored NFC; stored titles that are not NFC are damaged. Command names compared case-sensitive, not normalized. Host header compared case-insensitively. | `titles.json` "decomposed e-acute stored as one code point"; `stores/invalid-title-not-nfc.json`; cli "commands are case sensitive" |
| A3 | Encoding on disk and on the wire | OPEN. Disk write is pinned (UTF-8, no BOM, `JSON.stringify(store, null, 2) + '\n'`), one leading BOM accepted on read (`valid-bom.json`), HTTP is `charset=utf-8` (web-cases). Not pinned: (a) "Decode UTF-8" in 6.1 step 2 can be read two ways for a file with invalid UTF-8 bytes: replace with U+FFFD and load (then the next write silently changes the stored title), or refuse as E_FILE_DAMAGED. No fixture. (b) Lone surrogates (a JSON `"\ud800"` escape in a stored title, or an argv string carrying one) pass 6.2 as written (not `\p{Cc}`, 1 code point) and the contract does not say whether they are allowed, refused, or what the terminal and page show. | none for (a) or (b) |
| A4 | Empty, and only spaces: allowed, trimmed, or refused? | PINNED. Trimmed with `String.prototype.trim` (includes NBSP, ideographic space, tab, newline), then empty -> E_TITLE_EMPTY. Stored empty or untrimmed titles -> E_FILE_DAMAGED. | `titles.json` "empty string", "only spaces", "only tab and newline (trimmed away)", "no-break space trimmed", "ideographic space trimmed"; cli "title empty"; `stores/invalid-title-empty.json`, `invalid-title-untrimmed.json` |
| A5 | Control characters, line breaks, null bytes: refused, removed or escaped? With which error? | PINNED. Refused with E_TITLE_CONTROL (exit 2, exact message in 6.5) for all `\p{Cc}`, U+2028/2029, bidi embedding/override/isolate; ZWJ allowed; refused check runs after trim and before empty/length. In a stored file -> E_FILE_DAMAGED. | `titles.json` inner tab/newline/CR, null byte, escape, delete char (U+007F), C1 control (U+0085), line/paragraph separator, bidi override, bidi isolate, "control and too long: control wins"; cli "title control"; `stores/invalid-title-control.json` |
| A6 | Fixtures exist at the limit, one under and one over; plus one emoji case and one accented case | PINNED. | `titles.json` "199 ascii", "200 ascii", "201 ascii", "200 ascii plus outer spaces", "100 + 99 = 200", "100 + 100 = 201", emoji 1/200/201, skin tone 200/201, decomposed e-acute 1/200/201; `stores/valid-title-200.json`, `invalid-title-201.json`; cli "title at limit is accepted", "title too long" |
| A7 | How the text is made safe on each surface it reaches: page, terminal, log, file name, message | PINNED. Page: `escapeHtml` on every title plus CSP `default-src 'none'`. Terminal: titles validated at input and at load, unknown commands never echoed, paths through `safeText`. Log: none written. File name: no file name is built from user text (temp name is pid + random). Message: plain-text 500 bodies carry only `safeText` paths, `nosniff`. (Lone-surrogate display is under A3.) | web "html in titles is escaped"; commonHeaders; cli "unknown command is not echoed", "damaged file: control char in stored title"; AC-14 unit test of `safeText` |

## B. Every number, date and id

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| B1 | Lowest and highest allowed; zero; negative; not a number | OPEN. Pinned: id argument 1..2^53-1, zero, negative, leading zero, `1.0`, `1e3`, `0x1`, `+1`, spaces, full-width digit (`ids.json`); stored ids 1..2^53-1 (6.1 step 5); port 1..65535 (cli serve port cases); `version` integer, non-1 -> E_FILE_VERSION. Not pinned: the upper end of `nextId`. Step 6 allows any integer >= 1 above every id (for example `9007199254740991`, or `1e300`, which `Number.isInteger` accepts). `add` then creates an id above 2^53-1 (or writes `1e+300`), and the next load refuses that file as E_FILE_DAMAGED. The contract does not say whether load refuses such a `nextId` or `add` refuses to create an id above 2^53-1, or with which error. | `ids.json`; cli "serve port zero/too high/not a number/leading zero/missing value"; `stores/invalid-nextid-zero.json`, `invalid-nextid-low.json`, `invalid-id-zero.json`, `invalid-version-2.json`; no fixture for the `nextId` ceiling |
| B2 | Ids: who makes them, are they reused after delete, what happens on a duplicate | PINNED. Made by the program from `nextId`; never reused; `nextId` gaps kept; a duplicate id in the file -> E_FILE_DAMAGED. (Ceiling: see B1.) | cli "ids are never reused", "nextId gap is respected"; `stores/invalid-dup-id.json` |
| B3 | Dates and times: format, time zone, who sets the clock | PINNED. `new Date().toISOString()` on the local machine clock, UTC, milliseconds, `Z`; load checks the regex plus round trip (rejects 30 February); `createdAt` set on add, `doneAt` on the first `done`, kept on a second `done`. | `stores/invalid-createdAt-format.json`, `invalid-createdAt-impossible.json`, `invalid-done-without-doneAt.json`, `invalid-open-with-doneAt.json`; cli `<ISO>` / `<SAME:2>` ends; AC-11 |
| B4 | Rounding and units (percent or fraction, cents or dollars) | N/A. No money, percentages or fractional values; the only numbers are integer ids, counts, a port and a version. | - |

## C. Every list and every output

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| C1 | Order of results: by what, and what breaks a tie | OPEN (fixture only). The contract is clear: id ascending everywhere, ids unique so no ties, and tasks sorted by id ascending after any write. Display order is shown by fixtures; sort-on-write is not: no cli case writes from an unsorted file (`valid-unsorted.json` is only listed), so a save that keeps file order passes every fixture. | display: cli "list two tasks, sorted by id"; web "tasks sorted by id within each section"; sort-on-write: none |
| C2 | Empty result: what exactly is shown or returned | PINNED. CLI `No tasks.\n`; page both sections `<p class="empty">None.</p>` with `Open (0)` / `Done (0)` and no `<ul>`/`<li>`. Also for a missing file and a missing parent folder. | cli "list with no file", "list empty store", "parent folder missing: list is empty"; web "empty list", "no file at all" |
| C3 | Exact shape of anything another program reads (output lines, JSON, files): fixed and written down | PINNED. stdout lines (7.1), stderr messages (6.5), exit codes, data file shape and serialisation (6.1, 5), help text byte-exact, plain-text web bodies, page required fragments (8.2). | `help.txt`; `cli-cases.json` exact stdout/stderr/exit/end; `web-cases.json` bodies and headers; AC-05, AC-06, AC-07 |
| C4 | Limits: how many, how large, what happens past them | OPEN. Title length is pinned (200). The contract states no limit and no behaviour past one for: number of tasks, data file size, page size, HTTP request size or header count. It does not say "no limit" either. | none |

## D. Every way it can fail

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| D1 | Every error has a name, an exit code or status, and the exact message; all in one table | OPEN. The 6.5 table covers 17 named errors; web 403/404/405/500 bodies are in 7.2 and fixtures. Not covered: (a) a CLI error that is not a TodoError (for example a write to stdout failing, or a bug): no exit code or message is given (the web side has `Internal error\n`; the CLI side has nothing). (b) `todo --help x` and `todo -h x`: 6.5 lists E_USAGE_EXTRA_ARGS for `help` only, and does not say whether the aliases get it or what `<cmd>` prints (`help`, `--help` or `-h`). Only `help x` has a fixture. (c) E_SERVE_FAILED has a message but no fixture (also hard to provoke). | 6.5 table; cli "help with extra"; no fixture for (a), (b) or (c) |
| D2 | Every invalid fixture names the error it must produce | PINNED. Every `invalid-*` store names its error in `stores/index.json` (E_FILE_VERSION also names `fileVersion`); every invalid `titles.json` and `ids.json` case names its error; every failing cli and web case gives the exact message and exit or status. | `stores/index.json`, `titles.json`, `ids.json`, `cli-cases.json`, `web-cases.json` (all checked) |
| D3 | Missing file, unreadable file, damaged file, wrong version | PINNED. Missing (including missing parent) -> empty store, nothing created; unreadable (EISDIR, EACCES, any other) -> E_FILE_UNREADABLE; damaged -> E_FILE_DAMAGED; non-1 version -> E_FILE_VERSION; file bytes never changed. (Invalid UTF-8 is under A3.) | cli "list with no file", "parent folder missing: ...", "task file is a directory", "damaged file: ...", "newer version refused"; web "damaged file", "newer version file", "task file is a directory", "no file at all"; `stores/index.json` |
| D4 | Unknown fields in stored data: kept, dropped or refused | OPEN. Kept and written back is pinned (`valid-unknown-fields.json`, cli "unknown fields survive a write"). But "kept exactly" (6.1) can be read two ways when the value does not survive `JSON.parse` then `JSON.stringify`: an unknown field holding `12345678901234567890`, `1.10`, `1e2`, a duplicated key, or a key named `__proto__`. Byte-exact keeping is not possible with the save format in 6.1; value-level keeping silently changes those values on the next write. The contract does not say which, or whether such files are refused. | `stores/valid-unknown-fields.json` (string values only); no fixture for number precision, duplicate keys or `__proto__` |
| D5 | Two errors at once: which one is reported | OPEN. Tier order is pinned (usage -> input -> file -> lookup -> save) by four cli "two errors" cases, and within titles by `titles.json` "control and too long: control wins". Not pinned: order inside the usage tier for `serve`, and how `--port` takes its value. Examples with no single reading: `serve --port 0 --open` (E_USAGE_BAD_PORT or E_USAGE_UNKNOWN_OPTION), `serve --open --port 0`, `serve --port --port` (is the second `--port` the value, giving BAD_PORT, or a repeat, giving EXTRA_ARGS), `serve --port 0 --port 1` (BAD_PORT or EXTRA_ARGS). All exit 2; the message differs. | cli "two errors: bad id beats damaged file", "bad title beats damaged file", "damaged file beats unknown id", "usage beats damaged file", "serve port given twice"; none for the serve combinations |

## E. State, time and cleanup

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| E1 | Two writers at the same moment: who wins, is anything lost | PINNED (as a declared non-goal). Last rename wins; one change can be lost; no locking (SPEC 10, 1 non-goals, IR-18). No fixture by design. | SPEC 10; IR-18 |
| E2 | Stopped halfway through a write: what is on disk afterwards | PINNED. Temp file in the same folder, then rename: the target is the whole old or whole new file; a stray `*.tmp-*` may remain only if killed between write and rename. | AC-04 (folder inspected after success and after a failed save; bad sample writes in place) |
| E3 | The same request sent twice: one result or two | PINNED. `add` twice adds two; `done` twice is a no-op with no write and `doneAt` kept; `remove` twice gives E_NOT_FOUND. The web view is read-only. | cli "done twice: second is a no-op and keeps doneAt", "full journey" (second `remove 2` -> exit 4); AC-11 byte comparison |
| E4 | What the system creates outside its data file (temp files, logs, caches) and who removes it | PINNED. Only `<target>.tmp-<pid>-<random>`, removed by the save on success and on failure; a stray one after a kill is left in place and never read. No logs, no caches. Tests create `todo-test-*` folders in the OS temp folder and remove them. | AC-04; AC-18; SPEC 9 "no logs are written" |
| E5 | Outcome of an outside action unknown: check before retry | N/A. No external actions, no network (SPEC 10 "External outcomes: none"). | - |

## F. The surface is closed

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| F1 | The contract lists every command, flag, route, screen action, setting, environment variable, output format and file written | OPEN. 7.4 lists commands, the flag, `TODO_FILE`, routes, output formats, files written and the package. Not stated: what happens when `serve` is stopped (Ctrl+C): whether the program handles the signal, prints anything, what exit code results, and how `main()`'s promise "resolves only when the server closes" is reached. The help text says "press Ctrl+C to stop" but the stop path has no behaviour written down. | 7.4; `web-cases.json` startupCases (start only) |
| F2 | It says that anything not on the list is not to be built | PINNED. SPEC 7.4: "Nothing outside this table is built. An extra found later is removed or proposed as an amendment." Plus the non-goals list in SPEC 1. | SPEC 7.4, SPEC 1 |
| F3 | Every listed item has an acceptance criterion; every criterion has a check and a known-bad sample | OPEN. Every 7.4 row names a criterion. Gaps: AC-16's "known-bad sample" is "NOT RUN is reported if not done", which is a reporting rule, not a bad sample the check must fail on. AC-17's width check may be NOT RUN (it is non-blocking). Rules stated in the text with no fixture or check: tasks sorted after a write (C1); Host header case-insensitive (7.2: no upper-case Host case); E_SERVE_FAILED (D1); body font-size at least 16px and "no fixed widths" (3, 8.2: AC-07 checks only the viewport meta). | SPEC 2 table; `web-cases.json` (no case-insensitive Host case) |
| F4 | Every seam has a check only the joined system can pass | PINNED. CLI to server (`serve` -> `startServer`): AC-08 against a real `todo serve` child, startupCases. CLI and server on one file: AC-09 (bad sample: a server that caches at startup). Store and CLI round trip: AC-10 (bad sample `done: "true"`). Server to page: AC-08 body checks through the real server. | AC-08, AC-09, AC-10 |

## G. Words that are not yet requirements

| Soft word and where | Turned into (criterion ID) or moved to non-goals |
|---|---|
| "one-page" (SPEC 1, request) | AC-07, AC-08 (one HTML route, no external resources). Done. |
| "list" / "to-do list" (request) | AC-05 list format. Done. |
| "usable at phone width" (AC-17) | AC-17 (viewport meta in AC-07; 375px width by QA, may be NOT RUN). Done, non-blocking. |
| "safe" (SPEC 4 "safe text", 7.1 "Titles printed to the terminal are safe") | AC-01, AC-03, AC-14, AC-05 "unknown command is not echoed". Done. |
| "readable default font size" (SPEC 3, Accessibility) | OPEN. Defined as "no font-size below 16px on body", but no criterion checks it (AC-07 / web-cases do not test font size). |
| "harmless" (SPEC 10, stray temp file "documented, harmless; never read") | OPEN. "never read" is a checkable claim with no check; "harmless" is neither a check nor a non-goal. |
| "small" (help.txt line 1, "a small to-do list") | Product copy fixed byte-for-byte by AC-06; not a requirement. Done. |
| "may" (6.1 tasks "may be in any order"; 8.2 "done items may be styled differently"; 10 "U3 and U4 may run together") | Permissions, not requirements: the first is pinned by `valid-unsorted.json`; the second allows either and needs no check; the third is process. Done. |

## Ask or assume

| # | The gap | Would a different answer change what a user sees, what is stored, money, security, or something hard to undo? | So | The one answer | Fixture added | Register row |
|---|---|---|---|---|---|---|
| A3 | (a) File with invalid UTF-8 bytes: replace with U+FFFD and load, or E_FILE_DAMAGED. (b) Lone surrogates in a stored title or an argument: allowed, refused (which error), and how shown. | Yes: stored data. Under "replace", the next write silently rewrites the user's title; under "refuse", the file is left alone. Also what the terminal and page show. | Ask | | | |
| B1 | Upper bound for `nextId` and for ids made by `add`; what load or `add` does past 2^53-1. | Yes: stored data. As written, `add` can write a file that the next load refuses as damaged (hard to undo for a non-technical user). | Ask | | | |
| C1 | Sort-on-write is stated but no fixture shows it. | No: the contract is clear; only a fixture is missing (it changes stored order only, which every display re-sorts). | Assume (Lead adds a fixture, for example `add` from `valid-unsorted.json`) | | | |
| C4 | No stated limit (or explicit "no limit") on number of tasks, file size, page size, request size. | No for this single-user local tool, unless a limit is chosen, which would refuse adds (user sees and stored). | Assume | | | |
| D1 | (a) Exit code and message for a non-TodoError in the CLI. (b) `--help x` / `-h x`: EXTRA_ARGS or not, and the `<cmd>` text. (c) No fixture for E_SERVE_FAILED. | Yes: what the user sees (message and exit code); (c) no. | Ask (a), (b); assume (c) | | | |
| D4 | "Kept exactly" for unknown fields whose values do not survive JSON.parse/stringify (big or long numbers, duplicate keys, `__proto__`): value-level, byte-level, or refuse. | Yes: stored data (values silently change on the next write). | Ask | | | |
| D5 | Order inside the usage tier for `serve`, and whether `--port` takes the next arg even if it starts with `--`. | Yes, slightly: which usage message the user sees (exit 2 in every reading). | Ask | | | |
| F1 | Behaviour when `serve` is stopped with Ctrl+C: signal handling, output, exit code, how `main()` resolves. | No: nothing is stored and the page is read-only; only the shell's exit status after a manual stop differs. | Assume | | | |
| F3 | AC-16 has no known-bad sample; no checks for Host case-insensitivity, sort-on-write, E_SERVE_FAILED, body font-size >= 16px and no fixed widths. | No: the rules are stated; checks and samples are missing. | Assume (Lead adds checks or samples) | | | |
| G | "readable" (16px rule) and "harmless / never read" (stray temp file) have no check. | No. | Assume (turn into checks or move to non-goals) | | | |

## Result

`UNDERSPECIFIED` - OPEN lines: A3, B1, C1, C4, D1, D4, D5, F1, F3, G (10). Asked (by this reader's reading): 5 (A3, B1, D1 a/b, D4, D5). Assumed by Lead: 5 (C1, C4, F1, F3, G; plus part (c) of D1, which is a missing fixture only). The Lead makes the final ask/assume call.

Status: ready (gate complete; result is UNDERSPECIFIED, which blocks builders until the Lead resolves the OPEN lines and the gate is run again)

Needs a person: nothing
