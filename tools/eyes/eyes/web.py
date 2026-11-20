"""Web pages, PDFs and keyless web search."""
from __future__ import annotations

import io
import re

from .core import Blocked, Item, Result, fetch, fetch_text

BACKENDS = ["auto", "bing", "yahoo", "duckduckgo", "google"]
LOGIN_WALL = re.compile(r"(captcha|verify you are human|are you a robot|cf-challenge|sign in to continue|log in to continue|登录后查看|请登录)", re.I)


def _pdf_text(body: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(body))
    return "\n\n".join((p.extract_text() or "") for p in reader.pages)


def _strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|noscript|svg).*?</\1>", " ", html)
    html = re.sub(r"(?s)<[^>]+>", " ", html)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n\n", html)).strip()


def read_page(url: str) -> Result:
    body, headers = fetch(url)
    ctype = headers.get("content-type", "")
    if "pdf" in ctype or body[:5] == b"%PDF-":
        text = _pdf_text(body)
        return Result(channel="web", method="direct download, PDF text extracted locally (pypdf)", url=url, text=text,
                      notes=[] if text.strip() else ["PDF has no extractable text (scanned image?)"])
    html = body.decode("utf-8", "replace")
    title = author = date = None
    text = None
    try:
        import trafilatura
        text = trafilatura.extract(html, url=url, include_comments=False, include_tables=True, favor_recall=True)
        meta = trafilatura.extract_metadata(html, default_url=url)
        if meta:
            title, author, date = meta.title, meta.author, meta.date
    except ImportError:
        pass
    notes = []
    if not text:
        text = _strip_tags(html)
        notes.append("main-text extraction found nothing; this is all visible page text")
    if len(text) < 600 and LOGIN_WALL.search(html):
        raise Blocked(f"{url} shows a login wall or bot check instead of content")
    if len(text) < 200:
        notes.append("very little text: the page may build its content with JavaScript")
    return Result(channel="web", method="direct download, main text extracted locally (trafilatura)",
                  url=url, title=title, author=author, published=date, text=text, notes=notes)


def raw_page(url: str) -> Result:
    """The page exactly as served, for saving as a source the citation checker compares against."""
    text, headers = fetch_text(url)
    return Result(channel="web", method="direct download, raw (unprocessed)", url=url, text=text)


def search_web(query: str, n: int = 10, site: str | None = None) -> Result:
    q = f"{query} site:{site}" if site else query
    try:
        from ddgs import DDGS
    except ImportError:
        raise RuntimeError("web search needs the 'ddgs' package: pip install ddgs") from None
    hits, used, errors = [], None, []
    for backend in BACKENDS:  # single engines fail or rate-limit often; try the next one
        try:
            hits = DDGS().text(q, max_results=n, backend=backend) or []
        except Exception as e:  # ddgs raises its own exception type when a backend comes back empty
            errors.append(f"{backend}: {e}")
            continue
        if hits:
            used = backend
            break
    items = [Item(title=h.get("title", ""), url=h.get("href", ""), snippet=h.get("body", "")) for h in hits]
    notes = ["search snippets are leads, not evidence: read the page before citing it"]
    if not items:
        notes.append("no results from any backend (" + "; ".join(errors)[:300] + ")")
    return Result(channel="web-search", method=f"ddgs metasearch, backend {used or 'none'} (no key)", title=q, items=items, notes=notes)
