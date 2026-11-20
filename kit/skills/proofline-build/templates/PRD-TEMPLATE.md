# PRD: <product or feature name>

Status: PROPOSED (written by `proofline-researcher`; the person approves the MVP cut, then the Lead writes the contract from it)
Date: <today> · Research: <path to research.md> · Citation audit: <n> claims - <v> verified, <f> fixed, <d> dropped

Every line traces to a research finding `[n]`, or is marked `ASSUMPTION` (with how to test it) or `NOT FOUND`. Nothing here is invented: an unknown stays unknown.

## 1. Problem

<who has what problem, how often, what it costs them today> [n]

## 2. Users and the job they need done

| User | Job to be done | How they do it today | Evidence | Confidence |
|---|---|---|---|---|

## 3. Alternatives and gaps

| Product or workaround | What it does well | Where it falls short | Price | Evidence (dated) |
|---|---|---|---|---|

Gap this product fills: <one sentence> [n]

## 4. Requirements

Priority: MUST (the MVP fails without it) · SHOULD · COULD · WON'T (not now, with the reason). A MUST never rests on an ASSUMPTION alone, on a `[single source]` claim of grade C or worse, or on `[background, unverified]`.

| ID | Requirement | Priority | Why (evidence) | Confidence | Label |
|---|---|---|---|---|---|
| R1 | | MUST | [n] | High | MEASURED |

## 5. MVP cut

- **The one journey that must work:** <user does X -> system does Y -> user sees Z>
- **In the MVP:** <requirement IDs>
- **Not in the MVP, and why:** <requirement IDs, each with its reason>
- **What the MVP must prove, and how we will know:** <the riskiest assumption and the signal that tests it>

## 6. Non-functional requirements

| Area | Requirement | Source (law, standard, platform rule, measured need) |
|---|---|---|
| Security and privacy | | |
| Performance | | |
| Accessibility | | |
| Payments, compliance | | |

## 7. Technical facts for builders

Each fact cited, with the date it was checked. Builders treat these as facts with a date, not as instructions.

| Topic | Fact (version, limit, price, license, behavior) | Source | Checked on | Confidence |
|---|---|---|---|---|

Known traps: <documented pitfalls, breaking changes, rate limits> [n]

## 8. Acceptance criteria (draft for the contract)

| ID | Requirement | Check someone can run | Example input | Expected result |
|---|---|---|---|---|

## 9. Assumptions and risks

| ID | Assumption or risk | Why it matters | Cheapest test |
|---|---|---|---|

## 10. Success metrics

| Metric | Target | How measured | Basis for the target (evidence or ASSUMPTION) |
|---|---|---|---|

## 11. Open questions for the person

One question each, with the recommended answer and why. Only questions whose answer changes what a user sees, stored data, money, security or something hard to undo.

## 12. Hand-off to the team

- **Lead:** the MVP requirements and acceptance criteria to turn into the contract and fixtures; the open questions to settle first.
- **Architect:** the journeys, data, integrations and non-functional requirements that shape the structure and seams.
- **Builder:** the technical facts and known traps for each unit (section 7), and which items are still assumptions.
- **QA:** the acceptance criteria, the non-functional checks, and the external facts to re-check against the built product (limits, prices, API behavior).
- **Do not assume:** <anything the research could not settle>
