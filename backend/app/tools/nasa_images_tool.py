"""NASA Images API tool for fetching and embedding research paper figures."""

from __future__ import annotations

import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

NASA_IMAGES_API = "https://images-api.nasa.gov/search"


def search_nasa_images(query: str, max_results: int = 3) -> list[dict[str, Any]]:
    """
    Search NASA Images API for high-quality images relevant to the research topic.
    Returns list of image objects with direct image URLs (not detail pages).
    """
    images: list[dict[str, Any]] = []

    try:
        # Note: the NASA Images API expects `year_start` / `year_end`, not `year_from`.
        # Use integers for year values.
        response = requests.get(
            NASA_IMAGES_API,
            params={
                "q": query,
                "media_type": "image",
                "year_start": 2015,  # Recent images only
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()

        for item in payload.get("collection", {}).get("items", [])[:max_results * 2]:
            data = item.get("data", [{}])[0]
            links = item.get("links", [])

            # Extract image URL and thumbnail
            image_href = links[0].get("href") if links else None
            if not image_href:
                continue

            title = data.get("title", "NASA Research Image")
            description = data.get("description", "")[:300]
            nasa_id = data.get("nasa_id", "")

            # Build figure caption
            caption = title
            if description:
                caption = f"{title}. {description}"

            images.append(
                {
                    "url": image_href,
                    "title": title,
                    "caption": caption,
                    "nasa_id": nasa_id,
                }
            )

            if len(images) >= max_results:
                break

    except Exception as exc:
        # Log response text when available to aid debugging (400/422 etc.)
        try:
            resp_text = None
            if hasattr(exc, 'response') and getattr(exc, 'response') is not None:
                resp_text = getattr(exc.response, 'text', None)
            logger.warning("NASA images search failed: %s -- response: %s", exc, resp_text)
        except Exception:
            logger.warning("NASA images search failed: %s", exc)

    return images


def embed_figures_in_markdown(
    markdown: str, figures: list[dict[str, Any]], section_id: str = "results"
) -> str:
    """
    Embed figure references into markdown.
    Finds a section heading and inserts figure markdown before it.
    """
    if not figures:
        return markdown

    # Look for Results section and insert figures there
    lines = markdown.split("\n")
    result_lines: list[str] = []
    figures_inserted = False

    for line in lines:
        result_lines.append(line)

        # Insert figures after Results heading
        if not figures_inserted and line.startswith("# Results"):
            result_lines.append("")  # Blank line
            for idx, fig in enumerate(figures, 1):
                result_lines.append(f"![Figure {idx}: {fig['title']}]({fig['url']})")
                result_lines.append("")
                result_lines.append(f"*Figure {idx}: {fig.get('caption', fig['title'])[:200]}*")
                result_lines.append("")
            figures_inserted = True

    return "\n".join(result_lines)
