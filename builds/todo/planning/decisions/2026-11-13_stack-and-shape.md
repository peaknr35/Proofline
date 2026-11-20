---
status: approved
date: 2026-11-13
decided_by: the owner (approved with SPEC 1.0)
---

# Node built-ins only; the two parts meet only at the data file

## Context
The project is a small CLI plus a read-only page. Node 26 is installed here. The Python on this machine belongs to another tool's environment.

## Options considered
| Option | For | Against |
|---|---|---|
| Node, no dependencies | built-in test runner, HTTP server and fetch; nothing to install | none found for this size |
| Python standard library | also dependency-free | the available interpreter is another tool's venv |
| Web part imports the CLI's store | less code | hides the seam; two builders could not work apart |

## Decision
Node built-ins only. The web part has its own reader written to SPEC section 6, so the file format is a real, tested seam.

## Consequences
The validation rules exist twice. The golden fixtures and AC-05, AC-08, AC-09 keep the two copies in agreement.

## Revisit when
A third part needs to read the file, or the format changes.
