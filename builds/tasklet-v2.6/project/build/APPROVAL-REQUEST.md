# Approval request - contract v0.6 (2026-11-15)

Source of truth: SPEC.md v0.6. This file is a reading aid; where it differs from SPEC.md, SPEC.md wins.

## A. Decisions for you to confirm (each: yes, or your change)

| # | Row | Question (gate line) | Lead recommends |
|---|---|---|---|
| 1 | IR-23 | invalid UTF-8 bytes in the file (gate A3a) | refused as E_FILE_DAMAGED, never repaired |
| 2 | IR-24 | lone surrogates (gate A3b) | refused in titles (E_TITLE_CONTROL), damaged in the file |
| 3 | IR-34 | two leading BOMs (gate run 2 A3) | only the decoder drops one BOM; a second makes the file damaged |
| 4 | IR-25 | nextId ceiling (gate B1) | nextId <= 2^53; add at the ceiling -> E_ID_LIMIT; above it -> damaged |
| 5 | IR-26 | unknown fields JSON cannot round-trip (gate D4) | value level: last duplicate wins, big numbers lose digits, `__proto__` kept as a field |
| 6 | IR-41 | output piped into a reader that stops early, EPIPE/EOF (gate run 3 D1b) | stop quietly: nothing on stderr, exit 0; other stream errors and uncaught errors -> E_INTERNAL |

## B. Decisions the Lead made (ASSUMED BY LEAD; you may overrule any)

| Row | Gap | Decision |
|---|---|---|
| IR-06 | title length unit | 200 Unicode code points after NFC and trim |
| IR-07 | title normalization | NFC, `String.trim`; inner spaces kept |
| IR-08 | control/bidi characters in titles | refused (E_TITLE_CONTROL), also in loaded files (damaged) |
| IR-09 | multi-word titles | all args after `add` joined with one space; `-x` words are text |
| IR-10 | list shows done tasks? | yes, all tasks, `[x]` marker |
| IR-11 | done on a done task | success, message `Task <id> is already done.`, no write |
| IR-12 | damaged or newer file | refuse, never overwrite |
| IR-13 | unknown fields | kept and written back |
| IR-14 | BOM | accepted on read, never written |
| IR-15 | exit codes | 0 ok, 2 usage/input, 3 file, 4 not found, 5 server |
| IR-16 | default port | 7070 |
| IR-17 | Host header check | only 127.0.0.1:<port> / localhost:<port> |
| IR-18 | concurrent writers | last write wins, no locking |
| IR-19 | unknown command echoed? | never echoed |
| IR-20 | missing parent folder | list shows empty; add fails E_FILE_WRITE; folder never created |
| IR-21 | stack | Node 26, built-ins only, no dependencies |
| IR-27 | non-TodoError in the CLI (gate D1a) | exit 1, `todo: internal error.` |
| IR-28 | `--help x`, `-h x` (gate D1b) | E_USAGE_EXTRA_ARGS naming `help` |
| IR-29 | serve arg order (gate D5) | left to right, first problem wins, `--port` always takes the next arg |
| IR-30 | stopping serve (gate F1) | no signal handler; Node default; exit code not in contract |
| IR-31 | limits (gate C4) | none; tested at 1000 tasks; Node HTTP defaults |
| IR-32 | font size and widths (gate G "readable") | no font-size and no px widths in the style |
| IR-33 | E_SERVE_FAILED has no runtime fixture (gate D1c) | checked by code reading (AC-19), non-blocking |
| IR-35 | key order of written JSON; how "end" is compared (gate run 2 C3) | fixed order for new objects, parsed order kept for existing ones; "end" compared as bytes |
| IR-36 | web generic 500 (gate run 2 D1) | E_WEB_INTERNAL: text/plain, common headers, `Internal error\n`, no detail anywhere; `render` test seam on `startServer` |
| IR-37 | how AC-04 makes a save fail (gate run 2 F3) | sync store using the default `node:fs` import; test mocks `fs.renameSync` |
| IR-39 | test file paths (gate run 2 observation on section 11) | TODO_FILE is a file inside a fresh `todo-test-*` folder |
| IR-40 | responses Node's http server sends by itself: 400/431/408 (gate run 3 D1a) | left as Node's defaults, outside the contract; no `clientError` handler |
| IR-42 | page style details and "no forms, no links" (gate run 3 observation) | style content is the builder's choice within section 3; `<form`, `<a `, `<img`, `<iframe`, `href=` are checked absent |
| IR-43 | types of `io.cwd`, `io.homedir`, `io.env` and the `resolveDataPath` parameters (gate run 3 observation) | strings (env: object of strings), not functions |
| IR-47 | absolute-form request target (gate run 4 F1a) | raw `req.url` must be `/` or start with `/?`; else 404 |
| IR-48 | no fixture sorted inside a section (gate run 4 observation O2) | new store with both sections out of order |
| IR-49 | `<PORT>` in a web fixture `path` (gate run 5 C-OPEN-1) | replaced by the real port everywhere it appears (host, path, expected text) |
| IR-50 | save-error cleanup when step (1) fails, e.g. EEXIST (gate run 5 C-OPEN-2) | remove the temp file only if step (1) created it; never remove a file already there |
| IR-51 | Assumed-by-Lead count in section 15 said 31, listed 32 (gate run 5 C-OPEN-3) | count corrected; the list is authoritative |

Count: 35.
