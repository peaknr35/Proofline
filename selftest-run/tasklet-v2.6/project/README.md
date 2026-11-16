# todo

A small to-do list for one person on one computer. Tasks live in one JSON file. A read-only web page shows the list.

## Requirements
Node 26 or later. Nothing to install: no dependencies, no network.

## Run it
From this folder:

```
node bin/todo.mjs add buy milk        # Added 1: buy milk
node bin/todo.mjs list                # 1. [ ] buy milk
node bin/todo.mjs done 1              # Done 1: buy milk
node bin/todo.mjs remove 1            # Removed 1: buy milk  (no prompt; cannot be undone)
node bin/todo.mjs serve               # page at http://127.0.0.1:7070/ ; Ctrl+C stops it
node bin/todo.mjs serve --port 8080   # another port
node bin/todo.mjs help
```

To type `todo` instead of `node bin/todo.mjs`, run `npm link` in this folder once. It changes your global npm folder; it was not run during the build.

## Where the tasks are kept
`todo.json` in your home folder. Set `TODO_FILE` to use another file, for example (PowerShell) `$env:TODO_FILE = "D:\lists\work.json"`.

- Task numbers never change and are never reused.
- A damaged task file, or one written by a newer version, is refused and left untouched. Fix it or move it, then try again.
- The page is read-only. It shows the file as it is when you load the page, so reload it to see changes. It answers only on this computer (127.0.0.1).

## Limits
- If the task file is a symbolic link, saving replaces the link with a regular file.
- Saving does not keep the old file's permissions. A read-only task file is refused on Windows.
- Two `todo` commands saving at the same moment: the last one wins. Both may print "Added", but only one task is kept.
- No editing of task text, undo, reopening, due dates, tags, colours or `--json` output (the full list is in `SPEC.md` section 1).

## Test it
`npm test`: 250 tests (observed 2026-11-15: 250 pass, 0 fail).

## More
- What exactly it does: `SPEC.md` (the approved contract) and `_shared/product-facts.md` (what is verified).
- Working on it: start at `AGENTS.md`.
