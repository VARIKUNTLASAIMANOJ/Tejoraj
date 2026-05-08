from __future__ import annotations

import time
from datetime import date as _date
from typing import Any

import requests
from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_settings
from app.tools.nasa_tool import NASA_APOD_API, NASA_IMAGES_API

router = APIRouter(prefix="/api/explorer", tags=["explorer"])

# Simple in-memory cache for APOD responses: date_str -> (timestamp, data)
APOD_CACHE: dict[str, tuple[float, dict[str, Any]] ] = {}
APOD_CACHE_TTL = 3600.0  # seconds


@router.get("/apod")
def get_apod(date: str | None = Query(None, description="YYYY-MM-DD (defaults to today)")) -> Any:
    """Proxy to NASA APOD API. Caches results for 1 hour."""
    settings = get_settings()
    if not date:
        date = _date.today().isoformat()

    # Check cache
    cached = APOD_CACHE.get(date)
    now = time.time()
    if cached:
        ts, data = cached
        if now - ts < APOD_CACHE_TTL:
            return data

    params = {"api_key": settings.nasa_api_key, "date": date}
    try:
        resp = requests.get(NASA_APOD_API, params=params, timeout=10)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:
        # Return 502 to frontend to indicate upstream failure
        raise HTTPException(status_code=502, detail=f"NASA APOD request failed: {exc}")

    # Store in cache
    APOD_CACHE[date] = (now, payload)
    return payload


@router.get("/gallery")
def get_gallery(q: str = Query("space exploration", description="Search query")) -> dict[str, Any]:
    """Fetch recent NASA imagery and return simplified image objects.

    Transformed response: { "images": [{ "title": str, "url": str, "thumb": str }] }
    """
    settings = get_settings()
    params = {"q": q, "media_type": "image", "page": 1}
    try:
        resp = requests.get(NASA_IMAGES_API, params=params, timeout=12)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"NASA Images request failed: {exc}")

    items = payload.get("collection", {}).get("items", []) or []
    images: list[dict[str, str]] = []
    for item in items[:12]:
        data = (item.get("data") or [{}])[0] if item.get("data") else {}
        links = item.get("links") or []
        thumb = None
        if links:
            # prefer preview links if available
            thumb = links[0].get("href")

        title = data.get("title") or "NASA Image"
        nasa_id = data.get("nasa_id")
        if isinstance(nasa_id, str) and nasa_id:
            url = f"https://images.nasa.gov/details-{nasa_id}"
        else:
            url = thumb or ""

        images.append({"title": title, "url": url, "thumb": thumb or ""})

    return {"images": images}


@router.get("/news")
def get_space_news(limit: int = Query(10, ge=1, le=50, description="Number of articles to return")) -> dict[str, Any]:
    """Fetch recent space news from the free Spaceflight News API."""
    url = "https://api.spaceflightnewsapi.net/v4/articles/"
    params = {"limit": limit, "ordering": "-published_at"}

    try:
        resp = requests.get(url, params=params, timeout=12)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Space news request failed: {exc}")

    # The API usually returns a `results` array; handle a direct array as well.
    items = payload.get("results", payload if isinstance(payload, list) else [])
    articles: list[dict[str, Any]] = []

    for item in items[:limit]:
        articles.append(
            {
                "title": item.get("title", ""),
                "summary": item.get("summary", ""),
                "url": item.get("url", ""),
                "image_url": item.get("image_url", ""),
                "news_site": item.get("news_site", ""),
                "published_at": item.get("published_at", ""),
            }
        )

    return {"articles": articles}
