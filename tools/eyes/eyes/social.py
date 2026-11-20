"""Reddit, X (Twitter) and XiaoHongShu, without accounts or paid APIs.

Each route is named in the result's `method`, because each has limits the researcher must grade:
- Reddit's own API refuses anonymous clients, so posts and comments come from Arctic Shift, a free
  public Reddit archive. It can lag behind Reddit, and posts removed before archiving read "[removed]".
- Single X posts and profiles come from FixTweet (api.fxtwitter.com), a free open-source service
  that reads X's public embeds. X offers no free search, so search goes through a web search index
  restricted to x.com: it is incomplete and not live.
- XiaoHongShu shows note pages only to signed-in users, so only search-index results are available.
"""
from __future__ import annotations

import re

from . import web
from .core import Blocked, Item, NotFound, Result, fetch_json, ts_iso

# ---------- Reddit ----------

ARCTIC = "https://arctic-shift.photon-reddit.com/api"
REDDIT_POST = re.compile(r"reddit\.com/r/([^/]+)/comments/([a-z0-9]+)", re.I)
REDDIT_SHORT = re.compile(r"redd\.it/([a-z0-9]+)", re.I)
ARCTIC_NOTE = "via the Arctic Shift public Reddit archive: may lag Reddit by hours, and removed posts read [removed]"


def _arctic(path: str, **params):
    data = fetch_json(f"{ARCTIC}{path}", params=params)
    if isinstance(data, dict) and data.get("error"):
        raise RuntimeError(f"Arctic Shift: {data['error']}")
    return data.get("data") or []


def reddit_post_id(url: str) -> str:
    m = REDDIT_POST.search(url) or REDDIT_SHORT.search(url)
    if not m:
        raise NotFound("not a Reddit post link (reddit.com/r/<sub>/comments/<id>/...)")
    return m.groups()[-1]


def read_reddit(url: str, max_comments: int = 100) -> Result:
    pid = reddit_post_id(url)
    posts = _arctic("/posts/ids", ids=pid)
    if not posts:
        raise NotFound(f"Reddit post {pid} is not in the Arctic Shift archive (yet)")
    p = posts[0]
    comments = _arctic("/comments/search", link_id=pid, limit=str(min(max_comments, 100)),
                       fields="id,author,body,score,created_utc,parent_id")
    comments.sort(key=lambda c: c.get("score") or 0, reverse=True)
    parts = [f"r/{p.get('subreddit')} · u/{p.get('author')} · score {p.get('score')} · {p.get('num_comments')} comments · {ts_iso(p.get('created_utc'))}",
             p.get("url") if p.get("url") and "reddit.com" not in (p.get("url") or "") else "",
             "", p.get("selftext") or "(link post, no text)", "", f"## Comments ({len(comments)} shown, highest score first)"]
    for c in comments:
        reply = "" if str(c.get("parent_id", "")).startswith("t3_") else " (reply)"
        parts += ["", f"u/{c.get('author')} · score {c.get('score')} · {ts_iso(c.get('created_utc'))}{reply}", c.get("body") or ""]
    notes = [ARCTIC_NOTE]
    if (p.get("num_comments") or 0) > len(comments):
        notes.append(f"{p.get('num_comments')} comments on Reddit; {len(comments)} returned")
    return Result(channel="reddit", method="Arctic Shift public Reddit archive (free, no login)",
                  url=f"https://www.reddit.com/r/{p.get('subreddit')}/comments/{pid}/", title=p.get("title"),
                  author=p.get("author"), published=ts_iso(p.get("created_utc")), text="\n".join(parts), notes=notes)


def search_reddit(query: str, n: int = 10, subreddit: str | None = None) -> Result:
    if subreddit:
        posts = _arctic("/posts/search", subreddit=subreddit.removeprefix("r/"), title=query, limit=str(n),
                        fields="id,title,author,subreddit,score,num_comments,created_utc,selftext")
        items = [Item(title=p.get("title", ""), url=f"https://www.reddit.com/r/{p.get('subreddit')}/comments/{p.get('id')}/",
                      snippet=(p.get("selftext") or "")[:300], author=p.get("author"), published=ts_iso(p.get("created_utc")),
                      extra={"score": p.get("score"), "comments": p.get("num_comments")}) for p in posts]
        return Result(channel="reddit", method="Arctic Shift archive search (free, no login)", title=f"r/{subreddit}: {query}",
                      items=items, notes=[ARCTIC_NOTE, "matches words in post titles (the archive's full-text search is too slow to use); newest first"])
    r = web.search_web(query, n=n, site="reddit.com")
    r.channel, r.method = "reddit", "web search index restricted to reddit.com (Reddit has no free anonymous search); pass --sub to search one subreddit's archive"
    hits = [i for i in r.items if "reddit.com" in i.url]
    r.items = sorted(hits, key=lambda i: not REDDIT_POST.search(i.url))  # threads before subreddit pages
    return r


# ---------- X / Twitter ----------

FX = "https://api.fxtwitter.com"
TWEET = re.compile(r"(?:twitter\.com|x\.com|fxtwitter\.com|vxtwitter\.com)/([A-Za-z0-9_]{1,15})/status(?:es)?/(\d+)")
PROFILE = re.compile(r"(?:twitter\.com|x\.com)/([A-Za-z0-9_]{1,15})/?(?:$|\?)")
FX_NOTE = "via FixTweet (api.fxtwitter.com), a free open-source reader of X's public embeds"


def read_x(url: str) -> Result:
    m = TWEET.search(url)
    if m:
        user, sid = m.groups()
        data = fetch_json(f"{FX}/{user}/status/{sid}")
        if data.get("code") != 200:
            raise NotFound(f"FixTweet: {data.get('message')} (post deleted, private or age-restricted?)")
        t = data["tweet"]
        a = t.get("author", {})
        parts = [f"@{a.get('screen_name')} ({a.get('name')}) · {t.get('created_at')}",
                 f"Likes {t.get('likes')} · Reposts {t.get('retweets')} · Replies {t.get('replies')} · Views {t.get('views')}",
                 "", t.get("text") or ""]
        if t.get("quote"):
            q = t["quote"]
            parts += ["", f"Quoting @{q.get('author', {}).get('screen_name')}: {q.get('text')}", q.get("url", "")]
        if t.get("replying_to"):
            parts.insert(1, f"Replying to @{t.get('replying_to')}")
        media = (t.get("media") or {}).get("all") or []
        if media:
            parts += ["", "Media: " + ", ".join(m.get("url", "") for m in media)]
        return Result(channel="x", method="FixTweet public API (free, open source, no login)", url=t.get("url"),
                      title=f"Post by @{a.get('screen_name')}", author=a.get("screen_name"),
                      published=ts_iso(t.get("created_timestamp")), text="\n".join(parts),
                      notes=[FX_NOTE, "replies to this post are not available without an X account"])
    m = PROFILE.search(url)
    if m and m[1].lower() not in {"home", "search", "explore", "i", "settings"}:
        data = fetch_json(f"{FX}/{m[1]}")
        if data.get("code") != 200:
            raise NotFound(f"FixTweet: {data.get('message')}")
        u = data["user"]
        text = "\n".join([f"@{u.get('screen_name')} ({u.get('name')})", u.get("description") or "",
                          f"Followers {u.get('followers')} · Following {u.get('following')} · Posts {u.get('tweets')} · Joined {u.get('joined')}",
                          f"Location: {u.get('location') or '-'} · Website: {(u.get('website') or {}).get('url') or '-'}"])
        return Result(channel="x", method="FixTweet public API (free, open source, no login)", url=u.get("url"),
                      title=f"Profile @{u.get('screen_name')}", author=u.get("screen_name"), text=text,
                      notes=[FX_NOTE, "a user's timeline is not available without an X account; search for their posts instead"])
    raise NotFound("not an X post or profile link")


def search_x(query: str, n: int = 10) -> Result:
    r = web.search_web(query, n=n * 2, site="x.com")
    r.channel = "x"
    r.method = "web search index restricted to x.com (X has no free search API)"
    r.items = [i for i in r.items if TWEET.search(i.url) or PROFILE.search(i.url)][:n]
    r.notes = ["incomplete and not live: only posts a search engine has indexed", "read a hit with `eyes read <url>` for its exact text"]
    return r


# ---------- XiaoHongShu ----------

def read_xhs(url: str) -> Result:
    raise Blocked("XiaoHongShu shows note pages only to signed-in users; eyes does not sign in or get around the login. "
                  "Use `eyes search --on xhs` for indexed titles and snippets, and treat them as leads.")


def search_xhs(query: str, n: int = 10) -> Result:
    r = web.search_web(query, n=n, site="xiaohongshu.com")
    r.channel, r.method = "xhs", "web search index restricted to xiaohongshu.com (no free XiaoHongShu API)"
    r.items = [i for i in r.items if "xiaohongshu.com" in i.url or "xhslink.com" in i.url]
    r.notes = ["titles and snippets only: note pages need a XiaoHongShu login", "very incomplete; Chinese queries find more"]
    return r
