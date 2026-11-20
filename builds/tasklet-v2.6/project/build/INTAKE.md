# Intake (from kit templates/INTAKE.md, Proofline v2.6 candidate)

Filled by the Lead from the owner's message on 2026-11-15. Blank = not given; "Q#" = asked in the Phase 0 batch.

- **Idea in one sentence:** A command-line to-do list that stores tasks in a JSON file, with add, list, done and remove, plus a one-page web view of the list.
- **Who uses it:** the owner, alone, on their own computer.
- **The one journey that must work:** add a task -> list it -> mark it done -> see it in the web view -> remove it.
- **Must have in v1:** add, list, done, remove; JSON file storage; one-page web view.
- **Explicitly not in v1:** (Lead proposal, shown at approval) accounts, sync, sharing, due dates, priorities, tags, editing a task's text, undo.
- **Source material or existing repository:** none (empty folder).
- **Closest archetype:** 2 (command-line tool) with the web view borrowed from 1 (local-first web app).
- **Stack preferences or limits:** Node 26 available; no network (so no npm dependencies).
- **Data sensitivity:** personal notes only; no payment/health data.
- **Will it be sold or distributed?** no - personal use.
- **Borrowed names, characters or brands?** none; neutral name.
- **Actions that must always need my confirmation:** Q4.
- **Other work in the same folder:** none stated.
- **What "done" looks like:** NOT FOUND (Lead proposes: the journey above works from a fresh folder, tested).
- **Soft words used:** "one-page" (-> a single HTML page, one route; criterion to be written).
- **Upgrade only:** N/A.

## Capability probe (Step 0)
- Read/write files: yes (project, kit, packets folders only).
- Run commands: yes. `node --version` -> v26.4.0. git present.
- Launch separate workers: no -> mode MULTI-CHAT (owner carries packets).
- Browser: not probed for this build; web view will be checked by HTTP fetch of the page.
- External services / network: none.
