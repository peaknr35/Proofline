# Rules (apply in every folder)
<!-- Base: Proofline v2.6 candidate, kit/templates/icm/_shared/rules.md -->

## Contract
- `SPEC.md` (v0.6, approved 2026-11-15) is the source of truth. Code that disagrees with it is the defect.
- `SPEC.md` and `contract/fixtures/` change only by an amendment the owner approves; then every unit that used them is stale.
- Build nothing outside `SPEC.md` 7.4 (the closed surface). An extra is removed or proposed as an amendment.

## Release
- No release exists. Personal use: the delivered folder is the release; the owner decides when to `npm link` it.

## Evidence and honesty
- Claims about the product use the evidence levels IMPLEMENTED · LOCAL TESTED · INTEGRATION TESTED · END-TO-END TESTED. Unrun is NOT RUN.
- `_shared/product-facts.md` lists only what was observed. Never invent test counts, runs or results. Missing = `NOT FOUND`.
- There are no users, demand or business claims in this project (no MEASURED / THEY SAID IT / PLANNED / SIMULATED claims needed).

## Privacy
- The owner's real task file (`~/todo.json`) is personal data. Tests never read or write it: they always set `TODO_FILE` to a temp folder.
- No secrets exist in this project.

## Agents
- Draft, don't act: never delete the owner's task file, publish, or change these rules without the owner saying yes, each time.
- Tests clean up every temp folder they create.
- Rule changes are proposed with evidence, never applied silently.

## Enforced vs requested
| Rule | Enforced by |
|---|---|
| contract unchanged during the build | `build/APPROVED-v0.6.sha256` checked by the Lead before accepting any handoff |
| behavior matches the contract | `npm test` against `contract/fixtures/` |
| tests never touch `~/todo.json` | instruction only (QA checks the tests set TODO_FILE) |
| closed surface | instruction only (QA surface scrub) |
| builders edit only their paths | instruction only (MULTI-CHAT; Lead copies only owned paths) |
