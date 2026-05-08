from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.core.config import get_settings
from app.models.research_paper import (
    ResearchExportResponse,
    ResearchPaperRequest,
    ResearchPaperResponse,
    ResearchPaperSection,
    ResearchSectionResponse,
)
from app.models.schemas import SourceItem
from app.services.latex_export_service import (
    build_ieee_export_html,
    build_ieee_latex_document,
)
from app.tools.arxiv_tool import search_arxiv
from app.tools.nasa_images_tool import embed_figures_in_markdown, search_nasa_images
from app.tools.nasa_tool import search_nasa


@dataclass(frozen=True)
class SectionSpec:
    id: str
    title: str
    prompt: str
    word_target: str


SECTION_SPECS: list[SectionSpec] = [
    SectionSpec(
        id="abstract",
        title="Abstract",
        prompt=(
            "Summarize the topic, motivation, approach, evidence, and key takeaway in a compact academic abstract. "
            "Use one paragraph."
        ),
        word_target="150 to 250 words",
    ),
    SectionSpec(
        id="introduction",
        title="Introduction",
        prompt=(
            "Introduce the topic, define the research problem, and explain why it matters for space science. "
            "Do not use bullet points."
        ),
        word_target="180 to 260 words",
    ),
    SectionSpec(
        id="literature",
        title="Literature Review",
        prompt=(
            "Synthesize the most relevant NASA and arXiv findings into a compact literature review. "
            "Compare themes, methods, and gaps in the literature."
        ),
        word_target="220 to 320 words",
    ),
    SectionSpec(
        id="methodology",
        title="Methodology",
        prompt=(
            "Describe a rigorous research methodology suitable for this topic. "
            "Explain what data, observations, or analysis steps would be used."
        ),
        word_target="180 to 260 words",
    ),
    SectionSpec(
        id="results",
        title="Results",
        prompt=(
            "Present the main findings objectively. Include references to tables or figures if applicable. "
            "When the sources are limited, be explicit about what can and cannot be concluded from the data."
        ),
        word_target="200 to 300 words",
    ),
    SectionSpec(
        id="discussion",
        title="Discussion",
        prompt=(
            "Interpret the findings within the context of the literature. Discuss limitations, implications, and significance. "
            "Explain how the results contribute to the field."
        ),
        word_target="200 to 300 words",
    ),
    SectionSpec(
        id="conclusion",
        title="Conclusion",
        prompt=(
            "Conclude the paper with the main findings, limitations, and the most important next steps for future work."
        ),
        word_target="140 to 220 words",
    ),
]


def _clean_text(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", cleaned)
    cleaned = cleaned.replace("**", "")

    # Normalize common LaTeX inline/display math delimiters for plain text UI.
    cleaned = cleaned.replace(r"\(", "").replace(r"\)", "")
    cleaned = cleaned.replace(r"\[", "").replace(r"\]", "")

    # Normalize LaTeX superscript/subscript brace forms: x^{2} -> x^2, H_{2} -> H_2.
    cleaned = re.sub(r"\^\{([^{}]+)\}", r"^\1", cleaned)
    cleaned = re.sub(r"_\{([^{}]+)\}", r"_\1", cleaned)

    # Convert frequent LaTeX math operators to plain-text equivalents.
    cleaned = cleaned.replace(r"\times", " x ")
    cleaned = cleaned.replace(r"\cdot", " * ")

    # Remove inline or standalone arXiv citation fragments from generated prose.
    cleaned = re.sub(r"\(\s*arXiv:[^\)]*\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(arXiv:[A-Za-z0-9.\-vV]+)\b", "", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"(?is)\n\s*(sources?|references?)\s*:\s*\n.*$", "", cleaned)
    return cleaned.strip()


def _retrieve_sources(query: str) -> list[dict[str, Any]]:
    settings = get_settings()
    arxiv_results = search_arxiv(query=query, max_results=5)
    nasa_results = search_nasa(query=query, api_key=settings.nasa_api_key, max_results=5)

    merged: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in arxiv_results + nasa_results:
        url = item.get("url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        merged.append(item)
    return merged


def _sources_for_prompt(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No NASA or arXiv sources were retrieved."

    blocks: list[str] = []
    for source in sources[:8]:
        blocks.append(
            "\n".join(
                [
                    f"Source: {source.get('source', 'Unknown')}",
                    f"Title: {source.get('title', 'Untitled')}",
                    f"Summary: {source.get('summary', 'No summary available.')}",
                    f"URL: {source.get('url', '')}",
                ]
            )
        )
    return "\n\n".join(blocks)


def _build_reference_entries(sources: list[dict[str, Any]]) -> str:
    entries: list[str] = []
    for index, source in enumerate(sources, start=1):
        title = source.get("title", "Untitled")
        provider = source.get("source", "Source")
        url = source.get("url", "")
        # IEEE format: [1] A. Author, "Title," Source. URL
        entries.append(f"[{index}] {title}. {provider}. {url}".strip())

    if not entries:
        return "No references were retrieved."
    return "\n".join(entries)


def _resolve_title(request: ResearchPaperRequest) -> str:
    if request.paper_title:
        return request.paper_title
    return f"Research Paper: {request.topic}"


def _fallback_keywords(topic: str) -> list[str]:
    pieces = [item.strip() for item in re.split(r"[,;/-]+", topic) if item.strip()]
    if not pieces:
        pieces = [topic.strip()]
    keywords: list[str] = []
    for piece in pieces:
        lowered = piece.lower()
        if lowered and lowered not in keywords:
            keywords.append(lowered)
    return keywords[:6]


def _parse_keywords(text: str) -> list[str]:
    keywords: list[str] = []
    for raw in re.split(r"[,\n;]+", text):
        item = raw.strip().strip("-•* ")
        if item:
            normalized = item.lower()
            if normalized not in keywords:
                keywords.append(normalized)
    return keywords[:6]


def _coerce_keywords(value: Any) -> list[str]:
    if isinstance(value, list):
        return _parse_keywords(", ".join(str(item) for item in value))
    if isinstance(value, str):
        return _parse_keywords(value)
    return []


def _sections_from_metadata(metadata: dict[str, Any] | None) -> list[ResearchPaperSection]:
    if not metadata:
        return []

    raw_sections = metadata.get("sections")
    if not isinstance(raw_sections, list):
        return []

    sections: list[ResearchPaperSection] = []
    for item in raw_sections:
        if isinstance(item, dict) and item.get("id") and item.get("title") is not None:
            sections.append(
                ResearchPaperSection(
                    id=str(item.get("id")),
                    title=str(item.get("title")),
                    content=str(item.get("content") or ""),
                )
            )
    return sections


def _generate_paper_metadata(
    llm: ChatOllama,
    *,
    request: ResearchPaperRequest,
    sources_context: str,
) -> tuple[str, list[str]]:
    if request.paper_title:
        return request.paper_title, _fallback_keywords(request.topic)

    system_prompt = (
        "You are an academic title and keyword assistant for IEEE-style space science papers. "
        "Return only concise plain text."
    )
    user_prompt = (
        f"Topic: {request.topic}\n"
        f"Source context:\n{sources_context}\n\n"
        "Write a strong IEEE-style paper title and 4 to 6 keywords. "
        "Format exactly as:\n"
        "Title: <title>\n"
        "Keywords: keyword1, keyword2, keyword3"
    )

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    raw_text = str(response.content).strip()

    title = _resolve_title(request)
    keywords = _fallback_keywords(request.topic)

    for line in raw_text.splitlines():
        lowered = line.lower().strip()
        if lowered.startswith("title:"):
            candidate = line.split(":", 1)[1].strip()
            if candidate:
                title = candidate
        elif lowered.startswith("keywords:"):
            candidate = line.split(":", 1)[1].strip()
            parsed = _parse_keywords(candidate)
            if parsed:
                keywords = parsed

    return title, keywords


def _build_system_prompt(mode: str, thinking_style: str) -> str:
    return (
        "You are a senior academic research assistant for space science writing. "
        f"Mode: {mode}. Thinking style: {thinking_style}. "
        "Use only the supplied NASA and arXiv context. "
        "Write in IEEE academic format with formal scholarly prose and clear, direct sentences. "
        "Use Roman numeral section headings. Avoid markdown headings, bullet lists, and source-by-source narration in section drafts."
    )


def _generate_text(
    llm: ChatOllama,
    *,
    system_prompt: str,
    user_prompt: str,
) -> str:
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    return _clean_text(str(response.content))


def _generate_section_content(
    llm: ChatOllama,
    *,
    request: ResearchPaperRequest,
    title: str,
    section: SectionSpec,
    sources_context: str,
) -> str:
    system_prompt = _build_system_prompt(request.mode, request.thinking_style)
    user_prompt = (
        f"Paper title: {title}\n"
        f"Research topic: {request.topic}\n"
        f"Section: {section.title}\n"
        f"Target length: {section.word_target}.\n"
        f"Instructions: {section.prompt}\n\n"
        "Source context:\n"
        f"{sources_context}"
    )
    return _generate_text(llm, system_prompt=system_prompt, user_prompt=user_prompt)


def _parse_markdown_sections(markdown_text: str) -> dict[str, str]:
    """
    Parse markdown sections by # heading level.
    Returns a dict mapping section title (lowercase) to content.
    Example: "# Abstract\nContent here" -> {"abstract": "Content here"}
    """
    sections: dict[str, str] = {}
    current_section = None
    current_content: list[str] = []

    for line in markdown_text.split("\n"):
        # Match # Heading (but not ## or ###)
        heading_match = re.match(r"^#\s+(.+?)\s*$", line)
        if heading_match:
            # Save previous section
            if current_section is not None:
                sections[current_section] = "\n".join(current_content).strip()
            # Start new section
            current_section = heading_match.group(1).lower()
            current_content = []
        elif current_section is not None:
            current_content.append(line)

    # Save final section
    if current_section is not None:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def _map_sections_to_specs(
    parsed_sections: dict[str, str],
) -> list[ResearchPaperSection]:
    """
    Map parsed markdown sections to SECTION_SPECS by title matching.
    """
    sections: list[ResearchPaperSection] = []
    for spec in SECTION_SPECS:
        # Normalize title for matching ("Results & Discussion" -> "results")
        normalized_title = spec.title.lower()
        content = parsed_sections.get(normalized_title, "")
        if content:
            content = _clean_text(content)
        else:
            content = f"[Placeholder: {spec.title} section not generated]"
        sections.append(ResearchPaperSection(id=spec.id, title=spec.title, content=content))
    return sections


def _build_system_prompt_single_call(mode: str, thinking_style: str) -> str:
    """
    System prompt optimized for single-call full-paper generation with markdown format.
    """
    return (
        "You are a senior academic research assistant for space science writing. "
        f"Mode: {mode}. Thinking style: {thinking_style}. "
        "Use only the supplied NASA and arXiv context. "
        "Write in IEEE academic format with formal scholarly prose and clear, direct sentences. "
        "OUTPUT AS MARKDOWN with section headings (# Abstract, # Introduction, # Literature Review, # Methodology, # Results, # Discussion, # Conclusion). "
        "Do NOT use bullet lists or source-by-source narration. You may include markdown tables if presenting data."
    )


def _generate_full_paper_single_call(
    llm: ChatOllama,
    *,
    request: ResearchPaperRequest,
    paper_title: str,
    sources_context: str,
    figures: list[dict[str, Any]] | None = None,
) -> list[ResearchPaperSection]:
    """
    Generate entire research paper in a single LLM call, then parse markdown sections.
    Optionally embeds NASA images as figures.
    ~7x faster than sequential section generation.
    """
    system_prompt = _build_system_prompt_single_call(request.mode, request.thinking_style)

    section_guidelines = "\n".join(
        [
            f"- {spec.title} ({spec.word_target}): {spec.prompt}"
            for spec in SECTION_SPECS
        ]
    )

    figures_note = ""
    if figures:
        figures_note = (
            f"\n\nNOTE: Figure examples with image URLs are provided. "
            f"You may reference them (e.g., 'As shown in Figure 1, ...') in the Results section."
        )

    user_prompt = (
        f"Paper title: {paper_title}\n"
        f"Research topic: {request.topic}\n"
        f"Authors: {request.authors or 'Not specified'}\n\n"
        f"Write a complete research paper with these sections (use # for each section heading):\n"
        f"{section_guidelines}\n\n"
        f"Source context to use:\n"
        f"{sources_context}{figures_note}"
    )

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    markdown_output = str(response.content)

    # Embed figures into markdown
    if figures:
        markdown_output = embed_figures_in_markdown(markdown_output, figures)

    # Parse markdown sections
    parsed = _parse_markdown_sections(markdown_output)
    sections = _map_sections_to_specs(parsed)

    return sections


def _build_sections(
    llm: ChatOllama,
    *,
    request: ResearchPaperRequest,
    paper_title: str,
    sources_context: str,
    section_filter: str | None = None,
) -> list[ResearchPaperSection]:
    """
    Legacy function for sequential section generation (kept for backward compatibility).
    Use _generate_full_paper_single_call() for better performance.
    """
    sections: list[ResearchPaperSection] = []
    for spec in SECTION_SPECS:
        if section_filter and spec.id != section_filter:
            continue
        content = _generate_section_content(
            llm,
            request=request,
            title=paper_title,
            section=spec,
            sources_context=sources_context,
        )
        sections.append(ResearchPaperSection(id=spec.id, title=spec.title, content=content))
    return sections


def generate_research_paper(request: ResearchPaperRequest) -> ResearchPaperResponse:
    settings = get_settings()
    sources = _retrieve_sources(request.topic)

    if not sources:
        raise ValueError(
            "I could not retrieve NASA or arXiv sources right now. Please verify network connectivity and try again."
        )

    if not settings.ollama_model:
        raise ValueError(
            "OLLAMA_MODEL is not configured in backend/.env. The research paper generator needs a local Ollama model."
        )

    llm = ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=settings.ollama_temperature,
    )

    sources_context = _sources_for_prompt(sources)
    paper_title, keywords = _generate_paper_metadata(
        llm,
        request=request,
        sources_context=sources_context,
    )
    
    # Fetch NASA images for figures
    figures = search_nasa_images(request.topic, max_results=2)
    
    # Use optimized single-call generation (~7x faster) with embedded figures
    sections = _generate_full_paper_single_call(
        llm,
        request=request,
        paper_title=paper_title,
        sources_context=sources_context,
        figures=figures,
    )

    references = ResearchPaperSection(
        id="references",
        title="References",
        content=_build_reference_entries(sources),
    )
    full_sections = sections + [references]
    latex_source = build_ieee_latex_document(
        title=paper_title,
        keywords=keywords,
        authors=request.authors,
        sections=sections,
        references=references,
    )

    paper_text = "\n\n".join(
        [
            f"Title: {paper_title}",
            f"Topic: {request.topic}",
            f"Authors: {request.authors}" if request.authors else "",
            *[f"{section.title}\n{section.content}" for section in full_sections],
        ]
    ).strip()

    return ResearchPaperResponse(
        topic=request.topic,
        paper_title=paper_title,
        keywords=keywords,
        authors=request.authors,
        paper_text=paper_text,
        sections=full_sections,
        sources=[SourceItem(**item) for item in sources],
        mode=request.mode,
        thinking_style=request.thinking_style,
        latex_source=latex_source,
    )


def build_research_export(request: ResearchPaperRequest) -> ResearchExportResponse:
    sections = _sections_from_metadata(request.metadata)
    keyword_list = _coerce_keywords((request.metadata or {}).get("keywords"))
    paper_title = str((request.metadata or {}).get("paper_title") or request.paper_title or f"Research Paper: {request.topic}").strip()
    authors = str((request.metadata or {}).get("authors") or request.authors or "").strip() or None

    if not sections:
        generated = generate_research_paper(request)
        sections = generated.sections
        keyword_list = generated.keywords
        paper_title = generated.paper_title
        authors = generated.authors

    references = next((section for section in sections if section.id == "references"), None)
    content_sections = [section for section in sections if section.id != "references"]

    latex_source = build_ieee_latex_document(
        title=paper_title,
        keywords=keyword_list,
        authors=authors,
        sections=content_sections,
        references=references,
    )
    export_html = build_ieee_export_html(
        title=paper_title,
        keywords=keyword_list,
        authors=authors,
        sections=content_sections,
        references=references,
    )

    return ResearchExportResponse(
        paper_title=paper_title,
        keywords=keyword_list,
        latex_source=latex_source,
        export_html=export_html,
    )


def generate_research_section(request: ResearchPaperRequest) -> ResearchSectionResponse:
    if not request.section_id:
        raise ValueError("section_id is required to generate a single section.")

    settings = get_settings()
    sources = _retrieve_sources(request.topic)

    if not sources:
        raise ValueError(
            "I could not retrieve NASA or arXiv sources right now. Please verify network connectivity and try again."
        )

    if not settings.ollama_model:
        raise ValueError(
            "OLLAMA_MODEL is not configured in backend/.env. The research paper generator needs a local Ollama model."
        )

    llm = ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=settings.ollama_temperature,
    )

    paper_title = _resolve_title(request)
    keywords = _fallback_keywords(request.topic)
    sources_context = _sources_for_prompt(sources)
    spec = next((item for item in SECTION_SPECS if item.id == request.section_id), None)
    if spec is None:
        raise ValueError(f"Unknown research section: {request.section_id}")

    content = _generate_section_content(
        llm,
        request=request,
        title=paper_title,
        section=spec,
        sources_context=sources_context,
    )

    return ResearchSectionResponse(
        topic=request.topic,
        paper_title=paper_title,
        keywords=keywords,
        authors=request.authors,
        section=ResearchPaperSection(id=spec.id, title=spec.title, content=content),
        sources=[SourceItem(**item) for item in sources],
        mode=request.mode,
        thinking_style=request.thinking_style,
    )