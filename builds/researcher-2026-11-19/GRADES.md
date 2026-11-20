# Researcher agent: first live test (2026-11-19)

**Agent:** `agents/proofline-researcher.md`, run as a general-purpose subagent that was told to read that file and follow it.
**Question:** Do multi-agent LLM systems beat a single agent on coding tasks at equal cost? Depth: standard.
**Cost:** 41 tool calls, about 149K subagent tokens, about 6 minutes.
**Report:** `report.md` in this folder. The subagent could not write files, so the Lead saved its returned text and added one note line.

## Did it follow its own rules?

| Rule or check | Result | Evidence |
|---|---|---|
| Minimum work for the depth (6+ searches, 8+ sources) | PASS | 11 searches, 16 sources opened, 1 failed load recorded |
| Searched for the opposite conclusion | PASS | 4 of 11 queries are marked as opposing searches; SQ5 reports what they found |
| Sources graded | PASS | A/B/C on all 15; Cognition marked C as vendor opinion |
| Key claims checked against 2 sources, or flagged | PASS | single-source findings (3, 6, 7) are marked |
| Disagreements shown, not blended | PASS | 4 disagreements, with likely reasons |
| Confidence on every finding | PASS | 10 of 10 |
| Kept results apart from its own reading of them | PASS | inferences labelled as such (SQ1, SQ3, disagreements) |
| Dated sources, recency stated | PASS | SQ6 names the three newest sources |
| Did not cite a page that failed to load | PASS | the CircleCI page was dropped, not cited |
| NOT FOUND used for gaps | PASS | 2 NOT FOUND items, with the searches that looked for them |
| Output shape | PASS | every section present |
| **Rule 4: quotes are exact** | **FAIL (minor)** | see the spot-check below: 1 paraphrase inside quotation marks, 2 quotes cut at a point that drops their scope |

## Independent spot-check of citations

The Lead checked 5 of the 15 sources in separate contexts that had not seen the report's reasoning, and read the EvoMAS PDF text directly.

| Source | Claims checked | Numbers | Quotes |
|---|---|---|---|
| [12] EvoMAS | 79.1 vs 71.4 at matched 31M; 42.7 vs 33.6 | all confirmed (PDF text) | verbatim |
| [5] Vals AI | 1.8x to 5.1x cost; +7.3 points, p = 0.005; -0.3 / +3.4 for Opus; title, author, date | all confirmed | 1 quote ends with a period where the source has a colon and continues ("...budget: a team can boost performance, but higher reasoning effort is an alternative worth weighing") |
| [13] Parallel agent teams | 10 of 12 tasks; 57.4 vs 52.7; verifier sentence | confirmed; 57.4 is 52.0 + 5.4 in the main text, and the comparison covers one task (graph node classification), which the report does not say | the 10-of-12 quote is the first clause of a longer sentence |
| [1] Tran & Kiela | main abstract sentence | - | first quote verbatim; **second quote is a paraphrase in quotation marks** (source: "many reported advantages of multi-agent systems are better explained by unaccounted computation and context effects rather than inherent architectural benefits") |
| [10] Yu et al. | 98.50% vs 97.74%; fourfold time; default to one agent | all confirmed | verbatim, but "recommend defaulting to a single agent" drops the scope "for LeetCode-style coding tasks where fast turnaround matters" |

**Fabrication found: none.** Every source exists, with the stated title, authors and date, and every number checked matches its source.

## Verdict

PASS with one rule broken in a minor way. The research is sound and well sourced, and the conclusion follows from the evidence. Rule 4 (exact quotes) failed 3 times out of about 12 quotes checked. Each time the meaning survived, but in two cases scope was lost.

Likely cause: the fetch tool returns a model-processed version of a page, not its raw text. The agent's own note says most quotes came from those excerpts. Its quotes from the PDF text it extracted itself ([9], [12]) were exact.

## Changes to the agent (adopted 2026-11-19 at the person's request; not yet re-tested)

1. Quote only from raw page text (raw HTML or PDF text extracted locally). A quote taken from a fetch tool's summary is marked `[via fetch summary]` and cannot carry a key claim alone.
2. When a quote ends early, write `...` where it was cut, and keep any scope words that limit the claim ("for X tasks", "in setting Y").
3. When the host blocks subagent file writes, return the report as text and say so. This run already did this, so the rule only needs writing down.

All three are now in `agents/proofline-researcher.md` (rules 3, 4, 5 and the output section), along with a mandatory citation audit (method step 8). The person chose to adopt them after one run instead of waiting for a second. The next run of the researcher is the test of whether they work.

## Machine check of the same report (added 2026-11-19)

`scripts/check-research.mjs` was run on `report.md` after the 15 cited sources were downloaded again as raw HTML or PDF text (kept out of the repository: they are other people's work). It checked 37 quotes and found 31 word for word.

| Line | Source | What the check found | Also found by the hand spot-check? |
|---|---|---|---|
| 43 | [8] Cognition | "answering a well-defined question" - the source says "answering a question"; "well-defined" was added | no (not sampled) |
| 78 | [1] Tran & Kiela | a paraphrase in quotation marks | yes |
| 98 | [9] | "best use of a large budget" and "best result per typical run" are the researcher's own phrases in quotation marks | no (not sampled) |
| 118 | [5] Vals AI | ends with a period where the source has a colon and continues | yes |
| 134 | [13] | a sentence cut short with no "..." | yes |

It also reported that the report has no citation audit line or table; that report was written before the audit rule existed.

Not caught: the [10] quote "recommend defaulting to a single agent" is word for word but drops "for LeetCode-style coding tasks". A text match cannot see words that were left off the end. That stays with the researcher's own audit and the Lead's spot-check.
