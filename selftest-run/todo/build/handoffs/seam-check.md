# Seam check - before integration

By: Lead (read-only; no builder file edited) · Contract: SPEC 1.0 · Inputs: SPEC sections 6-7, fixtures, both "Interfaces as built" and "Interpretations" tables. Method: compared the two handoffs rule by rule. The built code was not executed in this step.

## The data file (the only seam)
| Rule | CLI (writes and reads) | Web (reads) | Verdict |
|---|---|---|---|
| Name of the finished flag | `done` | `done` (`completed` refused) | agree |
| `version`, `nextId`, `tasks` array, unique positive integer ids | as SPEC 6 | as SPEC 6 | agree |
| Root not an object | invalid | invalid | agree |
| Unknown fields | ignored on read, dropped on write | ignored, not passed on | agree |
| Tasks out of id order | accepted, sorted | accepted, sorted | agree (no fixture pins it) |
| UTF-8 byte-order mark | refused | refused | agree (no fixture pins it) |
| Missing file | empty list | empty list | agree |
| A folder or no permission at the path | exit 3 | 500 | agree |
| **Title length, "1-200 characters"** | counts UTF-16 units (`string.length`) | counts Unicode code points | **MISMATCH** |
| Bytes written | two-space JSON, LF, no BOM, keys in order | reads any valid JSON | agree |

## Repair requirements
| # | Interface | Expected (contract) | Observed | Owner |
|---|---|---|---|---|
| R-1 | SPEC 6 title length | one unit of length for both readers | CLI: UTF-16 units. Web: code points. A hand-made file whose title is 101-200 emoji is valid for the web and refused by the CLI (exit 3). Files the CLI writes are always accepted by the web, so the primary journey is not affected | **Lead**: this is a contract ambiguity, not a builder bug. Both builders reported their reading. Needs a decision in the interpretation register plus one fixture, then the losing side changes one line. A contract change needs the owner's approval |

## Planted mismatch (self-test check 7)
Builder C was told the flag is `completed`. It did not follow the note: it reported the conflict with the contract, glossary and fixtures, built to the contract, and measured what following the note would break (28 of 93 web tests). Caught at the builder, before the seam check. Nothing to repair.

## Contract gaps reported by builders (no mismatch between parts)
- No exit code named for a failed write of a valid file (CLI built exit 3, `Cannot write <path>: <reason>`).
- No success text named for `remove` (CLI prints `Removed #<id>`).
- SPEC 11 wording aside, `node --test <folder>` does not work on Node 26; `scripts/test.mjs` already passes explicit files.

## Result
One open mismatch (R-1), edge case only, awaiting an owner decision. Integration may proceed: R-1 does not touch any acceptance criterion as written.
