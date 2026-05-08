from __future__ import annotations

import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.agents.personas import build_persona_prompt
from app.agents.state import AgentState
from app.core.config import get_settings
from app.tools.arxiv_tool import search_arxiv
from app.tools.nasa_tool import search_nasa


def _clean_answer_text(text: str, preserve_report_structure: bool = False) -> str:
    """Normalize model output to direct plain text for chat UI rendering."""
    cleaned = text.strip()

    # Remove markdown heading markers like ###, ####, etc.
    cleaned = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", cleaned)

    # Remove markdown bold markers for normal answers only.
    if not preserve_report_structure:
        cleaned = cleaned.replace("**", "")

    # Remove model-generated source sections; frontend renders sources separately.
    cleaned = re.sub(r"(?is)\n\s*(sources?|references?)\s*:?\s*\n.*$", "", cleaned)

    # Normalize common LaTeX inline/display math delimiters for plain text UI.
    cleaned = cleaned.replace(r"\(", "").replace(r"\)", "")
    cleaned = cleaned.replace(r"\[", "").replace(r"\]", "")

    # Normalize LaTeX superscript/subscript brace forms: x^{2} -> x^2, H_{2} -> H_2.
    cleaned = re.sub(r"\^\{([^{}]+)\}", r"^\1", cleaned)
    cleaned = re.sub(r"_\{([^{}]+)\}", r"_\1", cleaned)

    # Convert frequent LaTeX math operators to plain-text equivalents.
    cleaned = cleaned.replace(r"\times", " x ")
    cleaned = cleaned.replace(r"\cdot", " * ")

    # Remove list-like leading labels for normal answers, but keep structure for report mode.
    if not preserve_report_structure:
        cleaned = re.sub(r"(?m)^\s*\d+\.\s+[A-Za-z][^:\n]{1,80}:\s*", "", cleaned)

    # Collapse excessive blank lines.
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def prepare_prompt_node(state: AgentState) -> AgentState:
    return {
        "persona_prompt": build_persona_prompt(
            mode=state.get("mode", "space_researcher"),
            thinking_style=state.get("thinking_style", "deep_thinking"),
        )
    }


def retrieve_sources_node(state: AgentState) -> AgentState:
    settings = get_settings()
    query = state.get("query", "")

    arxiv_results = search_arxiv(query=query, max_results=4)
    nasa_results = search_nasa(query=query, api_key=settings.nasa_api_key, max_results=4)

    merged: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in arxiv_results + nasa_results:
        key = item.get("url", "")
        if not key or key in seen:
            continue
        seen.add(key)
        merged.append(item)

    return {
        "arxiv_results": arxiv_results,
        "nasa_results": nasa_results,
        "sources": merged,
    }


def _build_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No NASA or arXiv sources were retrieved."

    chunks: list[str] = []
    for src in sources[:4]:
        chunks.append(
            "\n".join(
                [
                    f"Source={src.get('source', 'Unknown')}",
                    f"Title={src.get('title', 'Untitled')}",
                    f"Summary={src.get('summary', 'No summary available.')}",
                ]
            )
        )
    return "\n\n".join(chunks)


def _length_instruction_for_query(query: str) -> str:
    """Set response length based on query complexity and intent."""
    q = query.lower().strip()
    word_count = len([w for w in re.split(r"\s+", q) if w])

    deep_intent_markers = [
        "explain",
        "detailed",
        "detail",
        "in depth",
        "how",
        "why",
        "compare",
        "mechanism",
        "research",
        "evidence",
        "future",
        "implications",
        "mission",
    ]
    has_deep_intent = any(marker in q for marker in deep_intent_markers)

    if word_count <= 6 and not has_deep_intent:
        return "Write a concise answer of about 100 to 160 words in one clear paragraph."
    if word_count <= 14 and not has_deep_intent:
        return "Write a medium-length answer of about 180 to 280 words in 2 short paragraphs."
    return (
        "Write a detailed answer of about 320 to 520 words in 3 to 5 paragraphs. "
        "Cover the core concept, current evidence, uncertainties, and practical implications."
    )


def _is_report_request(query: str) -> bool:
    q = query.lower()
    report_markers = [
        "report",
        "research report",
        "technical report",
        "briefing note",
        "write a report",
        "generate a report",
        "full report",
        "mission report",
    ]
    return any(marker in q for marker in report_markers)


def _report_instruction_for_query(query: str) -> str:
    q = query.lower()
    brief_markers = ["brief report", "short report", "summary report"]
    is_brief = any(marker in q for marker in brief_markers)

    length_line = (
        "Write about 260 to 380 words."
        if is_brief
        else "Write about 650 to 1000 words."
    )

    return (
        f"{length_line} "
        "Produce a structured report in plain text using these section labels exactly: "
        "Title, Executive Summary, Background, Evidence and Analysis, "
        "Uncertainties, Recommendations, Conclusion. "
        "Format each section label in bold exactly like this: **Title:**, **Executive Summary:**, "
        "**Background:**, **Evidence and Analysis:**, **Uncertainties:**, "
        "**Recommendations:**, **Conclusion:**. "
        "Keep the response directly focused on the user's requested topic."
    )


def _is_comparison_request(query: str) -> bool:
    q = query.lower()
    comparison_markers = [
        "compare",
        "comparison",
        "difference",
        "differences",
        "similar",
        "similarities",
        "vs",
        "versus",
        "better than",
        "which is better",
    ]
    return any(marker in q for marker in comparison_markers)


def _comparison_instruction_for_query() -> str:
    return (
        "Create a detailed comparison table with at least 10 rows covering different aspects. "
        "Table columns must be: Aspect | Option A | Option B | Analysis. "
        "Each aspect must be distinct and meaningful (e.g., Size, Mass, Temperature, Formation, Characteristics, Behavior, Observation Methods, Uses, Advantages, Disadvantages). "
        "Provide detailed and specific information in each cell, not just brief mentions. "
        "After the table, write a comprehensive conclusion paragraph of 5 to 8 sentences summarizing key differences and similarities."
    )


def answer_node(state: AgentState) -> AgentState:
    settings = get_settings()
    query = state.get("query", "")
    persona_prompt = state.get("persona_prompt", "")
    sources = state.get("sources", [])
    is_report_request = _is_report_request(query)
    is_comparison_request = _is_comparison_request(query)
    length_instruction = (
        _report_instruction_for_query(query)
        if is_report_request
        else _length_instruction_for_query(query)
    )
    comparison_instruction = _comparison_instruction_for_query() if is_comparison_request else ""

    context = _build_context(sources)

    if not sources:
        return {
            "answer": (
                "I could not retrieve data from NASA or arXiv right now (network/DNS issue). "
                "Please verify internet connectivity or DNS and try again."
            )
        }

    if not settings.ollama_model:
        fallback = (
            "OLLAMA_MODEL is not configured in backend/.env. "
            "I retrieved NASA/arXiv sources, but cannot synthesize with the LLM yet."
        )
        return {"answer": fallback}

    llm = ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=settings.ollama_temperature,
    )

    system_prompt = (
        f"{persona_prompt}\n\n"
        "You are part of a space research multi-agent system. "
        "Answer only using supplied NASA and arXiv context. "
        "Respond directly to the user's question first. "
        f"{length_instruction} "
        f"{comparison_instruction} "
        "For normal Q&A (non-report), do not use numbered lists, bullet points, "
        "section labels, or source-by-source headings. "
        "Use plain text only and do not use markdown headings or hash symbols. "
        "For normal Q&A (non-report), do not use bold markers. "
        "Do not include a Sources or References section in the answer body. "
        "If evidence is weak, say so clearly."
    )

    user_prompt = (
        f"User Query: {query}\n\n"
        "Knowledge Context from Tools:\n"
        f"{context}"
    )

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    return {
        "answer": _clean_answer_text(
            str(response.content),
            preserve_report_structure=is_report_request,
        )
    }
