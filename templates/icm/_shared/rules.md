# Rules (apply in every folder)

## Release
- <Which release is frozen, when, and what may still ship (e.g. bug fixes only, each tagged).>
- New features go on a branch and a separate address or port, never the live one.

## Evidence and honesty
- Every claim about users, demand or results has a status: **MEASURED** (a real file or event), **THEY SAID IT** (a real person's words), **PLANNED** (a goal), or **SIMULATED** (a model's opinion).
- SIMULATED is never proof and never appears in public copy as evidence.
- Public copy only describes what is in `_shared/product-facts.md`.
- Never invent users, quotes, numbers, prices, dates or consent. Missing = `NOT FOUND`, added to follow-ups.
- Success and stop lines are set before a test starts and never moved after seeing results.

## Privacy
- <Where personal data lives, that it is git-ignored, and when agents may open it.>
- Secrets live in `.env` (git-ignored) and never in files an agent reads.

## Agents
- Draft, don't act: never send, post, publish, deploy, pay, delete or change accounts without the owner saying yes, each time.
- Save new versions; don't overwrite earlier outputs. Superseded files get a note at the top linking to the replacement.
- Rule changes are proposed with evidence, never applied silently.

## Enforced vs requested
| Rule | Enforced by (code, test, permission) or "instruction only" |
|---|---|
| <rule> | <how> |
