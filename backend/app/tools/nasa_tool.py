from __future__ import annotations

import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

NASA_IMAGES_API = "https://images-api.nasa.gov/search"
NASA_APOD_API = "https://api.nasa.gov/planetary/apod"


def search_nasa(query: str, api_key: str, max_results: int = 4) -> list[dict[str, Any]]:
    """Search NASA image/video library and include APOD as a trusted NASA source."""
    results: list[dict[str, Any]] = []

    try:
        response = requests.get(
            NASA_IMAGES_API,
            params={"q": query, "media_type": "image"},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()

        for item in payload.get("collection", {}).get("items", [])[:max_results]:
            data = item.get("data", [{}])[0]
            links = item.get("links", [])
            image_href = links[0].get("href") if links else None
            nasa_id = data.get("nasa_id")
            detail_url = f"https://images.nasa.gov/details-{nasa_id}" if nasa_id else image_href

            if not detail_url:
                continue

            results.append(
                {
                    "source": "NASA",
                    "title": data.get("title", "NASA Resource"),
                    "url": detail_url,
                    "summary": data.get("description", "")[:600],
                }
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("NASA image search unavailable: %s", exc)

    try:
        apod_response = requests.get(
            NASA_APOD_API,
            params={"api_key": api_key},
            timeout=15,
        )
        apod_response.raise_for_status()
        apod = apod_response.json()
        apod_url = apod.get("url") or "https://api.nasa.gov/"
        results.append(
            {
                "source": "NASA",
                "title": f"APOD: {apod.get('title', 'Astronomy Picture of the Day')}",
                "url": apod_url,
                "summary": apod.get("explanation", "")[:600],
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("NASA APOD unavailable: %s", exc)

    return results
