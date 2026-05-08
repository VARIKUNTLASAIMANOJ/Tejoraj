from __future__ import annotations

import logging
from typing import Any

import arxiv

logger = logging.getLogger(__name__)


def search_arxiv(query: str, max_results: int = 4) -> list[dict[str, Any]]:
    """Search arXiv papers relevant to the query."""
    try:
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance,
        )
        results: list[dict[str, Any]] = []
        for item in search.results():
            results.append(
                {
                    "source": "arXiv",
                    "title": item.title.strip(),
                    "url": item.entry_id,
                    "summary": item.summary.strip().replace("\n", " "),
                    "published": str(item.published.date()) if item.published else None,
                }
            )
        return results
    except Exception as exc:  # noqa: BLE001
        logger.warning("arXiv search unavailable: %s", exc)
        return []
