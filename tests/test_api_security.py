from pathlib import Path
from datetime import datetime

import pytest
from fastapi import HTTPException

import api.main as main


def test_static_asset_resolution_stays_inside_dist(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    dist.mkdir()
    asset = dist / "app.js"
    asset.write_text("ok")
    secret = tmp_path / "secret.txt"
    secret.write_text("nope")
    monkeypatch.setattr(main, "_UI_DIST_RESOLVED", dist.resolve())

    assert main._safe_ui_candidate("app.js") == asset
    assert main._safe_ui_candidate("../secret.txt") is None
    assert main._safe_ui_candidate("%2e%2e/secret.txt") is None


def test_admin_endpoints_fail_closed(monkeypatch):
    monkeypatch.delenv("ADMIN_API_KEY", raising=False)
    with pytest.raises(HTTPException) as disabled:
        main._require_admin("anything")
    assert disabled.value.status_code == 503

    monkeypatch.setenv("ADMIN_API_KEY", "correct-horse-battery-staple")
    with pytest.raises(HTTPException) as denied:
        main._require_admin("wrong")
    assert denied.value.status_code == 401
    assert main._require_admin("correct-horse-battery-staple") is None


@pytest.mark.parametrize("value", ["javascript:alert(1)", "data:text/html,x", "//example.com"])
def test_model_urls_reject_unsafe_schemes(value):
    assert main._safe_external_url(value) is None


def test_model_urls_allow_http_and_https():
    assert main._safe_external_url("https://example.com/story") == "https://example.com/story"
    assert main._safe_external_url("http://example.com/story") == "http://example.com/story"


def test_final_news_archive_needs_no_provider_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    items = main.news()
    summary = main.news_summary()

    assert len(items) >= 6
    assert "June 18" in summary["brief"]
    assert all(item["url"].startswith(("http://", "https://")) for item in items)
    assert all(datetime.fromisoformat(item["timestamp"]).date().isoformat() <= "2026-06-18" for item in items)


def test_status_uses_final_local_observations():
    status = main._build_status()
    assert status["as_of"] == "2026-06-18"
    assert status["study_status"] == "FINAL"
    assert status["market_data_status"] == "OBSERVED"
    assert status["hormuz_status"] == "OPEN"
