from __future__ import annotations

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    query: str
    mode: str
    thinking_style: str
    persona_prompt: str
    nasa_results: list[dict[str, Any]]
    arxiv_results: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    answer: str
