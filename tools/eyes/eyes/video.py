"""YouTube and Bilibili: metadata, search and transcripts (subtitles)."""
from __future__ import annotations

import json
import re

from .core import Blocked, Item, NotFound, Result, fetch_json, fetch_text, ts_iso

PREFERRED = ["en", "en-US", "en-GB", "zh-Hans", "zh-CN", "zh", "zh-Hant"]


def _ydl(opts: dict | None = None):
    try:
        import yt_dlp
    except ImportError:
        raise RuntimeError("video channels need the 'yt-dlp' package: pip install yt-dlp") from None
    base = {"quiet": True, "no_warnings": True, "skip_download": True, "noprogress": True}
    base.update(opts or {})
    return yt_dlp.YoutubeDL(base)


def _clock(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600:d}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60:02d}:{s % 60:02d}"


def parse_json3(data: dict) -> str:
    """YouTube's json3 caption format -> '[mm:ss] text' lines."""
    lines = []
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs:
            continue
        text = "".join(s.get("utf8", "") for s in segs).replace("\n", " ").strip()
        if text:
            lines.append(f"[{_clock(ev.get('tStartMs', 0) / 1000)}] {text}")
    return "\n".join(lines)


def parse_vtt(vtt: str) -> str:
    out, last = [], None
    for block in re.split(r"\n\s*\n", vtt):
        m = re.search(r"(\d+):(\d{2}):(\d{2})[.,]\d+\s*-->|(\d{2}):(\d{2})[.,]\d+\s*-->", block)
        if not m:
            continue
        secs = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) if m[1] else int(m[4]) * 60 + int(m[5])
        body = " ".join(l for l in block.splitlines()[1:] if "-->" not in l)
        body = re.sub(r"<[^>]+>", "", body).strip()
        if body and body != last:
            out.append(f"[{_clock(secs)}] {body}")
            last = body
    return "\n".join(out)


def _pick_track(tracks: dict, lang: str | None, original: str | None):
    order = ([lang] if lang else []) + ([original] if original else []) + PREFERRED + list(tracks)
    for code in order:
        for key in (code, f"{code}-orig"):
            if key in tracks:
                return key, tracks[key]
    return None, None


def read_youtube(url: str, lang: str | None = None) -> Result:
    with _ydl() as y:
        info = y.extract_info(url, download=False)
    notes = []
    manual, auto = info.get("subtitles") or {}, info.get("automatic_captions") or {}
    code, formats = _pick_track(manual, lang, info.get("language"))
    kind = "uploaded subtitles"
    if not formats:
        code, formats = _pick_track(auto, lang, info.get("language"))
        kind = "automatic captions (speech recognition by YouTube; expect errors in names and numbers)"
    transcript = ""
    if formats:
        by_ext = {f.get("ext"): f for f in formats}
        f = by_ext.get("json3") or by_ext.get("vtt")
        if f:
            raw, _ = fetch_text(f["url"])
            transcript = parse_json3(json.loads(raw)) if f.get("ext") == "json3" else parse_vtt(raw)
        notes.append(f"transcript: {kind}, language {code}")
    else:
        notes.append("this video has no subtitles or automatic captions; only the description is available")
    up = info.get("upload_date")
    head = [f"Channel: {info.get('channel') or info.get('uploader')}",
            f"Duration: {_clock(info.get('duration') or 0)} · Views: {info.get('view_count')}",
            "", "Description:", (info.get("description") or "").strip()]
    text = "\n".join(head) + ("\n\nTranscript:\n" + transcript if transcript else "")
    return Result(channel="youtube", method="yt-dlp (open source) reading YouTube's public player data", url=info.get("webpage_url", url),
                  title=info.get("title"), author=info.get("channel") or info.get("uploader"),
                  published=f"{up[:4]}-{up[4:6]}-{up[6:]}" if up else None, text=text, notes=notes)


def search_youtube(query: str, n: int = 10) -> Result:
    with _ydl({"extract_flat": True}) as y:
        info = y.extract_info(f"ytsearch{n}:{query}", download=False)
    items = [Item(title=e.get("title", ""), url=e.get("url") or f"https://www.youtube.com/watch?v={e.get('id')}",
                  author=e.get("channel") or e.get("uploader"),
                  extra={"duration": e.get("duration"), "views": e.get("view_count")}) for e in info.get("entries", [])]
    return Result(channel="youtube", method="yt-dlp YouTube search (open source)", title=query, items=items)


# ---------- Bilibili ----------

BV = re.compile(r"(BV[0-9A-Za-z]{10})")
API = "https://api.bilibili.com"


def read_bilibili(url: str) -> Result:
    m = BV.search(url)
    if not m:
        raise NotFound("no BV id in this Bilibili link (short b23.tv links: open them once and pass the full URL)")
    bvid = m[1]
    try:
        data = fetch_json(f"{API}/x/web-interface/view", params={"bvid": bvid}, headers={"Referer": "https://www.bilibili.com"})
    except RuntimeError as e:
        raise Blocked(f"Bilibili refused this client ({e})") from None
    if data.get("code") != 0:
        if data.get("code") in (-352, -412):
            raise Blocked(f"Bilibili risk control refused the request (code {data.get('code')})")
        raise NotFound(f"Bilibili says: {data.get('message')} (code {data.get('code')})")
    d = data["data"]
    notes, transcript = [], ""
    subs = (d.get("subtitle") or {}).get("list") or []
    if subs:
        sub = next((s for s in subs if s.get("lan", "").startswith("zh")), subs[0])
        surl = sub.get("subtitle_url", "")
        if surl:
            body = fetch_json("https:" + surl if surl.startswith("//") else surl)
            transcript = "\n".join(f"[{_clock(x.get('from', 0))}] {x.get('content', '')}" for x in body.get("body", []))
            notes.append(f"transcript: Bilibili subtitles, {sub.get('lan_doc') or sub.get('lan')}")
    else:
        notes.append("no subtitles returned: Bilibili usually shows subtitles only to logged-in users; description and stats only")
    st = d.get("stat", {})
    text = "\n".join([f"UP: {d.get('owner', {}).get('name')}",
                      f"Views: {st.get('view')} · Likes: {st.get('like')} · Coins: {st.get('coin')} · Favourites: {st.get('favorite')} · Comments: {st.get('reply')}",
                      f"Duration: {_clock(d.get('duration') or 0)}", "", "Description:", (d.get("desc") or "").strip()])
    if transcript:
        text += "\n\nTranscript:\n" + transcript
    return Result(channel="bilibili", method="Bilibili public web API (no login)", url=f"https://www.bilibili.com/video/{bvid}",
                  title=d.get("title"), author=d.get("owner", {}).get("name"), published=ts_iso(d.get("pubdate")), text=text, notes=notes)


def _bili_index_search(query: str, n: int, why: str) -> Result:
    from . import web
    r = web.search_web(query, n=n, site="bilibili.com")
    r.channel, r.method = "bilibili", "web search index restricted to bilibili.com"
    r.items = [i for i in r.items if "bilibili.com" in i.url]
    r.notes = [f"Bilibili's own search {why}, so these are search-engine results: incomplete and not live",
               "read a hit with `eyes read <url>` for its details"]
    return r


def search_bilibili(query: str, n: int = 10) -> Result:
    try:
        data = fetch_json(f"{API}/x/web-interface/search/type", params={"search_type": "video", "keyword": query},
                          headers={"Referer": "https://www.bilibili.com"})
    except (Blocked, RuntimeError):
        return _bili_index_search(query, n, "refused this client")
    if not isinstance(data, dict) or data.get("code") != 0:
        return _bili_index_search(query, n, f"refused this client (code {data.get('code') if isinstance(data, dict) else '?'})")
    items = []
    for r in (data.get("data", {}).get("result") or [])[:n]:
        title = re.sub(r"<[^>]+>", "", r.get("title", ""))
        items.append(Item(title=title, url=f"https://www.bilibili.com/video/{r.get('bvid')}", author=r.get("author"),
                          snippet=(r.get("description") or "")[:300], published=ts_iso(r.get("pubdate")),
                          extra={"views": r.get("play"), "duration": r.get("duration")}))
    return Result(channel="bilibili", method="Bilibili public search API (no login)", title=query, items=items)
