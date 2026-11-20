"""eyes: read and search the web and social platforms from the command line.

    eyes read <url>                      any page, PDF, YouTube/Bilibili video, GitHub repo/issue/file, Reddit thread, X post
    eyes read <url> --save sources/3.txt also save the text, for the researcher's citation check
    eyes search "<query>" --on reddit    web | reddit | x | youtube | bilibili | github | xhs
    eyes channels                        what each platform can do, and how
    eyes doctor [--live]                 is everything installed (and, with --live, reachable)?
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore", message="SOCKS support in urllib3")  # harmless notice from ddgs' HTTP stack

from . import __version__, router
from .core import Blocked, NotFound, Result

CHANNELS = [
    ("web", "read any page or PDF; search the web", "direct download + trafilatura; ddgs metasearch", "nothing"),
    ("youtube", "video info, description, transcript; search", "yt-dlp", "nothing"),
    ("bilibili", "video info, description, stats; search; subtitles when public", "Bilibili public web API", "nothing (subtitles mostly need a login: not supported)"),
    ("github", "repo: metadata, README, file list; issues and PRs with comments; files; search", "GitHub REST API", "nothing (uses GITHUB_TOKEN or a signed-in gh for higher limits, if present)"),
    ("reddit", "thread with comments; search one subreddit; site search", "Arctic Shift public archive; web search index", "nothing"),
    ("x", "a post (text, stats, quote, media); a profile; search", "FixTweet public API; web search index", "nothing (replies and timelines are not available)"),
    ("xhs", "search titles and snippets", "web search index", "nothing (note pages need a login: not supported)"),
]


def render(r: Result) -> str:
    out = []
    if r.title:
        out.append(f"# {r.title}")
    meta = [f"Source: {r.url}" if r.url else None, f"Author: {r.author}" if r.author else None,
            f"Published: {r.published or 'unknown'}" if r.url else None,
            f"Fetched: {r.fetched_at}", f"Channel: {r.channel} · Method: {r.method}"]
    out += [m for m in meta if m]
    for n in r.notes:
        out.append(f"Note: {n}")
    if r.items:
        out.append("")
        for i, it in enumerate(r.items, 1):
            bits = [x for x in (it.author and f"by {it.author}", it.published,
                                *(f"{k} {v}" for k, v in it.extra.items() if v not in (None, ""))) if x]
            out.append(f"{i}. {it.title}\n   {it.url}" + (f"\n   {' · '.join(map(str, bits))}" if bits else "")
                       + (f"\n   {it.snippet.strip()}" if it.snippet.strip() else ""))
    if r.text:
        out += ["", r.text]
    return "\n".join(out) + "\n"


def _print(s: str) -> None:
    sys.stdout.write(s)
    sys.stdout.flush()


def _emit(r: Result, args) -> None:
    text = json.dumps(r.to_dict(), ensure_ascii=False, indent=2) + "\n" if args.json else render(r)
    if getattr(args, "save", None):
        os.makedirs(os.path.dirname(os.path.abspath(args.save)), exist_ok=True)
        with open(args.save, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(render(r) if not args.json else text)
    _print(text)


def doctor(live: bool) -> int:
    ok = True
    print(f"proofline-eyes {__version__} on Python {sys.version.split()[0]}")
    for mod, why in [("trafilatura", "web page text"), ("yt_dlp", "YouTube"), ("ddgs", "web, X, Reddit and XHS search"), ("pypdf", "PDF text")]:
        try:
            __import__(mod)
            print(f"  ok      {mod:12} ({why})")
        except ImportError:
            ok = False
            print(f"  MISSING {mod:12} ({why}): pip install {mod.replace('_', '-')}")
    from . import github
    print(f"  info    github       {github.auth_mode()}")
    if live:
        probes = [
            ("web read", lambda: router.read("https://example.com")),
            ("web search", lambda: router.search("open source", on="web", n=2)),
            ("youtube", lambda: router.search("python tutorial", on="youtube", n=1)),
            ("bilibili", lambda: router.search("python", on="bilibili", n=1)),
            ("github", lambda: router.read("https://github.com/python/cpython")),
            ("reddit", lambda: router.search("python", on="reddit", n=1, sub="Python")),
            ("x", lambda: router.read("https://x.com/jack/status/20")),
        ]
        for name, fn in probes:
            try:
                r = fn()
                got = len(r.items) if r.items else len(r.text)
                print(f"  {'ok' if got else 'EMPTY':7} {name:12} {r.method}")
                ok &= bool(got)
            except Exception as e:  # noqa: BLE001 - doctor reports every failure
                ok = False
                print(f"  FAIL    {name:12} {type(e).__name__}: {e}")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):  # Windows consoles default to a legacy code page
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(prog="eyes", description="Read and search the web and social platforms. Free, no keys, no accounts.")
    p.add_argument("--version", action="version", version=f"proofline-eyes {__version__}")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("read", help="read a link (the right reader is picked from the URL)")
    r.add_argument("url")
    r.add_argument("--lang", help="transcript language, e.g. en or zh-Hans")
    r.add_argument("--raw", action="store_true", help="the page exactly as served, no extraction")
    r.add_argument("--json", action="store_true")
    r.add_argument("--save", metavar="FILE", help="also write the output to FILE (e.g. research/sources/3.txt)")
    s = sub.add_parser("search", help="search a platform")
    s.add_argument("query")
    s.add_argument("--on", default="web", help="web | reddit | x | youtube | bilibili | github | xhs (default web)")
    s.add_argument("-n", type=int, default=10, help="number of results (default 10)")
    s.add_argument("--sub", help="Reddit: search this subreddit's archive")
    s.add_argument("--kind", default="repositories", help="GitHub: repositories | issues")
    s.add_argument("--json", action="store_true")
    s.add_argument("--save", metavar="FILE")
    sub.add_parser("channels", help="what each platform can do")
    d = sub.add_parser("doctor", help="check the install")
    d.add_argument("--live", action="store_true", help="also make one small request to each platform")
    args = p.parse_args(argv)

    if args.cmd == "channels":
        for name, can, how, needs in CHANNELS:
            print(f"{name:9} {can}\n          via {how}; needs {needs}")
        return 0
    if args.cmd == "doctor":
        return doctor(args.live)
    try:
        res = router.read(args.url, lang=args.lang, raw=args.raw) if args.cmd == "read" else \
            router.search(args.query, on=args.on, n=args.n, sub=args.sub, kind=args.kind)
    except Blocked as e:
        print(f"BLOCKED: {e}", file=sys.stderr)
        return 3
    except NotFound as e:
        print(f"NOT FOUND: {e}", file=sys.stderr)
        return 4
    except (RuntimeError, ValueError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    _emit(res, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
