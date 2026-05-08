from __future__ import annotations

from app.agents.graph import build_agent_graph
from app.models.schemas import ChatRequest, ChatResponse, SourceItem

agent_graph = build_agent_graph()


def run_chat(request: ChatRequest) -> ChatResponse:
    final_state = agent_graph.invoke(
        {
            "query": request.query,
            "mode": request.mode,
            "thinking_style": request.thinking_style,
        }
    )

    sources = [SourceItem(**item) for item in final_state.get("sources", [])]

    answer = final_state.get("answer", "No answer generated.")

    return ChatResponse(
        answer=answer,
        reply=answer,
        message=answer,
        mode=request.mode,
        thinking_style=request.thinking_style,
        sources=sources,
    )
