# Product facts (what is actually built)

The only source for the "what works" part of any report. If it is not here, it is not promised.

Last checked against the running product: 2026-11-13 (Lead, `npm test`: 182 tests, 182 pass; independent QA in `build/handoffs/qa.md`) · contract 1.0

## Built and verified
| Feature | Evidence level | Where it is checked |
|---|---|---|
| `add`, `list`, `list --json`, `done`, `remove` (typed `yes` or `--yes`) on one JSON file | LOCAL TESTED (real command process, temp files, no fakes) | `cli/tests/` |
| A bad data file is refused and never overwritten (CLI exit 3, web 500) | LOCAL TESTED | `cli/tests/`, `web/tests/` |
| Read-only web page and `GET /api/tasks`, titles escaped, re-read on every request | LOCAL TESTED (real HTTP server on 127.0.0.1) | `web/tests/` |
| A task added or finished by the CLI shows up in the web view | INTEGRATION TESTED (real CLI process + real server, one file) | `tests/integration/joined.test.mjs` |
| Both parts give the same verdict on all 13 golden fixtures | LOCAL TESTED in each part; files rewritten by the CLI are INTEGRATION TESTED against the web reader | `cli/tests/`, `web/tests/`, `contract/fixtures/expected.json` |

## Built, not fully verified
| Feature | Evidence level | What is missing |
|---|---|---|
| The page in a real browser at desktop and 375px (AC-11) | END-TO-END TESTED in the desktop app's browser, phone width emulated | a real phone, other browsers, a screen reader: NOT RUN |
| Title length limit on hand-edited files with emoji | LOCAL TESTED per part | the two parts count length differently (open item R-1 in `build/handoffs/seam-check.md`) |

## Not built (do not promise)
- Editing tasks from the web page
- A "delete everything" command
- Due dates, tags, search, more than one user, login

## Limits
- One person, one computer, one JSON file. The web page listens on 127.0.0.1 only.
- Not tested on any phone or other device.
- A file saved with a byte-order mark is refused.
- No file locking: two commands at the same instant can lose one change.
- Titles are printed to the terminal as stored; a title with a line break can imitate another line of `list` (open item F-04).
- After `--`, everything is title text, including `--file`.
