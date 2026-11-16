---
status: approved
date: 2026-11-15
decided_by: the owner (IR-22; AM-01 to AM-03)
---

# Neutral name "todo"; one builder; how the contract was approved

## Context
No brand is involved, so the product gets a neutral name. Separately, the owner asked for four builders at first, then chose one. The spec gate ran 5 times without a clean PASS.

## Options considered
| Option | For | Against |
|---|---|---|
| One builder for U1-U4 in order (chosen) | the method's default for a small bounded tool | no parallel speed-up |
| Four builders | owner's first request | 3 extra layer seams in about 300 lines; usually slower (kit evidence card) |

## Decision
Name: `todo` (package and command). One builder, then a fresh QA (IR-22). The contract was approved under owner amendments AM-01 to AM-03, two of them deviations from the method as written (`build/AMENDMENTS.md`, SPEC section 15).

## Consequences
The final report states the gate history and that the v0.6 edits were read by no gate reader.

## Revisit when
The next build with this kit: compare its gate history with this one.
