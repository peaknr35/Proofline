# Handoff - <role / stage>

Project: · Build ID: · Contract version: · Plan version: · Mode:

## Files
| Path | Created / changed | Purpose |
|---|---|---|

## Behavior delivered
Map each item to an acceptance criterion ID.

## Checks
| Check | Command or method | Actual result | Evidence | Faked or live? |
|---|---|---|---|---|

Write `NOT RUN` where execution was unavailable. Test counts come only from observed output.

## Interfaces as built
One row per shared interface, file format or payload this role produces or consumes. Add a row for every rule about a shared format that no fixture pins down, with how you read it. The seam check reads this table.

| Interface (SPEC reference) | Produce or consume | Fixture it was tested against | Any difference from the contract |
|---|---|---|---|

## Beyond the contract
Anything built that the contract does not list (flag, option, route, output format, message, file written). For each: remove it, or propose it as an amendment with the reason. Write "Nothing" only after checking the help output and the code.

| What | Where | Remove or propose |
|---|---|---|

## Baseline comparison (upgrades and repairs)
Target fixed: · target not fixed: · new failures: · failing before and after: · newly passing: · compared by: <command or script>

## Interpretations
| Contract reference | What I assumed | Why | Risk if wrong |
|---|---|---|---|

Write "None identified" only after checking.

## Mismatches and blockers
Expected · observed · evidence · affected owner · proposed resolution.

## Abstentions
What I did not do because an input or evidence was missing, and what would unblock it.

## Repair history
| Attempt | Failure addressed | Change | Result |
|---|---|---|---|

Checks do not count as attempts.

## Cleanup
Temp files and folders left behind by my tests: <count before / after one run; must be equal>.

## Folder contracts
Which `CONTEXT.md` files I updated and what changed (commands, counts, rules). Proposed changes to the router, root `CONTEXT.md` or `_shared/` (Lead decides).

## For the next role
Required inputs · environment · commands · known limits · approval needed.

## Reuse candidates (optional)
Candidate · where it came from · proven under (model, tool, build size) · where it would apply · how to test it · status: PROPOSED
