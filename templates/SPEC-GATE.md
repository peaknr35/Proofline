# Spec gate - the contract must pass this before anyone builds

Read the contract the way a compiler reads code: where it is silent, do not guess, refuse. Every line below ends in one of three answers:

- **PINNED** - the contract says it, and a fixture or check shows it (name the fixture).
- **N/A** - the project has no such thing (say why in a few words).
- **OPEN** - the contract is silent or can be read two ways.

One OPEN on a line that applies means the contract is `UNDERSPECIFIED`. No builder starts. Each OPEN goes to "ask or assume" at the bottom, gets one answer, a fixture, and a row in the interpretation register; then the gate is run again.

Who runs it: someone who did not write the contract (a fresh context), given only SPEC.md and the fixtures. If that is not possible, the Lead runs it and labels the result `SELF-REVIEW`.

Project: · Contract version: · Run by: · Fresh context or SELF-REVIEW: · Date:

## A. Every piece of text that comes in (titles, names, messages, file contents)

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| A1 | Length limit counted in what: bytes, code units, code points, or what a person sees as one character? | | |
| A2 | Is text normalized before it is counted, compared or stored (so "é" typed two ways is one thing)? Which form? | | |
| A3 | Encoding on disk and on the wire | | |
| A4 | Empty, and only spaces: allowed, trimmed, or refused? | | |
| A5 | Control characters, line breaks, null bytes: refused, removed or escaped? With which error? | | |
| A6 | Fixtures exist at the limit, one under and one over; plus one emoji case and one accented case | | |
| A7 | How the text is made safe on each surface it reaches: page, terminal, log, file name, message | | |

## B. Every number, date and id

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| B1 | Lowest and highest allowed; zero; negative; not a number | | |
| B2 | Ids: who makes them, are they reused after delete, what happens on a duplicate | | |
| B3 | Dates and times: format, time zone, who sets the clock | | |
| B4 | Rounding and units (percent or fraction, cents or dollars) | | |

## C. Every list and every output

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| C1 | Order of results: by what, and what breaks a tie | | |
| C2 | Empty result: what exactly is shown or returned | | |
| C3 | Exact shape of anything another program reads (output lines, JSON, files): fixed and written down | | |
| C4 | Limits: how many, how large, what happens past them | | |

## D. Every way it can fail

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| D1 | Every error has a name, an exit code or status, and the exact message; all in one table | | |
| D2 | Every invalid fixture names the error it must produce | | |
| D3 | Missing file, unreadable file, damaged file, wrong version | | |
| D4 | Unknown fields in stored data: kept, dropped or refused | | |
| D5 | Two errors at once: which one is reported | | |

## E. State, time and cleanup

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| E1 | Two writers at the same moment: who wins, is anything lost | | |
| E2 | Stopped halfway through a write: what is on disk afterwards | | |
| E3 | The same request sent twice: one result or two | | |
| E4 | What the system creates outside its data file (temp files, logs, caches) and who removes it | | |
| E5 | Outcome of an outside action unknown: check before retry | | |

## F. The surface is closed

| # | Question | Answer | Fixture or check |
|---|---|---|---|
| F1 | The contract lists every command, flag, route, screen action, setting, environment variable, output format and file written | | |
| F2 | It says that anything not on the list is not to be built | | |
| F3 | Every listed item has an acceptance criterion; every criterion has a check and a known-bad sample | | |
| F4 | Every seam has a check only the joined system can pass | | |

## G. Words that are not yet requirements

List every soft word in the request or the contract: smooth, safe, simple, fast, easy, clean, "when possible", "etc.", "and so on", "should". Each one becomes a check someone can run, or moves to non-goals. None stays as it is.

| Soft word and where | Turned into (criterion ID) or moved to non-goals |
|---|---|

## Ask or assume

For each OPEN:

| # | The gap | Would a different answer change what a user sees, what is stored, money, security, or something hard to undo? | So | The one answer | Fixture added | Register row |
|---|---|---|---|---|---|---|

- **Yes → ask.** Put all such questions to the person in one batch, each with the choices, the one you recommend and why. Wait.
- **No → assume.** The Lead picks, writes it in the interpretation register marked `ASSUMED BY LEAD`, and shows the list at approval so the person can overrule it.
- A builder never assumes on anything shared. It stops that part and reports.

## Result

`PASS` (no OPEN left) · `UNDERSPECIFIED` (list the lines). Asked: <count>. Assumed by Lead: <count>.

This gate shows the contract answers these questions. It does not show the list of questions is complete: when a build stalls on a gap the gate missed, add the question here (as a PROPOSED change).
