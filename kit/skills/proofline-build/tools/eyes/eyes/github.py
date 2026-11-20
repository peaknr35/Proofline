"""GitHub through its official REST API.

No setup needed: without a token GitHub allows 60 requests an hour. If GITHUB_TOKEN is set, or
the GitHub CLI is already signed in (`gh auth token`), that token is used for higher limits.
The token is sent only to api.github.com and never printed.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from functools import lru_cache

from .core import Item, NotFound, Result, fetch_json, fetch_text

API = "https://api.github.com"
URL = re.compile(r"github\.com/([^/\s]+)/([^/\s#?]+)(?:/(issues|pull|blob|tree|discussions)/([^\s#?]+))?")


@lru_cache(maxsize=1)
def _token() -> str | None:
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        return tok
    gh = shutil.which("gh")
    if gh:
        try:
            out = subprocess.run([gh, "auth", "token"], capture_output=True, text=True, timeout=10)
            if out.returncode == 0 and out.stdout.strip():
                return out.stdout.strip()
        except (OSError, subprocess.SubprocessError):
            pass
    return None


def _headers(accept: str = "application/vnd.github+json") -> dict:
    h = {"Accept": accept, "X-GitHub-Api-Version": "2022-11-28"}
    if _token():
        h["Authorization"] = f"Bearer {_token()}"
    return h


def _api(path: str, **params):
    return fetch_json(f"{API}{path}", params=params or None, headers=_headers())


def auth_mode() -> str:
    return "signed in (token from GITHUB_TOKEN or gh)" if _token() else "anonymous, 60 requests an hour"


def parse(url: str):
    m = URL.search(url)
    if not m:
        raise NotFound("not a github.com/<owner>/<repo> link")
    owner, repo, kind, rest = m.groups()
    return owner, repo.removesuffix(".git"), kind, rest


def read(url: str) -> Result:
    owner, repo, kind, rest = parse(url)
    if kind in ("issues", "pull"):
        return _issue(owner, repo, rest.split("/")[0])
    if kind == "blob":
        ref, _, path = rest.partition("/")
        raw, _ = fetch_text(f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}")
        return Result(channel="github", method="raw.githubusercontent.com (official raw file)", url=url, title=f"{owner}/{repo}: {path}@{ref}", text=raw)
    return _repo(owner, repo)


def _repo(owner: str, repo: str) -> Result:
    meta = _api(f"/repos/{owner}/{repo}")
    branch = meta.get("default_branch", "main")
    try:
        readme, _ = fetch_text(f"{API}/repos/{owner}/{repo}/readme", headers=_headers("application/vnd.github.raw"))
    except NotFound:
        readme = "(no README)"
    notes = []
    try:
        tree = _api(f"/repos/{owner}/{repo}/git/trees/{branch}", recursive="1")
        paths = [t["path"] for t in tree.get("tree", []) if t.get("type") == "blob"]
        if tree.get("truncated") or len(paths) > 300:
            notes.append(f"file list cut to 300 of {len(paths)}{'+' if tree.get('truncated') else ''} files")
        listing = "\n".join(paths[:300])
    except (NotFound, RuntimeError) as e:
        listing = f"(file list unavailable: {e})"
    lic = (meta.get("license") or {}).get("spdx_id")
    head = [f"Description: {meta.get('description')}",
            f"Stars: {meta.get('stargazers_count')} · Forks: {meta.get('forks_count')} · Open issues: {meta.get('open_issues_count')} · License: {lic}",
            f"Language: {meta.get('language')} · Default branch: {branch} · Last push: {meta.get('pushed_at')} · Archived: {meta.get('archived')}",
            f"Topics: {', '.join(meta.get('topics') or []) or '-'}"]
    text = "\n".join(head) + "\n\n## README\n\n" + readme + "\n\n## Files\n\n" + listing
    return Result(channel="github", method=f"GitHub REST API (official, {auth_mode()})", url=meta.get("html_url"),
                  title=meta.get("full_name"), author=owner, published=meta.get("created_at"), text=text, notes=notes)


def _issue(owner: str, repo: str, number: str) -> Result:
    it = _api(f"/repos/{owner}/{repo}/issues/{number}")
    comments = _api(f"/repos/{owner}/{repo}/issues/{number}/comments", per_page="100")
    kind = "Pull request" if it.get("pull_request") else "Issue"
    parts = [f"{kind} #{number} · state: {it.get('state')} · by {it.get('user', {}).get('login')} · {it.get('created_at')}",
             "", it.get("body") or "(no description)"]
    for c in comments:
        parts += ["", f"--- {c.get('user', {}).get('login')} · {c.get('created_at')}", c.get("body") or ""]
    notes = ["only the first 100 comments"] if len(comments) >= 100 else []
    return Result(channel="github", method=f"GitHub REST API (official, {auth_mode()})", url=it.get("html_url"), title=it.get("title"),
                  author=it.get("user", {}).get("login"), published=it.get("created_at"), text="\n".join(parts), notes=notes)


def search(query: str, n: int = 10, kind: str = "repositories") -> Result:
    data = _api(f"/search/{kind}", q=query, per_page=str(n))
    items = []
    for r in data.get("items", [])[:n]:
        if kind == "repositories":
            items.append(Item(title=r.get("full_name"), url=r.get("html_url"), snippet=r.get("description") or "",
                              published=r.get("pushed_at"), extra={"stars": r.get("stargazers_count"), "language": r.get("language")}))
        else:
            items.append(Item(title=r.get("title"), url=r.get("html_url"), snippet=(r.get("body") or "")[:300],
                              author=r.get("user", {}).get("login"), published=r.get("created_at"), extra={"state": r.get("state")}))
    return Result(channel="github", method=f"GitHub search API (official, {auth_mode()})", title=query, items=items,
                  notes=[f"{data.get('total_count')} total matches"])
