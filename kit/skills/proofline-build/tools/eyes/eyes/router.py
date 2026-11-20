"""Pick the right reader for a link, and the right searcher for a platform."""
from __future__ import annotations

import re
from urllib.parse import urlparse

from . import github, social, video, web

ROUTES = [
    ("youtube", re.compile(r"(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$")),
    ("bilibili", re.compile(r"(^|\.)(bilibili\.com|b23\.tv)$")),
    ("github", re.compile(r"^(www\.)?github\.com$")),
    ("reddit", re.compile(r"(^|\.)(reddit\.com|redd\.it)$")),
    ("x", re.compile(r"(^|\.)(x\.com|twitter\.com|fxtwitter\.com|vxtwitter\.com)$")),
    ("xhs", re.compile(r"(^|\.)(xiaohongshu\.com|xhslink\.com)$")),
]


def channel_for(url: str) -> str:
    host = (urlparse(url if "://" in url else f"https://{url}").hostname or "").lower()
    for name, pat in ROUTES:
        if pat.search(host):
            # A Reddit or X link that is not a post or profile is just a web page.
            if name == "reddit" and not (social.REDDIT_POST.search(url) or social.REDDIT_SHORT.search(url)):
                return "web"
            return name
    return "web"


def read(url: str, *, lang: str | None = None, raw: bool = False):
    if "://" not in url:
        url = "https://" + url
    if raw:
        return web.raw_page(url)
    ch = channel_for(url)
    return {
        "youtube": lambda: video.read_youtube(url, lang=lang),
        "bilibili": lambda: video.read_bilibili(url),
        "github": lambda: github.read(url),
        "reddit": lambda: social.read_reddit(url),
        "x": lambda: social.read_x(url),
        "xhs": lambda: social.read_xhs(url),
        "web": lambda: web.read_page(url),
    }[ch]()


SEARCHERS = {
    "web": lambda q, n, o: web.search_web(q, n=n),
    "reddit": lambda q, n, o: social.search_reddit(q, n=n, subreddit=o.get("sub")),
    "x": lambda q, n, o: social.search_x(q, n=n),
    "youtube": lambda q, n, o: video.search_youtube(q, n=n),
    "bilibili": lambda q, n, o: video.search_bilibili(q, n=n),
    "github": lambda q, n, o: github.search(q, n=n, kind=o.get("kind", "repositories")),
    "xhs": lambda q, n, o: social.search_xhs(q, n=n),
}
ALIASES = {"twitter": "x", "xiaohongshu": "xhs", "rednote": "xhs", "yt": "youtube", "bili": "bilibili", "gh": "github"}


def search(query: str, on: str = "web", n: int = 10, **opts):
    on = ALIASES.get(on, on)
    if on not in SEARCHERS:
        raise ValueError(f"unknown platform {on!r}; choose from {', '.join(SEARCHERS)}")
    return SEARCHERS[on](query, n, opts)
