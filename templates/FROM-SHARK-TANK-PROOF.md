# Coming from Shark Tank Proof

[Shark Tank Proof](https://github.com/peaknr35/shark-Tank-proof) tests whether a business is worth building. Proofline builds it. The two meet at one file: `founder/build-brief.md`, written by Shark Tank Proof's `/kill-or-build`.

Each kit works alone. Together: Shark Tank Proof decides **what** and **whether**; Proofline decides **how** and proves it runs. Neither does the other's job.

## 1. Find the brief

- `founder/build-brief.md` exists: it is the intake. Do not re-ask what it answers.
- There is a `founder/` folder and no brief: ask the person to run `/kill-or-build` (its step 5 writes the brief). Do not write the brief yourself from the folder; the verdict in it must come from that pack's own tool.
- No `founder/` folder: use `templates/INTAKE.md` as usual.

## 2. The verdict limits the build

Read the verdict at the top of the brief before anything else. It is not yours to change.

| Verdict | What Proofline builds |
|---|---|
| Incomplete | Nothing. Say so and stop. |
| Not yet | Nothing for sale. Say which check failed, and stop. |
| Unproven | Only the test asset the brief names: the smallest thing a real person can pay, sign or book through. Size it as a small build, usually one builder. It must record the thing the success line and the kill line are read from. |
| Profitable | Version 1 of what the real buyer bought: the one journey in the brief. |

If the person asks for more than the verdict allows (the full product on an Unproven plan), say once what the brief says and why, then follow their decision and write it in the interpretation register as theirs. A build cannot make an unproven idea proven.

## 3. The labels carry over, unchanged

Both kits use the same four labels: `MEASURED`, `THEY SAID IT`, `PLANNED`, `SIMULATED`. A fact keeps the label and the claim id the brief gave it. A number takes the weakest label of anything it was worked out from.

| In the brief | In the contract and the product |
|---|---|
| a `MEASURED` or `THEY SAID IT` claim | may be a requirement; cite its claim id |
| a `SIMULATED` or `PLANNED` item the build leans on (most often the price) | a **setting** that can change, or an open question for the person. Never a constant, never an acceptance criterion written as a fact |
| "Words the product may say" | the only source for anything a customer can read: pages, screens, emails, messages. Each line of copy cites its claim id |
| a `PLANNED` promise ("set up in under a minute") | a goal with a check that measures it. It appears in copy only after the check has run and the founder has logged the result |
| `[no claim]` or `NOT FOUND` | a gap. It goes through ask-or-assume like any other; it is not filled in |

The success line and the kill line in the brief were logged before the test. The contract includes an acceptance criterion that the product records what those two lines are read from (deposits taken, pilots signed, bookings made). The build does not move the lines.

## 4. Where things live

- `founder/` is **read-only** for the Lead and every builder. Only Shark Tank Proof's `/receipts` writes the ledger. List `founder/` in the contract as data, not as an owned path.
- The product is built in its own folder beside `founder/`, with its own ICM foundation.
- One home per fact: `_shared/product-facts.md` holds what is **built** and its evidence level. Anything about buyers, demand, price or results stays in the founder's ledger and is pointed to by claim id, not copied.
- The spec gate has two extra questions on this path: does every line of customer-facing copy cite a claim that passes the public gate, and is every `SIMULATED` or `PLANNED` number a setting?

## 5. What goes back

At delivery, add this section to the final report. The founder runs `/receipts` on it; Proofline does not write the ledger.

```
## Back to the ledger

| What the product now does | Shown by (check and evidence file) | Evidence level | Suggested ledger entry |
|---|---|---|---|
| <a promise from the offer that the product keeps> | <test name, file> | <END-TO-END TESTED ...> | kind product, MEASURED, evidence: <file> |
| <a promise the build could not keep> | <what failed> | | log the failure as it is |
| <a real quote or invoice for hosting or tools> | <file> | | kind cost, MEASURED |

Not demand: nothing in this table is a buyer. Built is not sold.
Next: /prove-it to run the test, or /handshake for the person who has to say yes.
```

Only rows at `INTEGRATION TESTED` or above are suggested as `MEASURED`. `IMPLEMENTED` and `LOCAL TESTED` rows stay `PLANNED`.

## 6. When the test comes back

A real buyer says yes or no. The founder logs it, runs `/kill-or-build` again, and the verdict may change. A changed verdict means a new brief, and a new brief is a new contract version: everything that leaned on the old one is stale until rechecked. An Unproven test asset that worked is not version 1; version 1 starts from the new brief.
