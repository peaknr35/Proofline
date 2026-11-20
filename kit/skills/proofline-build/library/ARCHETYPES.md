# Archetypes - starting points

Pick the closest one in Phase 0 and adapt it. These are starting shapes, not finished contracts. Add your own after each delivery (see PATTERNS-LOG.md).

Every archetype also gets the ICM foundation (`templates/icm/`): `AGENTS.md`, root `CONTEXT.md`, `_shared/`, `_templates/`, `planning/decisions/`. The **Folders** line in each lists the working folders that each get their own `CONTEXT.md`.

The **Units** line in each archetype suggests work units, not fixed builders: one builder may take several in order. Shared foundations come first and have one owner. For every seam an archetype lists, the contract needs one check that only the joined system can pass (for example: create through the interface, read back through the API and the stored file). Start each archetype with one builder per unit and add REVIEW only on the units where a mistake is expensive.

## 1. Local-first web app
A server over local files or a small database, a browser interface, optional command line.
- **Units:** foundation (schema, storage layer, error shape, id and date formats) → one unit per user journey, each through screen, API and storage (for example: create and edit a record · find and list · import or export) → AI-assisted feature as its own unit only if required. 1-4 builders.
- **Seams to fix in the contract:** every API route with example request and response fixtures; error shape; id and date formats.
- **Acceptance skeleton:** install and start with one command · primary journey works in the browser · data survives restart · bad input is refused with a clear message · works at phone width.
- **Failure drills:** malformed body · unknown id · path tricks in ids and file names · missing optional file · two edits to the same record.
- **Folders:** `app/` (with `src/CONTEXT.md` for the layer rules and `tests/CONTEXT.md` for what is covered) · `content/` if content is drafted before it ships · `ops/` if deployed · `testing/rounds/` if real people test it · `business/` if sold.
- **Common mistakes:** test command that finds no tests · interface built against a fake that drifted from the API · percentages vs fractions.

## 2. Command-line tool or script
- **Units:** one. One builder + fresh QA.
- **Seams:** argument and flag list · exit codes · output format (human and machine) · files read and written.
- **Acceptance skeleton:** help text matches behavior · each command works on a fresh folder · errors go to the error stream with a non-zero exit · no change is made when confirmation is refused.
- **Folders:** `src/`, `tests/` · usually no `_templates/` beyond `decision.md`.
- **Failure drills:** missing argument · unreadable file · interrupted run · piping output to another program.

## 3. Staged agent pipeline (folder-as-architecture)
Numbered stage folders, a contract per stage, checks before work moves on, human approval at set points.
- **Units:** foundation (stage contract format, state names, check types) → run a stage and gate it → review and approve → repair and resume. A review screen is part of the review unit, not a separate builder. 1-3 builders.
- **Seams:** stage contract format · output file formats · check types and their parameters · state names and how each is derived · what "approved" is tied to.
- **Acceptance skeleton:** a run goes start to finish with every gate enforced · a failed gate gives a specific reason · checks never use up repairs · changing an upstream output marks dependents stale · the AI layer cannot approve or commit.
- **Folders:** numbered stage folders, each with `CONTEXT.md` and `output/` · `_factory/` (or `_shared/` + `_templates/`) for recipes, rules and skills, kept apart from the product folders · the engine's code folder.
- **Failure drills:** missing section · out-of-range value · unsourced claim · edit after approval · upstream change · repair budget exhausted.
- **Common mistakes:** direct vs indirect dependencies read differently by two builders · approvals that survive an input change · templates that pass checks while still empty.

## 4. Automation or integration (system A → system B)
- **Units:** foundation (receipt format, duplicate rule, settings) → one unit per external system or per flow (read from A · write to B · schedule and report). 1-2 builders + fresh QA.
- **Seams:** each external call (inputs, outputs, errors, rate limits) · what counts as a duplicate · what is logged · which actions need confirmation.
- **Acceptance skeleton:** dry-run mode shows exactly what would happen · a real run records a receipt per action · re-running does not duplicate · an outage is reported, not hidden.
- **Folders:** `src/` (adapters) · `ops/` (schedule, credentials setup, recovery runbook) · `build/evidence/` for receipts from test runs.
- **Failure drills:** timeout · partial success · duplicate trigger · expired credentials · unknown outcome (must reconcile before retrying).
- **Note:** without access to the real services, everything is LOCAL TESTED at best. Say so.

## 5. Content or knowledge system
Notes, documents or a knowledge base with structure, search and review routines.
- **Units:** foundation (file naming, metadata fields, folder meaning) → capture → organize and find → review routine. 1-3 builders.
- **Seams:** file naming · metadata fields · folder meaning · what is generated vs human-edited.
- **Acceptance skeleton:** capture, organize, find and review each work end to end · nothing is deleted, only archived · generated files are never the place a person edits.
- **Folders:** the knowledge folders themselves (e.g. PARA), each with `CONTEXT.md` · `_factory/` for templates and routines · the app's code folder if there is one.
- **Failure drills:** odd characters in titles · duplicate names · hand-edited file with unknown fields · empty states.
