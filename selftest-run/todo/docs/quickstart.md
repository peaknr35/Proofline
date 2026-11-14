# Tasklet quickstart

A command-line to-do list in one JSON file, plus a read-only web page of the same list.
Everything below was run by QA on 2026-11-13 (Windows 11, Node 26.4.0). Nothing else is promised.

## You need
- Node 20 or newer (only 26.4.0 was actually run). No install step, no dependencies.
- Run every command from the project folder (the one holding `package.json`).

## 1. Check it works
```
npm test
```
Expected: `test files found: 6`, then `tests 182`, `pass 182`, `fail 0`.

## 2. Use it
Pick where your list lives and pass it with `--file` every time (or set the environment variable `TODO_FILE` once). Without either, the list is `./tasks.json` in the folder you are standing in.

```
node cli/todo.mjs add "Buy milk" --file my-tasks.json      -> Added #1: Buy milk
node cli/todo.mjs list --file my-tasks.json                -> [ ] #1 Buy milk
node cli/todo.mjs done 1 --file my-tasks.json              -> Done #1
node cli/todo.mjs list --json --file my-tasks.json         -> the tasks as JSON
node cli/todo.mjs remove 1 --file my-tasks.json            -> asks; type yes to remove, anything else prints Cancelled
node cli/todo.mjs remove 1 --yes --file my-tasks.json      -> Removed #1 (no question)
```

## 3. See it in the browser
```
node web/server.mjs --file my-tasks.json --port 4173
```
It prints `Tasklet web view: http://127.0.0.1:4173`. Open that address. The page is read-only and re-reads the file on every load, so after any command above just reload. `http://127.0.0.1:4173/api/tasks` gives the same list as JSON. Stop the server with Ctrl+C.

## When something goes wrong
| You see | Meaning | Your file |
|---|---|---|
| exit code 1 and a `Usage:` line | bad command, missing or non-numeric id, empty title, title over 200 characters | untouched |
| `No task #<id>` (exit 2) | no task has that id | untouched |
| `Cannot read <path>: <reason>` (exit 3) | the file is not valid; fix it by hand | never overwritten |
| `Cannot write <path>: write failed (...)` (exit 3) | folder missing or file read-only | untouched |
| page says `Cannot read tasks file` (HTTP 500) | same as exit 3; fix the file and reload | untouched |
| `Cannot start web view on 127.0.0.1:<port>: port already in use` | choose another `--port` | untouched |

## Known limits (observed)
- The folder for `--file` must already exist; the file itself is created by the first `add`.
- A title starting with `--` needs `--` first, and then put `--file` BEFORE the `--`: `node cli/todo.mjs add --file my-tasks.json -- --my title`. Anything after `--` becomes part of the title.
- Titles are printed as typed. Do not paste text with line breaks or terminal control characters into a title; `list` will print them raw.
- A hand-edited file with 101-200 emoji in one title shows on the web page but is refused by the command line (open decision R-1).
- A file saved with a byte-order mark is refused. Removed ids are never reused.
- On Windows do not use device names (`NUL`, `CON`) as the file name.
- In Git Bash, arguments containing `</...` can be rewritten by the shell before Tasklet sees them; use PowerShell or cmd for such titles.
- One person, one computer. The web page listens on 127.0.0.1 only. Not run on macOS, Linux, Node 20-25, or any phone.
- Each `npm test` run leaves about 81 small `tasklet-cli-*` / `tasklet-store-*` folders in the system temp folder; they are safe to delete.
