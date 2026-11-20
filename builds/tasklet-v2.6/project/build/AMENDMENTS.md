# Budget amendments (build record)

| ID | Date | What changes | Scope | Approved by | Evidence shown before approval |
|---|---|---|---|---|---|
| AM-01 | 2026-11-15 | Spec gate repair budget 2 -> 3. Contract v0.4 counts as repair 3. | This build only; the spec gate only. Build-stage gates keep SPEC section 12's budget of 2 repairs. The kit default is unchanged. | the owner (relayed in chat: "option 1 ... repair budget is 3 for this build only, so v0.4 counts as repair 3") | Lead report 2026-11-15: OPEN 10 -> 4 -> 1, every closure verified, options 1-3, and the Lead's own slip (v0.4 written before asking) |

If gate run 4 (on v0.4) is not PASS, the budget is spent: the Lead stops with no further repair and offers option 2 (cut the remaining items to non-goals, which needs a new amendment) or option 3 (stop).
SPEC.md is not edited for this amendment, so the v0.4 text under review in packet 04 stays as sent.

| ID | Date | What changes | Scope | Approved by | Evidence shown before approval |
|---|---|---|---|---|---|
| AM-02 | 2026-11-15 | (1) Spec gate repair budget 3 -> 4; contract v0.5 is repair 4. (2) Gate run 5 is a VERIFICATION run: the reader checks that each run-4 item (D3a, E2a, E2b, F1a, observation O2) is closed, and reads only the text changed from v0.4 to v0.5 for a new two-way reading. It does not re-probe unchanged sections. If run 5 passes on that scope, the contract goes to the owner for approval; if not, stop. | This build only. | the owner (relayed in chat, with the decisions "A, yes, no, no") | Lead report 2026-11-15 after gate run 4: OPEN 10 -> 4 -> 1 -> 3, every closure verified, two of run 4's items real (power cut, permissions) |

**Recorded deviation from the method as written (AM-02 part 2).** SKILL.md Phase 1 step 5 and templates/SPEC-GATE.md say each OPEN is closed "and the gate is run again", meaning the full gate. Run 5 is not a full gate run: sections of v0.5 that did not change from v0.4 are covered only by gate run 4, which found them PINNED or N/A. Evidence level for the contract at approval: unchanged text = full gate run 4 (fresh context); changed text = verification run 5. The final report must state this. Possible kit change (to propose in Phase 5, not applied): a stopping rule for the spec gate.

| ID | Date | What changes | Scope | Approved by | Evidence shown before approval |
|---|---|---|---|---|---|
| AM-03 | 2026-11-15 | Gate run 5 (verification) FAILED with 3 OPEN items in changed text, all judged "no" on ask-or-assume. Instead of stopping (AM-02), the three are closed as ASSUMED BY LEAD register rows using the reader's suggested answers (IR-49 web fixture `<PORT>` in path is replaced; IR-50 remove the temp file only if this save created it; IR-51 count corrected), with NO further gate run. The contract (v0.6) then goes to the owner for approval. | This build only. | the owner (relayed in chat) | gate run 5 result: all five run-4 items closed; C-OPEN-1 to 3 with the reader's ask-or-assume judgement "no" for each |

**Second recorded deviation from the method as written (AM-03).** SKILL.md Phase 1 says one OPEN means no builder starts and the gate runs again; the contract template says a contract is "not approvable while the gate is UNDERSPECIFIED". v0.6 goes to approval with no gate run ever returning PASS, and its three newest edits read by no gate reader. The rule applied is the Lead's proposal of 2026-11-15 (close items that change nothing a person sees or stores, nor money, security or anything hard to undo, by recorded Lead assumption without a rerun). It is a PROPOSED kit change, used here once by owner amendment; it is not approved into the kit.

## Pending amendment proposals (decided by the owner at delivery)
| ID | Raised | Proposal | Lead view | Status |
|---|---|---|---|---|
| P-01 | 2026-11-15, B1 handoff U1 "Beyond the contract" | `scripts/run-tests.mjs` prints `run-tests: usage: node scripts/run-tests.mjs [--dir <folder>]` and exits 2 for any argument list other than none or `--dir <folder>` (SPEC 7.3 is silent on other arguments) | keep: a developer tool, not product surface; ignoring bad arguments would run the wrong tests | DECIDED 2026-11-15 by the owner: keep. No contract text change; recorded here as an accepted extra to SPEC 7.3 |
