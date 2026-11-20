"""Offline tests: routing, parsing and the honesty rules. No network is touched.

    cd tools/eyes && uv run --with pytest -m pytest -q
"""
import io
import urllib.error

import pytest

from eyes import cli, core, github, router, social, video, web
from eyes.core import Blocked, NotFound, Result


@pytest.mark.parametrize("url,channel", [
    ("https://www.youtube.com/watch?v=jNQXAC9IVRw", "youtube"),
    ("https://youtu.be/jNQXAC9IVRw", "youtube"),
    ("https://www.bilibili.com/video/BV1JKoeBiEt4/", "bilibili"),
    ("https://github.com/python/cpython", "github"),
    ("https://github.com/cli/cli/issues/1000", "github"),
    ("https://www.reddit.com/r/Python/comments/abc123/some_title/", "reddit"),
    ("https://redd.it/abc123", "reddit"),
    ("https://www.reddit.com/r/Python/", "web"),         # a subreddit page is not a thread
    ("https://x.com/jack/status/20", "x"),
    ("https://twitter.com/jack", "x"),
    ("https://www.xiaohongshu.com/explore/6a2b", "xhs"),
    ("https://notgithub.com/a/b", "web"),                 # host must match exactly, not by suffix
    ("https://example.com/youtube.com", "web"),
    ("arxiv.org/abs/2604.02460", "web"),
])
def test_routing(url, channel):
    assert router.channel_for(url) == channel


def test_github_link_parsing():
    assert github.parse("https://github.com/owner/repo.git") == ("owner", "repo", None, None)
    assert github.parse("https://github.com/o/r/issues/12") == ("o", "r", "issues", "12")
    assert github.parse("https://github.com/o/r/blob/main/src/x.py") == ("o", "r", "blob", "main/src/x.py")
    with pytest.raises(NotFound):
        github.parse("https://gitlab.com/o/r")


def test_reddit_and_x_ids():
    assert social.reddit_post_id("https://old.reddit.com/r/a/comments/1y0le52/psa/") == "1y0le52"
    assert social.reddit_post_id("https://redd.it/1y0le52") == "1y0le52"
    assert social.TWEET.search("https://x.com/ClaudeDevs/status/2118063143167693011").groups() == ("ClaudeDevs", "2118063143167693011")


def test_youtube_caption_parsers():
    j3 = {"events": [{"tStartMs": 1000, "segs": [{"utf8": "All right, "}, {"utf8": "so here we are"}]},
                     {"tStartMs": 2000}, {"tStartMs": 65000, "segs": [{"utf8": "\n"}]},
                     {"tStartMs": 3_725_000, "segs": [{"utf8": "late"}]}]}
    assert video.parse_json3(j3) == "[00:01] All right, so here we are\n[1:02:05] late"
    vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<c>hello</c> world\n\n00:00:02.000 --> 00:00:03.000\nhello world\n\n01:05.000 --> 01:06.000\nnext"
    assert video.parse_vtt(vtt) == "[00:01] hello world\n[01:05] next"


def test_caption_track_choice_prefers_asked_then_original_language():
    tracks = {"de": [1], "en": [2], "zh-Hans": [3]}
    assert video._pick_track(tracks, "zh-Hans", "de")[0] == "zh-Hans"
    assert video._pick_track(tracks, None, "de")[0] == "de"
    assert video._pick_track({"fr": [1]}, None, None)[0] == "fr"
    assert video._pick_track({}, None, None) == (None, None)


class _Resp(io.BytesIO):
    headers = {}
    def __enter__(self): return self
    def __exit__(self, *a): return False


def _http_error(code):
    def opener(req, timeout):
        assert req.get_header("User-agent") == core.USER_AGENT  # honest identity, every request
        raise urllib.error.HTTPError(req.full_url, code, "x", {}, io.BytesIO(b'{"error":"nope"}'))
    return opener


@pytest.mark.parametrize("code,exc", [(401, Blocked), (403, Blocked), (404, NotFound), (422, RuntimeError)])
def test_refusals_are_reported_not_worked_around(monkeypatch, code, exc):
    calls = []
    def opener(req, timeout):
        calls.append(req)
        return _http_error(code)(req, timeout)
    monkeypatch.setattr(core.urllib.request, "urlopen", opener)
    with pytest.raises(exc):
        core.fetch("https://example.com/x")
    assert len(calls) == 1  # no retry, no second identity


def test_user_agent_names_the_tool_not_a_browser():
    assert core.USER_AGENT.startswith("proofline-eyes/")
    assert "Mozilla" not in core.USER_AGENT and "Chrome" not in core.USER_AGENT


def test_xiaohongshu_read_is_blocked_not_bypassed():
    with pytest.raises(Blocked):
        router.read("https://www.xiaohongshu.com/explore/abc")


def test_web_search_falls_back_across_backends(monkeypatch):
    tried = []
    class FakeDDGS:
        def text(self, q, max_results, backend):
            tried.append(backend)
            if backend in ("auto", "bing"):
                raise Exception("No results found.")
            return [{"title": "T", "href": "https://a.example", "body": "b"}]
    import ddgs
    monkeypatch.setattr(ddgs, "DDGS", FakeDDGS)
    r = web.search_web("q", n=1, site="x.com")
    assert tried == ["auto", "bing", "yahoo"] and r.items[0].url == "https://a.example"
    assert r.title == "q site:x.com" and "yahoo" in r.method


def test_x_post_reader(monkeypatch):
    fixture = {"code": 200, "tweet": {"url": "https://x.com/a/status/1", "text": "hello world", "created_at": "Wed",
                                      "created_timestamp": 0, "likes": 3, "author": {"screen_name": "a", "name": "A"}}}
    monkeypatch.setattr(social, "fetch_json", lambda url, **kw: fixture)
    r = social.read_x("https://twitter.com/a/status/1")
    assert "hello world" in r.text and r.author == "a" and "FixTweet" in r.method
    assert any("replies" in n for n in r.notes)


def test_reddit_thread_reader(monkeypatch):
    def arctic(path, **p):
        if path == "/posts/ids":
            return [{"id": "p1", "title": "T", "author": "u1", "subreddit": "s", "score": 5, "num_comments": 9,
                     "created_utc": 0, "selftext": "body"}]
        return [{"author": "c1", "body": "low", "score": 1, "parent_id": "t3_p1"},
                {"author": "c2", "body": "high", "score": 9, "parent_id": "t1_x"}]
    monkeypatch.setattr(social, "_arctic", arctic)
    r = social.read_reddit("https://www.reddit.com/r/s/comments/p1/t/")
    assert r.text.index("high") < r.text.index("low")          # best comments first
    assert "(reply)" in r.text and any("9 comments" in n for n in r.notes)
    assert "archive" in r.method.lower()


def test_render_shows_provenance_and_notes():
    out = cli.render(Result(channel="web", method="direct download", url="https://a.example", title="T", text="body", notes=["careful"]))
    assert "Source: https://a.example" in out and "Method: direct download" in out and "Note: careful" in out and out.endswith("body\n")


def test_strip_tags_drops_scripts():
    assert web._strip_tags("<p>a</p><script>evil()</script><style>x{}</style><p>b</p>") == "a b"
