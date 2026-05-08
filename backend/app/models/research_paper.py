from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.agents.personas import normalize_mode, normalize_thinking_style
from app.models.schemas import SourceItem


class ResearchPaperSection(BaseModel):
    id: str
    title: str
    content: str


class ResearchPaperRequest(BaseModel):
    topic: str = Field(min_length=1)
    paper_title: str | None = None
    authors: str | None = None
    mode: str = Field(default="space_researcher")
    thinking_style: str = Field(default="deep_thinking")
    section_id: str | None = None
    metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def adapt_frontend_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        topic = data.get("topic") or data.get("query") or data.get("research_topic")
        paper_title = data.get("paper_title") or data.get("paperTitle") or data.get("title")
        authors = data.get("authors") or data.get("author")
        mode = data.get("mode") or data.get("role") or data.get("agent_mode")
        thinking_style = (
            data.get("thinking_style")
            or data.get("thinkingStyle")
            or data.get("thinking_mode")
            or data.get("reasoning_mode")
        )
        section_id = data.get("section_id") or data.get("sectionId")

        if topic is not None:
            data["topic"] = topic
        if paper_title is not None:
            data["paper_title"] = paper_title
        if authors is not None:
            data["authors"] = authors
        if mode is not None:
            data["mode"] = mode
        if thinking_style is not None:
            data["thinking_style"] = thinking_style
        if section_id is not None:
            data["section_id"] = section_id
        return data

    @model_validator(mode="after")
    def normalize_values(self) -> "ResearchPaperRequest":
        self.mode = normalize_mode(self.mode)
        self.thinking_style = normalize_thinking_style(self.thinking_style)
        self.topic = self.topic.strip()
        if self.paper_title:
            self.paper_title = self.paper_title.strip()
        if self.authors:
            self.authors = self.authors.strip()
        if self.section_id:
            self.section_id = self.section_id.strip().lower()
        return self


class ResearchPaperResponse(BaseModel):
    topic: str
    paper_title: str
    keywords: list[str] = Field(default_factory=list)
    authors: str | None
    paper_text: str
    sections: list[ResearchPaperSection]
    sources: list[SourceItem]
    mode: str
    thinking_style: str
    latex_source: str | None = None


class ResearchSectionResponse(BaseModel):
    topic: str
    paper_title: str
    keywords: list[str] = Field(default_factory=list)
    authors: str | None
    section: ResearchPaperSection
    sources: list[SourceItem]
    mode: str
    thinking_style: str


class ResearchExportResponse(BaseModel):
    paper_title: str
    keywords: list[str] = Field(default_factory=list)
    latex_source: str
    export_html: str