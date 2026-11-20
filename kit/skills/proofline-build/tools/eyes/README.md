# eyes

A command-line tool that lets a research agent read and search the parts of the internet a plain web search misses: YouTube and Bilibili videos (with transcripts), GitHub repositories and issues, Reddit threads, X posts, XiaoHongShu, and any web page or PDF. It is free: it uses open-source clients and public endpoints, with no paid APIs, keys or accounts, and no setup.

It was inspired by the idea behind [Agent-Reach](https://github.com/Panniantong/Agent-Reach): one command per platform, plus a `read <url>` that picks the right reader by itself. No code was taken from it. eyes differs on purpose in one way: it never signs in and never uses your browser's logins. A platform that needs an account is reported as a gap.

## Install

From the `proofline-build` skill folder (`kit/skills/proofline-build/` in the Proofline repository):

```bash
uv tool install -e tools/eyes
```

or `pip install -e tools/eyes`. Python 3.10 or newer. Then run `eyes doctor --live`.

## Use

```bash
eyes read https://www.youtube.com/watch?v=jNQXAC9IVRw          # info, description, transcript
eyes read https://github.com/owner/repo                        # metadata, README, file list
eyes read https://www.reddit.com/r/sub/comments/<id>/          # post and comments, best first
eyes read https://x.com/user/status/<id>                       # post text, stats, quote, media
eyes read https://example.com/paper.pdf --save sources/3.txt   # also save it for the citation check
eyes search "claude code subagents" --on reddit --sub ClaudeAI
eyes search "大模型 教程" --on bilibili
eyes channels                                                  # what each platform can do
```

Add `--json` to any command for structured output. Exit codes: 0 ok, 2 error, 3 `BLOCKED` (the site refused or needs a login), 4 `NOT FOUND`.

## What each platform gives you, and how

| Platform | Read | Search | Route (shown in every result) | Limits |
|---|---|---|---|---|
| Web and PDF | main text, title, author, date | yes | direct download, text extracted locally (trafilatura, pypdf); search via ddgs (several engines, no key) | pages built by JavaScript may come back thin |
| YouTube | info, description, transcript | yes | yt-dlp | automatic captions mis-hear names and numbers |
| Bilibili | info, description, stats | yes | Bilibili public web API; search falls back to a search index restricted to bilibili.com when Bilibili refuses the client | subtitles usually need a login: not available |
| GitHub | repo, README, file list, issues and PRs with comments, files | repos, issues | official REST API; uses `GITHUB_TOKEN` or a signed-in `gh` if present, else 60 requests an hour | first 100 comments, first 300 files |
| Reddit | thread with comments | one subreddit (titles), or site-wide via a search index | Arctic Shift, a free public Reddit archive (Reddit's own API refuses anonymous clients) | archive can lag; posts removed before archiving read `[removed]` |
| X (Twitter) | a post, a profile | via a search index restricted to x.com | FixTweet (api.fxtwitter.com), a free open-source reader of X's public embeds | no replies, timelines or live search |
| XiaoHongShu | not available | titles and snippets via a search index | search index | note pages need a login |

## Rules it follows

- **Honest identity.** Every request carries the User-Agent `proofline-eyes/<version>`, never a fake browser.
- **A refusal is an answer.** HTTP 401 or 403, a login wall or a bot check is reported as `BLOCKED`. eyes does not retry with a disguise, rotate addresses, solve CAPTCHAs or reuse your logins. The one retry is a single, polite wait after HTTP 429 (rate limit).
- **Provenance on every result.** `Source`, `Published`, `Fetched`, `Channel`, `Method` and `Note` lines tell the researcher where the text came from and what to be careful of, so it can grade the source.

## Tests

```bash
cd tools/eyes && uv run --with pytest -m pytest -q
```

The 29 offline tests cover routing, the link parsers, caption parsing, backend fallback, and the rules above: a 401, 403 or 404 is never retried, and the User-Agent never claims to be a browser. `eyes doctor --live` makes one small real request to each platform.
