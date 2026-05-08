from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.agents.personas import normalize_mode, normalize_thinking_style


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, description="User query from frontend")
    mode: str = Field(default="space_researcher")
    thinking_style: str = Field(default="deep_thinking")
    session_id: str | None = None
    metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def adapt_frontend_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        query = data.get("query") or data.get("message") or data.get("prompt")
        mode = data.get("mode") or data.get("role") or data.get("agent_mode")
        thinking_style = (
            data.get("thinking_style")
            or data.get("thinkingStyle")
            or data.get("thinking_mode")
            or data.get("reasoning_mode")
        )

        if query is not None:
            data["query"] = query
        if mode is not None:
            data["mode"] = mode
        if thinking_style is not None:
            data["thinking_style"] = thinking_style
        return data

    @model_validator(mode="after")
    def normalize_values(self) -> "ChatRequest":
        self.mode = normalize_mode(self.mode)
        self.thinking_style = normalize_thinking_style(self.thinking_style)
        self.query = self.query.strip()
        return self


class SourceItem(BaseModel):
    title: str
    url: str
    source: str
    summary: str | None = None


class ChatResponse(BaseModel):
    answer: str
    reply: str
    message: str
    mode: str
    thinking_style: str
    sources: list[SourceItem]
