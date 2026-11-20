# GATE-RESULT - spec gate run 5, verification scope (AM-02)

Project: todo · Contract version: 0.5 (DRAFT) · Gate run 5, verification scope (AM-02) · Run by: spec gate reader (run 5; did not run gate runs 1-4; wrote none of the contract) · Fresh context · Date: 2026-11-15

Inputs read: PACKET.md, SPEC-GATE.md, GATE-RESULT-run4.md, CHANGES-SPEC-v0.4-to-v0.5.diff, CHANGES-FIXTURES-v0.4-to-v0.5.diff, SPEC.md v0.5 (only around the changed lines), `contract/fixtures/` (inspected with `node`: web-cases rule, case keys and paths, cli-cases rule, stores/index.json rule). One throwaway Node v26.4.0 check, which wrote no files: a plain `http` server and `http.request` with an absolute-form path. No file was changed except this one.

## 1. Closure check

| Item | Result | Evidence |
|---|---|---|
| D3a: dangling symbolic-link TODO_FILE on `add` | CLOSED | SPEC 6.1 "Symbolic links are not supported (owner decision, IR-44). Nothing in todo checks for them...": a broken link gives ENOENT, so the store is empty (step 1). A save renames over the TODO_FILE path itself, so the link is replaced by a regular file. Only one reading is left. 7.3 drops `fs.lstatSync` and `fs.realpathSync` from the call list, which agrees. AC-23 has been removed. IR-44 is the person's decision. No fixture covers this. As with run 4's E1 (pinned as a non-goal), it is a stated limit. A build that still follows the link with `realpathSync` would pass every fixture, so only code reading against 6.1 and 7.3 catches it. |
| E2a: flush before the rename | CLOSED | SPEC 6.1 "Save, in this order (IR-46)": (1) `openSync(temp,'wx')`, (2) `writeFileSync(fd, ...)`, (3) `fsyncSync(fd)`, (4) `closeSync(fd)`, (5) `renameSync(temp, target)`. The folder is not flushed (stated limit). AC-04 adds a check: recording `mock.method` wrappers on `openSync`, `fsyncSync` and `renameSync` must show `fsyncSync` called on the temp file's fd before `renameSync`. Known-bad sample: "a save without `fsyncSync`". 6.4 adds the row "save order and flush before rename -> AC-04". IR-46 is the person's decision. The unchanged SPEC 10 claim "old or new whole file" still holds. |
| E2b: does a save keep the old file's permissions | CLOSED | SPEC 6.1 "Permissions are not kept (owner decision, IR-45)": the saved file gets the permissions any new file gets in that folder, and a hard link to the old file is cut. A read-only target is refused on Windows (EPERM -> E_FILE_WRITE, file unchanged) or replaced on other systems. Only one reading is left, and it is the plain result of steps (1)-(5). IR-45 is the person's decision. No fixture covers it (stated limit). A build that copies the old mode would pass every fixture; only code reading catches it. |
| F1a: absolute-form request target | CLOSED (SPEC text) | SPEC 7.2 step (3) now reads: "the request target exactly as received (`req.url`, not parsed as a URL) must be `/` or start with `/?`, else 404"; it gives the absolute-form example and cites IR-47. 6.4 has the row "absolute-form request target -> 404". The fixture is web "absolute-form target is not found". That fixture's `<PORT>` placeholder can be read two ways; this is counted once, in section 2 (C-OPEN-1). |
| O2: no fixture checks sorting inside a section | CLOSED | `stores/valid-sections-unsorted.json` stores tasks in the order 5 (open), 4 (done), 2 (open), 1 (done). web "each section sorted by id" `inOrder` expects open b(2), e(5), then done a(1), d(4). A renderer that keeps file order puts e before b and fails. cli "list sorts across open and done" expects stdout `1. [x] a\n2. [ ] b\n4. [x] d\n5. [ ] e\n`, which a file-order `list` fails. index.json lists `ids [1,2,4,5]`, `nextId 6`, in display order per its rule. IR-48. |

## 2. Changed-text check

| Diff hunk or fixture case | Result | The two readings (if OPEN) | Ask or assume |
|---|---|---|---|
| Status line (v0.5, "run 4's 3") | NONE | "3" counts gate lines (D3, E2, F1), the same way "run 3's 1" did. | - |
| AC-04 row (call-order check, known-bad sample with no fsync) | NONE | The wrappers record calls and still call the real functions. They must see `fsyncSync(fd)` on the fd `openSync` returned for the temp path, before `renameSync`. This works because 7.3 has `store.mjs` call through the default `node:fs` object. | - |
| AC-23 row removed | NONE | No unchanged text still refers to AC-23 (grep finds only the row itself and the approval history). | - |
| 6.1 "Symbolic links are not supported" | NONE | See D3a. This agrees with 6.1 step 1 (ENOENT -> empty store, nothing created) and with 7.3. | - |
| 6.1 "Permissions are not kept" | NONE | "May be refused ... or may replace it" describes what the OS does, not a choice for the builder. Either way, a failed rename becomes E_FILE_WRITE through the save rule. | - |
| 6.1 "Save, in this order", error cleanup | OPEN (C-OPEN-2) | The changed text says: "On any error in (1)-(5): close `fd` if it is open, remove the temp file". Step (1) uses `'wx'`, so it can fail with EEXIST when a file is already at the temp path. Reading 1: still remove whatever is at the temp path. That deletes a file todo did not create, which contradicts the unchanged sentence "a leftover `*.tmp-*` file ... is never read, changed or removed". Reading 2: remove the temp file only if step (1) created it. The missing-parent case (no temp file to remove) is already pinned by the cli "parent folder missing" fixtures (E_FILE_WRITE), so it is not part of this OPEN. | No -> assume. It needs a leftover with the same pid and random part, which is very unlikely. The only file at risk is a stray temp copy, which SPEC 10 says the owner may delete. Suggested answer: Reading 2, one clause ("remove the temp file only if step (1) created it"). |
| 6.4 rows (save order, absolute-form, section sort) | NONE | Each row names an existing check or fixture. | - |
| 7.2 step (3), raw `req.url` | NONE | `/` and `/?x=1` give 200, which agrees with the existing web cases. `/tasks.json`, `/index.html`, `/../todo.json` and absolute form give 404. 7.4 "route" is still `GET /`, `HEAD /`. | - |
| 7.3 fs call list | NONE | The list now matches the save steps. `lstatSync` and `realpathSync` are gone, which agrees with "nothing in todo checks for them". | - |
| IR-38 marked superseded; IR-44 to IR-48 added | NONE | The IR-45 "Checked by" column says AC-04, but neither AC-04 nor any other check tests permissions. The IR-45 row itself says "stated limit; no fixture", so it reads one way: nothing checks permissions. | - |
| 15 Approval, Assumed-by-Lead count | OPEN (C-OPEN-3) | The changed line lists "IR-06 to IR-21, IR-27 to IR-33, IR-35 to IR-37, IR-39, IR-40, IR-42, IR-43, IR-47, IR-48 (31)". That list has 16 + 7 + 3 + 2 + 2 + 2 = 32 rows. The count (31) and the list disagree, so it is unclear which one the approval is meant to record. | No -> assume. It affects only the approval record, not what a user sees, what is stored, security, or anything hard to undo. Fix: change it to 32 (v0.4 had 31; IR-38 is no longer assumed; IR-47 and IR-48 were added). |
| fixture: stores `valid-sections-unsorted.json` + index.json entry | NONE | The file is valid under 6.1 (titles, timestamps, `doneAt` rules, `nextId` 6 > 5). Its `ids` are in display order, as the index rule says. | - |
| fixture: cli "list sorts across open and done" | NONE | stdout follows the 7.1 `list` format. `end` "unchanged" is right because `list` never writes. | - |
| fixture: web "each section sorted by id" | NONE | The `inOrder` strings match the 8.2 markup and the existing `inOrder` cases. With no `end`, the default "unchanged" applies. | - |
| fixture: web "absolute-form target is not found" | OPEN (C-OPEN-1) | `path` is `http://127.0.0.1:<PORT>/`. The web-cases rule only defines `<PORT>` for the default Host header, not for `path`, and the note says the client sends "this exact request target". Reading 1: put the real port in place of `<PORT>`. The server then gets the absolute-form target and must answer 404 per 7.2 (Node v26.4.0 passes it through as `req.url`). Reading 2: send the text literally. Node's HTTP parser rejects `<` / `>` in the target before the handler runs, and I saw Node's own 400. Per IR-40 that answer is outside the contract, so a correct build fails this case. | No -> assume. Only the test harness is affected; what the product does is fixed by 7.2. Suggested answer: Reading 1. Add "`<PORT>` in `path` is replaced the same way" to the web-cases rule. |

## 3. Result

`FAIL`. All five run-4 items are CLOSED: D3a, E2a, E2b, F1a and O2. The changed text still has three OPENs:
- C-OPEN-1: `<PORT>` in the `path` of web "absolute-form target is not found" (assume: it is replaced).
- C-OPEN-2: the save-error cleanup "remove the temp file" when step (1) fails with EEXIST, which conflicts with "a leftover is never removed" (assume: remove only a temp file this save created).
- C-OPEN-3: the Assumed-by-Lead count in 15 says 31 but lists 32.

None of the three changes what a user sees, what is stored, security, or anything hard to undo, so each is "assume" (Lead's pick, entered as an `ASSUMED BY LEAD` register row). Asked: 0. Assumed by Lead: 3.

Status: ready. The verification is complete. The result is FAIL, so builders stay blocked until the Lead closes the three items above.

Needs a person: nothing.

## Outside scope (not counted)
- D3a and E2b are stated limits with no runtime check. A build that keeps `realpathSync` handling, or copies the old file's mode, passes every fixture. Only QA code reading against 6.1 and 7.3 catches it.
- `<random>` in the temp file name has no definition (unchanged text). C-OPEN-2 is unlikely only if it is truly random.
