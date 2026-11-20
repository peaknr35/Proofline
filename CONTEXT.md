# Proofline: how the repo fits together

An umbrella with two repeating units. **A kit version** changes `kit/` and ships it. **A build** uses a version of the kit and leaves a record in `builds/`. They meet at the self-test: a version stays a candidate until a build has run `KIT-SELFTEST.md` on it.

```
kit/ ──(build-plugin.py)──> dist/proofline-plugin.zip ──> installed skills and agents
  │                                                          │
  └── KIT-SELFTEST.md ──> a self-test build in builds/ <──────┘ (a fresh agent runs the kit)
                                │
                                └── GRADES.md ──> CHANGELOG.md (status changes only from results)
```

## The version cycle
1. **Change** the part in `kit/` (find it in `kit/CONTEXT.md`). **Version:** while the current version is still an untested candidate, fold the change into it (the v2.4 changes went into v2.5 the same way). Start a new version only after the candidate's full self-test (a `self-test` row in `builds/CONTEXT.md`; an `agent test` does not count), or when the owner (the person who maintains this repo) says. A new version changes the `proofline-build` `SKILL.md` and `UNIVERSAL-PROMPT.md` titles and `README.md` together; check K1 fails if they disagree.
2. **Check**, from the repo root:
   - `_tools/check-kit.mjs` with node (11 checks), and `_tools/check-kit.test.mjs` with `node --test` (each check shown failing on a broken copy)
   - if the research checker changed: `node --test kit/skills/proofline-build/scripts/check-research.test.mjs`
   - if eyes changed: `cd kit/skills/proofline-build/tools/eyes && uv run --with pytest -m pytest -q`, then `eyes doctor --live` (the installed `eyes` is an editable install of that folder, so it already runs the changed code)
3. **Record** it in `CHANGELOG.md` under the candidate, saying how strong the evidence is. Two words differ: a part is "tested live" when its own checks ran against the real thing; a kit version is "tested" only after a self-test build.
4. **Package and install:** `python _tools/build-plugin.py --install ~/.claude/skills --agents ~/.claude/agents` (writes `dist/proofline-plugin.zip` too). If eyes changed: `uv tool install --force -e kit/skills/proofline-build/tools/eyes`.
5. **Self-test** the installed kit as a build (below). Only that build's `GRADES.md` can move the version from candidate to tested.
6. **Publish:** commit; push only when the owner says.

## A build
Real projects usually live in their own folder (for example `E:\project-factory\projects\`). Build here only when the record should stay with the kit: self-tests, comparisons, or a project the owner wants kept here.

1. Make `builds/<slug>/` (a self-test adds the version: `<slug>-v2.7/`) and add its row to `builds/CONTEXT.md`, filling every column: Kind (`self-test` = a full `KIT-SELFTEST.md` run; `agent test` = one agent or tool tried on a real task; `comparison`; or `project`, each followed by a short description in brackets), Kit version (as in the `SKILL.md` title, "candidate" included), Date, Status (`in progress`), Result (`-` until graded), Read first (`<slug>/AGENTS.md`, the build's entry file, which the Lead writes first).
2. Install the kit if it is not installed (version cycle step 4). Then run it from inside the build's folder (`cd builds/<slug>`), so the build has its own entry file and does not take this repo's as its own: for a project, `claude --agent proofline-lead` or the `proofline-build` skill; for a self-test, follow `kit/skills/proofline-build/KIT-SELFTEST.md`, and give the agents a kit copy without `KIT-SELFTEST.md`, `_tools/` or `builds/`.
3. The build keeps its own entry file, contract, handoffs and evidence inside its folder.
4. Grade it with a fresh agent that did not run it (`GRADES.md`). Set the row's Status to `done`, fill Result, and point Read first at `GRADES.md`.

## Load for each kind of task
| Task | Load | Skip |
|---|---|---|
| change one agent | `kit/CONTEXT.md`, that agent file | the other agents, `builds/` |
| change the method | `kit/skills/proofline-build/SKILL.md`, the template it names | the prompts unless a core rule changed (check K8) |
| change eyes | `kit/skills/proofline-build/tools/eyes/README.md`, the module for that platform | `.venv/` |
| review a past result, or how a rule fared | `builds/CONTEXT.md`, that build's "Read first" file | the build's source code |
