# Glossary

Exact meanings, taken from `SPEC.md`.

| Word | Means exactly | Not to be confused with |
|---|---|---|
| task | one object in the `tasks` array: `id`, `title`, `done`, `created` | a unit of build work |
| done | the boolean field `done` on a task; `true` means finished | `completed`, `status`, `checked` (none of these exist) |
| open | a task with `done: false` | a file being open |
| data file | the one JSON file of section 6; default `./tasks.json` | a fixture |
| nextId | the id the next added task will get; only grows; ids are never reused | the count of tasks |
| fixture | an example data file in `contract/fixtures/` with a verdict in `expected.json` | a test's own temp file |
| valid | passes every rule in SPEC section 6 | "parses as JSON" |
| seam | the data file, the only place the two parts meet | an API between the parts (there is none) |
