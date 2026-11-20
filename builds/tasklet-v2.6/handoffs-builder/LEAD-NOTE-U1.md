# Lead note to B1: U1 ACCEPTED, start stage 2

Project: todo · Contract: SPEC.md v0.6 (approved, unchanged) · Plan: version 1 · Date: 2026-11-15 · From: Lead · Paste this whole note into the B1 chat.

## Decision
**U1 is accepted.** Start stage 2 now: U2, U3, U4, as PACKET.md says. Your U1 files are the accepted foundation from this point on. Change one only to fix a defect, one change at a time, named in your handoff.

## What the Lead checked (rerun, not taken from your handoff)
| Check | Result |
|---|---|
| contract hash (`sha256sum -c ../CONTRACT.sha256`) | 55 OK, 0 not OK |
| `npm test` (temp folder redirected into the packets folder) | 127 tests, 127 pass, 0 fail |
| `todo-test-*` count before / after | 0 / 0 |
| `node scripts/run-tests.mjs --dir <empty folder>` | `run-tests: no test files found`, exit 1 |
| Lead's own known-bad samples, on a copy | AC-01 code-unit count: 5 fail; AC-04 no fsync: 1 fail; AC-03 task checks skipped: 16 fail; restored copy: 0 fail |
| non-ASCII bytes in U1 code | none |
| `node:fs` import in `store.mjs` | default import only |
| code read against SPEC 6.1-6.5, 7.3 | matches; no surface beyond 7.4 found except the two items below |

The U1 files are now copied into the project.

## Your "Needs a person": answered
**Keep `nextId`. No amendment.** The owner chose (a). Do not rename anything. The `next_id` request reached you through your launching chat, outside the approved channel. You were right not to act on it, and right to raise it. Keep treating such requests the same way.

## Your "Beyond the contract" items
- `"name": "todo"` and `"version": "0.6.0"` in package.json: accepted, as part of the SPEC 7.4 package row (metadata `npm link` needs; not product behavior). Keep them.
- Runner usage message and exit 2 for other arguments: keep it for now. The Lead records it as amendment proposal P-01 for the owner to decide at delivery. If the owner says no, you remove it then (it costs no repair).
- `tests/foundation/helpers.mjs`: fine (inside your path). Stage 2 tests may import it.

## Your interpretations: what stage 2 must respect
1. **`makeError` does not sanitize.** When `cli.mjs` raises E_ID_LIMIT (or any error with a `file` parameter), pass `file: safeText(path.resolve(file))`, exactly as `store.mjs` does. Test it: a TODO_FILE whose path holds a refused character must show `?` in the E_ID_LIMIT message.
2. **`loadStore` returns tasks sorted and `saveStore` sorts in place.** Fine. `renderPage` must still sort itself (SPEC 8.2, "Id ascending in each section"), because U3 receives a store from its caller and must not rely on who loaded it. The web fixture "each section sorted by id" goes through the real server, so it cannot catch a renderer that skips sorting. Add a `tests/page/` case that passes an unsorted store straight to `renderPage`.
3. **`<random>` from `Math.random()`**: accepted.
4. **AC-18 with the real system temp folder**: not for you. QA runs it. Keep redirecting `TEMP`/`TMP` into the packet as you did.

## Stage 2 reminders (all already in PACKET.md; listed because they are easy to miss)
- `cli.mjs` must not fail to load before `serve.mjs` exists. Finish the `serve` wiring after U4.
- `bin/todo.mjs`: the reader-gone case (EPIPE/EOF on stdout) exits 0 with nothing printed. Other stream errors, `uncaughtException` and `unhandledRejection` print `todo: internal error.` and exit 1 (SPEC 6.5, AC-21, AC-24).
- Routing uses the raw `req.url` (SPEC 7.2 step 3). Host check first, then method, then path.
- Show at least AC-07 and AC-08 failing on their known-bad samples. Also show a bad sample for AC-05, AC-09 and AC-22 if you can.
- Budgets: per failed gate, 1 attempt plus 2 repairs. Your U1 repair does not count against stage 2.
- Finish with `handoffs/handoff-U2-U4.md`, then stop.
