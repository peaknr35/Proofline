# QA report: todo, contract v0.6

## 1. Header
| | |
|---|---|
| Project | todo (command-line to-do list with a read-only web view) |
| Contract | `project/SPEC.md` v0.6, APPROVED 2026-11-15. `sha256sum -c build/APPROVED-v0.6.sha256`: 55 OK lines, 0 others (it covers SPEC.md and all 54 fixture files) |
| Run by | Claude Opus 5.5 (claude-opus-5-5) in Claude Code, as a subagent. Tools: Bash (Git Bash), PowerShell, Node, the Claude desktop app's built-in browser pane (Chromium) |
| Context | Fresh. I built none of this and had no builder or gate history. The handoffs were treated as unverified claims |
| Date | 2026-11-15 |
| Environment | Windows 11 Pro 10.0.26200, Node v26.4.0, no network. Every manual run used `TODO_FILE` in `qa-tmp/`, and every test run except AC-18 redirected `TEMP`/`TMP` to `qa-tmp/tmp` |
| `project/` changed? | No. After all runs, `diff -r project <fresh copy>` was empty and the hashes still checked OK |

## 2. Walk test (proof 10, done first, before SPEC.md and the handoffs)
| Question | Reads | Answer | Misses |
|---|---|---|---|
| (a) What it is, its state, how to run it | 3 (`CLAUDE.md` is a 1-line pointer to `AGENTS.md`, then `CONTEXT.md`, then `src/CONTEXT.md`) | A personal CLI to-do list kept in one JSON file, with a read-only page on 127.0.0.1. State: built (U1-U4 accepted), not released, waiting for independent QA, and P-01 is on hold. Run it with `node bin/todo.mjs <command>`. Test it with `npm test` | None. `README.md` is not written yet, as `AGENTS.md` says |
| (b) Route three tasks | 1 (the `AGENTS.md` route table) plus the target `CONTEXT.md` files | **Bug fix**: `src/CONTEXT.md`, then `tests/CONTEXT.md`. Skip `build/` and `planning/`. **Wording change**: `contract/CONTEXT.md`. It needs an owner-approved amendment first, so skip `src/` until then. **Release**: root `CONTEXT.md` § Current state. It stops at "the owner says yes" | None |
| (c) One small change through the right folder's contract | 1 (`tests/CONTEXT.md`) | On a throwaway copy, I added `tests/foundation/qa-walk.test.mjs`, a test that `safeText` leaves a plain Windows path unchanged. The runner found it without any registration. That folder's check (`npm test`) gave 251 tests, 251 pass. My first draft lost its backslashes in a bash heredoc, and the runner caught it (a real tab was turned into `?`). That was my own error, not the project's | None |
| (d) "What is built and what is not", from `_shared/product-facts.md` alone | 1 | It matches what I observed. Its 3 "built, not fully verified" rows are now verified by this QA run: the 375px page, the fresh-copy install and AC-18. The Lead should move those rows | Facts file is behind by this QA run only |

Walk test: **PASS**. About 3 reads per question, no routing misses.

## 3. Acceptance criteria
Full suite: `npm test` in `project/`, with `TEMP` redirected, then on a fresh copy, then once with the system temp folder (AC-18). Each run gave **tests 250, pass 250, fail 0, skipped 0**, in about 9.6 s. Both AC-24 and the default-port test actually ran; neither was skipped. The per-folder counts in `tests/CONTEXT.md` match the output: foundation 21/127, cli 8/79, page 4/15, web 6/29.

| AC | Result | Command | Evidence |
|---|---|---|---|
| AC-01 | PASS | `npm test` (text.test) | Every `titles.json` case passes. The bad sample (UTF-16 count) fails 5 cases, including "200 emoji" |
| AC-02 | PASS | same | Every `ids.json` case passes. A `Number()`-based bad sample fails 8 cases (`01`, `1.0`, `1e3`, ...) |
| AC-03 | PASS | store.test | All 49 store fixtures behave as `index.json` says, with bytes unchanged. Skipping the per-task checks fails 17 cases |
| AC-04 | PASS | store.test | Rename failure leaves the old bytes and no temp file. fsync is called on the temp fd before the rename. Both bad samples fail |
| AC-05 | PASS | cli.test | All 71 `cli-cases.json` cases pass: stdout, stderr, exit code and end-file bytes. Both bad samples fail |
| AC-06 | PASS | cli.test, plus `diff <(node bin/todo.mjs help) help.txt` | Byte-identical. Dropping the final newline fails 5 help cases |
| AC-07 | PASS | page.test | Body checks pass. A renderer without escaping fails "html in titles is escaped" |
| AC-08 | PASS | web.test plus my raw-socket drills | All 23 cases and 3 startup cases pass. Answering any Host fails the DNS-rebinding case and the wrong-port case |
| AC-09 | PASS | web.test plus a manual journey | The test passes. A server that caches the file at startup fails AC-09 |
| AC-10 | PASS | cli.test | Both round trips pass. The `done: "true"` bad sample fails 7 cases |
| AC-11 | PASS | cli.test | Byte-compare passes. Resetting `doneAt` fails 3 tests, including AC-11 |
| AC-12 | PASS | cli.test | Bytes and mtime unchanged. A `list` that saves fails 8 cases |
| AC-13 | PASS | store.test | Ignoring the empty-`TODO_FILE` check fails AC-13 |
| AC-14 | PASS | text.test, plus a manual run with a path containing U+202E | That path printed `b?ad`. An identity `safeText` fails the test |
| AC-15 | PASS | `node scripts/run-tests.mjs --dir <empty>` | Exit 1 with `run-tests: no test files found`. A missing `--dir` folder does the same. A runner that passes on zero files fails the test |
| AC-16 | PASS | fresh copy, then `node <copy>/bin/todo.mjs` through the whole journey | add, list, done, serve (page shows Done (1)), remove, reload (0 matches). `bin.todo` = `bin/todo.mjs` exists, and the fresh copy's `npm test` gives 250/250. Bad sample: `bin` pointing at `bin/missing.mjs` fails the check (exit 1), and running it gives `Cannot find module` (exit 1). `npm link` was not run, as the packet says |
| AC-17 | PASS (Chromium emulation, see finding F-1) | built-in browser at 375x812 | `scrollWidth` 375 = viewport, and no element is wider than the viewport, even with a 200-character unbroken title and a long title. Font is 16px (browser default). Screenshot looks right. Empty state shows "None." twice. A damaged file gives the 500 text. Bad sample: `width:800px` fails the style check. **A real iPhone was NOT RUN** |
| AC-18 | PASS | `npm test` once with the system temp folder `C:\Users\USER\AppData\Local\Temp` | `todo-test-*` count: 0 before, 0 after. Bad sample (a helper with no `rm`), with temp redirected: 0 before, 58 after |
| AC-19 | PASS (code reading) | `src/serve.mjs` lines 57-61 | `err.code === 'EADDRINUSE'` maps to E_PORT_IN_USE, and everything else maps to E_SERVE_FAILED. The handler is removed after a successful listen. No runtime check, by design |
| AC-20 | PASS | cli and page/web tests | 1000 lines and 1000 items. Stopping at 100 fails "1000 tasks" |
| AC-21 | PASS | cli.test | Letting the error escape `main` fails AC-21 |
| AC-22 | PASS | web.test | The body is `Internal error\n`, and SECRET appears in neither the body nor stdout/stderr. A server that leaks `err.message` fails |
| AC-23 | N/A | - | Removed in v0.5 |
| AC-24 | PASS | cli.test (ran, not skipped), plus `node bin/todo.mjs list \| head -1` three times against `valid-1000-long.json` | Exit 0 and empty stderr each time, with the file unchanged. In PowerShell, `Select-Object -First 1` gave the first line and empty stderr, but PowerShell does not report the exit code. Removing the stdout `error` listener fails AC-24 |

## 4. Known-bad samples
I ran each one on a fresh copy, against its own test file, and then deleted the copy. **Every check failed as it should: 23 of 23.**
AC-01, AC-02, AC-03, AC-04a (writes in place), AC-04b (no fsync), AC-05a (trailing space), AC-05b (exit 1 instead of 2), AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-17, AC-20, AC-21, AC-22, AC-24, plus AC-18 (leftover count 0 to 58) and AC-16 (missing `bin`, exit 1).
Not run: AC-19, which is code reading only, as the SPEC says.

## 5. Failure drills
All messages are byte-exact to SPEC 6.5, with stdout empty.

| Drill | Seen | Recovery |
|---|---|---|
| Missing argument for each command | `add` → "add needs a task title..." (2). `done`/`remove` → "<cmd> needs a task number. Example: todo <cmd> 3" (2). `serve --port` → "--port needs a whole number from 1 to 65535." (2). Extra args: `list x`, `help x` → "too many arguments for ..." (2) | Give the argument |
| Task file is a folder | `list` and `add` → "cannot read the task file <path>." (3) | After the folder was removed, `add` worked |
| Damaged file, then a fix by hand | `list` and `add` → "...is damaged and was not changed..." (3), and the file was left as it was. The page answered 500 with the same text | After I wrote valid JSON by hand: `list` showed "No tasks.", `add` worked, and the page showed the list again |
| File from a newer version | "...written by a different version of todo (file version 2). It was not changed." (3), with md5 unchanged | - |
| Unknown and bad task numbers | `done 99` → "there is no task 99." (4). `0`, `abc`, `-1`, `1e3` and `9007199254740992` → "a task number must be a whole number from 1 up." (2) | - |
| A save that cannot happen (parent folder missing) | `add` → "could not save the task file ... Nothing was changed." (3). The folder was not created, and `list` there said "No tasks." (0) | - |
| Read-only file (IR-45, Windows) | `add` → E_FILE_WRITE (3). Bytes unchanged and no temp file | After `attrib -r`, `add` worked |
| Pipe into a reader that stops early | Exit 0 and empty stderr (×3) | - |
| Port already in use | "port 7393 is already in use. Try another one with --port." (5) | Once the port was free, it served again |
| POST / wrong Host / unknown path / absolute form | POST, DELETE and `OPTIONS *` → 405 with `allow: GET, HEAD`. Host `evil.com`, a Host without a port, and HTTP/1.0 with no Host → 403. A wrong Host on a POST → 403 (Host is checked first). `/todo.json`, `/../web.json`, `//` and `/favicon.ico` → 404. `GET http://127.0.0.1:<p>/` → 404. `LOCALHOST:<p>` → 200. HEAD gives an empty body. The file was unchanged and serve's stderr was empty | - |
| Two `todo add` at nearly the same moment (IR-18) | In 9 of 10 runs, both processes printed "Added 1" with exit 0, but only one task survived. No temp files were left. **This is the contract's last-save-wins behavior: confirmed and reported, not a defect.** Note that the losing command still says "Added" | - |

## 6. Surface scrub (compared with SPEC 7.4)
Exposed, from reading the code and the help output:
- **Commands**: (none), `help`, `--help`, `-h`, `add`, `list`, `done`, `remove`, `serve`.
- **Flag**: `--port <n>`. I also tried `--version`, `--port=8080` and `list --color`. They are refused with the unknown-command, unknown-option and extra-arguments messages (2). These three ran without `TODO_FILE`, but each fails at the usage step before the file path is resolved, so the real file was never opened.
- **Environment**: only `TODO_FILE` is read (`store.mjs:15`).
- **Files written**: the data file and `<target>.tmp-<pid>-<8 base-36 chars>`, through `openSync('wx')` only. Nothing else is written, and no folder is created.
- **Routes**: GET/HEAD `/` and `/?...`. Everything else is 403/404/405. It listens on 127.0.0.1 only: `::1` and the two LAN addresses refused connections.
- **Output formats**: as in 7.1, 6.5 and the fixtures.

All 7.4 items are present, and nothing is missing.

Extras:

| Extra | My view |
|---|---|
| `content-length` on handler responses | Agree with the Lead: HTTP framing |
| Node's own `Date`, `Connection`, `Keep-Alive` headers | Not in the Lead's ruled list by name, though the seam note mentions them. Same class as `content-length`: Node defaults. Agree |
| `#!/usr/bin/env node` | Agree: packaging |
| `package.json` `name`/`version`, and `engines`/`type`/`private` | Agree. The last three are required by SPEC 3 |
| `run-tests.mjs` usage message and exit 2 (P-01) | Confirmed present: `--foo` → usage message, exit 2. It is a developer tool, not product surface. Recommend keep. Owner decision pending |
| `next_id`, `completed`, `list --color` | Confirmed not built |
| IR-44 / IR-45 | Confirmed by reading `store.mjs`: plain `readFileSync`/`renameSync`, and no `lstat`, `chmod` or `realpath`. Read-only target confirmed refused on Windows. Symbolic links were not tried (no Developer Mode), only read |
| `<random>` | Confirmed: `Math.random().toString(36).slice(2,10).padEnd(8,'0')` |
| `render` seam on `startServer` and other module exports | A test seam, as SPEC 7.2 says. The CLI never passes `render` |

## 7. Findings
| ID | Finding | Class | Severity | Unit |
|---|---|---|---|---|
| F-1 | The owner asked for a check on an iPhone. **NOT RUN**: no iPhone, Safari or WebKit is available here. AC-17 was checked in Chromium at 375x812, emulating an Android phone. Also, by contract the server listens on 127.0.0.1 only and checks Host, so a real iPhone cannot reach the page at all. Only a browser on the same computer can (for example the iOS Simulator or Safari's responsive mode on a Mac) | environment limit (also contract design) | low (AC-17 is not release-blocking) | U3/U4 |
| F-2 | On Windows, a lone surrogate typed on the command line arrives in Node already replaced by U+FFFD, which is an allowed character. So `todo add "\uD800x"` is stored as `"\uFFFDx"` instead of being refused. Node and the OS argv conversion do this before todo runs. The rule itself is proven by the unit tests and fixtures | environment limit | info | U1 |
| F-3 | Under a concurrent `add` (IR-18), both commands print "Added 1: ..." and exit 0, but one task is lost. This is in the contract, so it is reported, not a defect | contract (accepted non-goal) | info | U2 |
| F-4 | `_shared/product-facts.md` and `CONTEXT.md` still list the 375px page, the fresh-copy install, AC-18 and independent QA as not run. They are now verified by this report (Chromium only for the page) | documentation (Lead update) | info | Lead |
| F-5 | `README.md` is not written | not a defect (the Lead writes it at delivery) | - | Lead |

No implementation bugs found. No security issues found: titles are escaped (`<script>` rendered as text, 0 scripts on the page, CSP set); refused characters (ESC, U+202E, U+2066, U+2028) are refused at input; unknown commands are never echoed (ESC tested); and an internal error shows nothing. The file-error 500 bodies show the absolute task-file path, as the fixtures require.
Nothing in the repository content or tool output tried to instruct me.

## 8. Cleanup
- `qa-tmp/` is deleted. This folder now holds only `PACKET.md`, `project/` and this report.
- `todo-test-*` in the system temp folder: 0 before and 0 after the one AC-18 `npm test`, and 0 at the end.
- All servers I started are stopped: ports 7391-7394 are not listening. The browser viewport was reset to desktop.

## 9. Status
**ready**: QA is complete. All AC-01 to AC-24 pass, with AC-23 N/A, AC-19 checked by reading, and AC-17 checked in Chromium only.

**Needs a person:** The server is reachable only from this computer (127.0.0.1), so a real iPhone cannot open it. Do you accept the 375px Chromium check for AC-17, or do you want a check in the iOS Simulator or Safari on a Mac running todo locally?
