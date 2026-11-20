# Patterns log - where speed compounds

After each delivery, add what could be reused. Nothing here is trusted until its status is APPROVED. A model recommending a pattern is not evidence.

Two labels per pattern, kept apart (see `SOURCES.md`):
- **Adoption:** PROPOSED → EXPERIMENTAL (being tried on real builds) → APPROVED → RETIRED, or REJECTED.
- **Evidence:** UNREAD · DESIGN_RATIONALE · EMPIRICAL_EXTERNAL · REPRODUCED_LOCAL.

Also give each pattern a type: safety requirement, correctness invariant, or performance hypothesis. Only performance hypotheses need a comparison before they are called faster; use `templates/EVIDENCE-CARD.md`.

| ID | Pattern (what to reuse) | Form: archetype / contract clause / fixture set / component / checklist / prompt | Kind: safety / correctness / performance | Came from (builds) | Applies when | Evidence | Tested on (cases, result) | Known risks | Adoption | Approved by / date | Review date | Rollback reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P-001 | | | | | | | | | PROPOSED | | | |

## Seed entries (from the first two builds this kit was drawn from; treat as PROPOSED until you confirm them on your own project)

| ID | Pattern | Type | Applies when |
|---|---|---|---|
| S-01 | Golden fixtures for every shared payload, loaded by every builder's tests | contract clause | any build with two or more builders |
| S-02 | Test command must fail on zero tests; prove the count | checklist | always |
| S-03 | Checks never consume repairs; first attempt + two repairs, then stop | contract clause | any retry loop |
| S-04 | Approval tied to the exact inputs, outputs and rules it covered; any change makes it stale | contract clause | any approval step |
| S-05 | Templates and offline modes mark gaps so the checks fail until a person fills them | contract clause | any generated draft |
| S-06 | Rule changes are proposed with evidence, tested against accepted work, approved, checkpointed, reversible | contract clause | any system that learns from edits |
| S-07 | Neutral product name; borrowed material in one personal-use file; release step strips and proves it | checklist | anything inspired by someone else's brand |
| S-08 | Rates stored as whole percents, never mixed with fractions | fixture set | any dashboard or metric |

## Seed entries from Open Learning (an ICM workspace built by hand; PROPOSED until confirmed on a kit build)

| ID | Pattern | Type | Applies when |
|---|---|---|---|
| S-09 | Router + root CONTEXT.md with current state in one place only + a CONTEXT.md per folder with a Do NOT load list | contract clause | every project |
| S-10 | Claim labels: MEASURED, THEY SAID IT, PLANNED, SIMULATED; simulated never appears as evidence | checklist | anything with users, demand or sales claims |
| S-11 | `_shared/product-facts.md` is the only source for public copy; never promise unbuilt features | contract clause | anything sold or shown publicly |
| S-12 | Release frozen during a test round: bug fixes only, each tagged; new work on another branch and port | checklist | any live tester or pilot round |
| S-13 | Personal and tester data in one git-ignored `raw/` folder; agents open it only through a counting script that never prints private text | checklist | any project with user data |
| S-14 | One short decision record per lasting choice, with "replaced by" when superseded | component | every project |

## Seed entries from the papers (v2.2, relabelled in v2.3)

| ID | Pattern | Kind | Evidence | Adoption | Applies when |
|---|---|---|---|---|---|
| S-15 | Split by seams first; staff second; one worker per unit; delegate only for complementary work, an alternative attempt or an independent check | performance | EMPIRICAL_EXTERNAL (card E-1) | APPROVED as default; exceptions EXPERIMENTAL | every build |
| S-16 | One check per seam that only the joined system can pass | correctness | EMPIRICAL_EXTERNAL (WorkflowArena design) + one local run | EXPERIMENTAL | two or more parts |
| S-17 | Every gate is shown failing on a known-bad sample; this shows it can fail, not that it catches everything | correctness | DESIGN_RATIONALE + one local run | EXPERIMENTAL | always |
| S-18 | Seam check before integration; the checker reports, does not edit | correctness and performance | DESIGN_RATIONALE + one local run (card E-4) | EXPERIMENTAL | two or more builders |
| S-19 | Baseline before change; compare by test name in code; a new failure blocks | correctness | DESIGN_RATIONALE | PROPOSED (no upgrade run yet) | upgrades and repairs |
| S-20 | A changed input makes dependents stale and voids their approvals | correctness | DESIGN_RATIONALE | PROPOSED | any staged work |
| S-21 | The same correction repeated (default three builds) becomes a proposed source change | performance | DESIGN_RATIONALE (card E-5) | PROPOSED | any repeated workflow |
| S-22 | A role is written as: receives, owes, delivers, to whom, done when | correctness | DESIGN_RATIONALE + one local run | EXPERIMENTAL | every worker packet |
| S-23 | (v2.2-2.3) Strongest model on contract, packets and QA; cheaper models build specified units | performance | not established (card E-3) | REJECTED in v2.4: replaced by S-31 | - |
| S-31 | One known-capable model for every role as the baseline; another model takes a role only after a probe for that role; record the configuration; routing is optional | performance | DESIGN_RATIONALE | PROPOSED | more than one model available |
| S-32 | Shared foundations get one named owner and are accepted before dependent units start; units that would edit the same file run in sequence | correctness | DESIGN_RATIONALE (Li et al. list shared-state and merge failures) | PROPOSED | two or more builders |
| S-24 | Each folder contract has a Verify section | correctness | DESIGN_RATIONALE | PROPOSED | pipelines and multi-stage content |
| S-25 | Whole-feature owners by default; a layer split only with a stable written boundary, fixtures that pin it down and a joined check (v2.4: now the default, replacing fixed A-D roles) | performance | EMPIRICAL_EXTERNAL (card E-2) | EXPERIMENTAL | two or more builders |

## Entries from the Tasklet self-test (2026-11-13; one build; Claude Fable 5.2, desktop app, PARALLEL, size S)

| ID | Pattern | Kind | Evidence | Adoption | Applies when |
|---|---|---|---|---|---|
| S-26 | Builders list every rule about a shared format that no fixture pins down | correctness | one local run: it is how the seam check found the only real mismatch | EXPERIMENTAL | two or more builders |
| S-27 | Tests remove every temp folder they create; QA counts leftovers before and after | correctness | one local run: 81 folders leaked per run until fixed | EXPERIMENTAL | always |
| S-28 | Untrusted text is made safe on every surface it reaches, not only HTML | safety | one local run: QA forged a list line through the terminal | APPROVED (safety; design reasons) | any user or file text |
| S-29 | The router never points at a file that does not exist yet | correctness | one local run: the walk test's only miss | EXPERIMENTAL | every project |
| S-30 | The Lead updates product facts and current state before QA, and again at delivery | correctness | one local run | EXPERIMENTAL | every build |

## Entries added in v2.5 (from the same Tasklet run's open contract questions; none tested yet)

| ID | Pattern | Kind | Evidence | Adoption | Applies when |
|---|---|---|---|---|---|
| S-33 | Fixtures before prose: for every limit one at it, one under, one over; an error table; every rule points at the fixture that pins it | correctness | DESIGN_RATIONALE + one local run (the build stalled on how a title's length is counted). Papers named for it are UNREAD | PROPOSED | every contract |
| S-34 | Spec gate: a reader who did not write the contract marks each question PINNED, N/A or OPEN; any OPEN blocks building | correctness | DESIGN_RATIONALE + one local run (three contract gaps reached the builders). Papers UNREAD | PROPOSED | every contract |
| S-35 | Ask or assume: ask when the answer changes what a user sees, stored data, money, security or something hard to undo; otherwise the Lead decides, records it and shows it at approval | correctness; the cut-off between ask and assume is a setting to tune | DESIGN_RATIONALE. Paper UNREAD | PROPOSED | every contract |
| S-36 | Closed surface: the contract lists everything the product exposes; builders report anything beyond it; QA compares the built surface with the list; extras are removed or proposed | correctness | DESIGN_RATIONALE + one local run (behavior was built that the contract never named) | PROPOSED | every build |
| S-37 | Soft words in a brief (smooth, safe, simple, "when possible") become a runnable check or a non-goal | correctness | DESIGN_RATIONALE | PROPOSED | every intake |

## Entries added in v2.6 (from dsh-superagent-prototype; none tested in a kit build yet)

| ID | Pattern | Kind | Evidence | Adoption | Applies when |
|---|---|---|---|---|---|
| S-38 | Attention is the scarcest input: speak only when a person must act or can use a result; one concrete question with a recommended answer | performance | DESIGN_RATIONALE (a built prototype, not evaluated) | PROPOSED | always |
| S-39 | Probe the environment before the first question; a missing prerequisite is a plan item, not a question | performance | DESIGN_RATIONALE | PROPOSED | always |
| S-40 | Never ask for a secret in chat; steps that need the person's hands go in one message with exact commands | safety | DESIGN_RATIONALE | APPROVED (safety; design reasons) | any sign-in, key or account |
| S-41 | One report status from six words; ready means checks passed; a partial result is blocked and marked a draft | correctness | DESIGN_RATIONALE | PROPOSED | every handoff |
| S-42 | Stop by impact, not by effort: an interface, responsibility or product change goes back to the contract and spends no repair | correctness | DESIGN_RATIONALE; conflicts in part with the repair cap (SOURCES.md) | PROPOSED | every build |
| S-43 | Real Before and After evidence for any change users see; After alone is a gap | correctness | DESIGN_RATIONALE | PROPOSED | any interface change |
| S-44 | Tests over the kit's own text: versions, counts, links, rule classes, core rules in every prompt form; each check shown failing | correctness | one local run: the check passed on v2.5, then caught the v2.6 version drift the moment it was made | EXPERIMENTAL | any prompt kit |
| S-45 | A copied template records its base (kit version and path) so a later change shows as a difference | correctness | DESIGN_RATIONALE | PROPOSED | every project |

## Entries added in v2.7 (from the v2.6 self-test, 2026-11-15; one build; Claude Opus 5.5, desktop app, MULTI-CHAT, size S; none tested since)

| ID | Pattern | Kind | Evidence | Adoption | Applies when |
|---|---|---|---|---|---|
| S-46 | The spec gate has a depth (`everyday` / `adversarial`); what falls below it is a stated limit, not OPEN | correctness | one local run: five readers found 10, 4, 1, 3, 3 open lines, many far below what a personal tool needs | PROPOSED | every contract |
| S-47 | ASSUME items close by the Lead's recorded decision with no further gate run | correctness | one local run: the owner's AM-03 closed three no-impact items this way and nothing broke later | PROPOSED | every contract |
| S-48 | Every gate run after the first is a verification run: earlier gaps closed, changed text only | correctness | one local run: the owner's AM-02 verification run confirmed all five earlier items closed, but still found three new ones in the changed text | PROPOSED | every contract |
| S-49 | The spec gate is under the repair cap; each contract revision after a failed run is a repair | correctness | one local run: the two rules contradicted each other and the Lead chose the loop (check 9 FAIL) | PROPOSED | every contract |
| S-50 | Ask only when the person could reasonably choose differently and it matters; the same kind of decision is treated alike | performance | one local run: the old rule put stored-data decisions on both sides of the line | PROPOSED | every intake |
| S-51 | The approval is recorded in build/APPROVAL.md with hashes, never inside the approved file | correctness | one local run: recording the approval in SPEC.md changed the approved bytes | PROPOSED | every approval |
| S-52 | Builders and QA list non-ASCII characters before each handoff; pinned characters are escapes | correctness | one local run: the file tool wrote raw separator and bidi characters four times, once breaking a pattern | PROPOSED | any contract that pins characters |
| S-53 | Self-test check 21: plant a mismatch in a handoff so the seam check is exercised | correctness | one local run: with one builder no plant reached the seam check (both runs) | PROPOSED | self-tests |

## How to promote
0. Record the model, tool and build size a pattern was proven under. When those change, it goes back to EXPERIMENTAL until rechecked. One failed run is not a pattern, and one passing run is not proof.
1. Write the entry as PROPOSED with where it came from.
2. Try it on the next suitable build or on a past one; record the cases and what happened.
3. You approve it. Record the date and what to go back to if it causes harm.
4. Review on the review date; retire what no longer earns its place.
