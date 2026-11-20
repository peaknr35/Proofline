"""Shared pieces: the result record every channel returns, polite HTTP, and errors.

Ground rules every channel follows:
- Identify honestly. One fixed User-Agent naming this tool; never a fake browser.
- A refusal is an answer. 401/403, a login wall or a CAPTCHA is reported as BLOCKED with the
  reason. Nothing here retries with a disguise, rotates IPs or solves challenges.
- Say how the text was obtained. `method` names the route (official API, public archive,
  third-party mirror, search index) so the researcher can grade the source.
"""
from __future__ import annotations

import gzip
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

from . import __version__

USER_AGENT = f"proofline-eyes/{__version__} (+research CLI; open source)"
TIMEOUT = 30


class Blocked(Exception):
    """The site refused us (login wall, 401/403, CAPTCHA). Not retried."""


class NotFound(Exception):
    """The thing asked for does not exist or has no content of that kind."""


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ts_iso(epoch: float | int | None) -> str | None:
    if epoch in (None, ""):
        return None
    return datetime.fromtimestamp(float(epoch), timezone.utc).replace(microsecond=0).isoformat()


@dataclass
class Item:
    """One search hit."""
    title: str
    url: str
    snippet: str = ""
    author: str | None = None
    published: str | None = None
    extra: dict = field(default_factory=dict)


@dataclass
class Result:
    channel: str
    method: str                     # how it was obtained, e.g. "GitHub REST API (official)"
    url: str | None = None
    title: str | None = None
    author: str | None = None
    published: str | None = None
    text: str = ""                  # the content itself, as received (for quoting and saving)
    items: list[Item] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)   # limits the reader must know about
    fetched_at: str = field(default_factory=now_iso)

    def to_dict(self) -> dict:
        return asdict(self)


def _decode(body: bytes, encoding: str | None) -> bytes:
    if encoding == "gzip":
        return gzip.decompress(body)
    if encoding == "deflate":
        return zlib.decompress(body)
    return body


def fetch(url: str, *, params: dict | None = None, headers: dict | None = None,
          retries_on_429: int = 1) -> tuple[bytes, dict]:
    """GET a URL politely. Returns (body, headers). Raises Blocked / NotFound / RuntimeError."""
    if params:
        url = f"{url}{'&' if '?' in url else '?'}{urllib.parse.urlencode(params)}"
    h = {"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"}
    h.update(headers or {})
    req = urllib.request.Request(url, headers=h)
    for attempt in range(retries_on_429 + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                body = _decode(r.read(), r.headers.get("Content-Encoding"))
                return body, {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries_on_429:
                time.sleep(min(int(e.headers.get("Retry-After", "5") or 5), 30))
                continue
            if e.code in (401, 403, 451):
                raise Blocked(f"{url} answered HTTP {e.code}; it does not serve this content without a login or to automated clients") from None
            if e.code == 404:
                raise NotFound(f"{url} answered HTTP 404") from None
            if e.code == 429:
                raise RuntimeError(f"{url} is rate-limiting us (HTTP 429); try again later") from None
            detail = e.read()[:300].decode("utf-8", "replace").strip()
            raise RuntimeError(f"{url} answered HTTP {e.code}" + (f": {detail}" if detail else "")) from None
        except urllib.error.URLError as e:
            raise RuntimeError(f"could not reach {url}: {e.reason}") from None
    raise RuntimeError("unreachable")


def fetch_json(url: str, **kw) -> dict | list:
    body, _ = fetch(url, **kw)
    try:
        return json.loads(body.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        raise RuntimeError(f"{url} did not return JSON") from None


def fetch_text(url: str, **kw) -> tuple[str, dict]:
    body, headers = fetch(url, **kw)
    ctype = headers.get("content-type", "")
    charset = "utf-8"
    if "charset=" in ctype:
        charset = ctype.split("charset=")[-1].split(";")[0].strip() or "utf-8"
    try:
        return body.decode(charset, "replace"), headers
    except LookupError:
        return body.decode("utf-8", "replace"), headers
