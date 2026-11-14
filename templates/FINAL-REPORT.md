# Delivery - <project>

Lead with the result. Short enough to read on a phone.

## 1. Built and tested
What it does · contract version · release-blocking criteria passed (n of n) · actual test results as numbers · remaining blockers.
Do not write "everything works" unless the evidence covers every requirement.

## 2. Run it
The shortest correct install / configure / start steps.

## 3. Delivered
Source · settings example (no secrets) · contract · docs · test evidence · package · known limitations. Say if anything is text only and not a saved file.

## 4. Roles and mode
Mode · roles used, merged or dropped · for each role beyond the first builder: what would have broken without it · independent QA or SELF-REVIEW · anything QA-REPAIRED · what the Lead ran personally · mismatches caught at the seam check vs by QA.

For upgrades and repairs: target fixed · target not fixed · new failures (must be zero to ship) · failing before and after · newly passing.

## 5. Evidence and gaps
| Capability | Evidence level | Evidence | Gap |
|---|---|---|---|

Levels: IMPLEMENTED (present, not run) · LOCAL TESTED (name the fakes) · INTEGRATION TESTED · END-TO-END TESTED · EXTERNAL VERIFIED · DEPLOYMENT VERIFIED.

## 5b. Workspace (ICM) and walk test
Router, root context, folder contracts, shared facts present? · walk test: pass/fail, reads used, misses fixed · `_shared/product-facts.md` and root `CONTEXT.md` match this report? · decisions recorded.

## 6. Before production or sale
Security · licensing · data and privacy · deployment · support · external services not yet verified · unsupported features.

## 7. One next step

## 8. Banked for next time (optional)
Reuse candidates proposed (with the model, tool and size they were proven under) · corrections the owner has now made three builds running (propose a source change) · roles to drop next time · time to approved contract · time to verified delivery, including organizing · repairs used · defects found by QA · comparable earlier build, if any.
