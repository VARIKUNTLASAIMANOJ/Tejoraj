from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import run_chat

router = APIRouter(prefix="/api/v1", tags=["space-agent"])
legacy_router = APIRouter(tags=["space-agent"])


def _handle_chat(request: ChatRequest) -> ChatResponse:
    try:
        return run_chat(request)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {exc}") from exc


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@legacy_router.get("/health")
def legacy_health() -> dict[str, str]:
    return health()


@router.get("/history")
def history() -> list[dict[str, str]]:
    return []


@legacy_router.get("/history")
def legacy_history() -> list[dict[str, str]]:
    return history()


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return _handle_chat(request)


@legacy_router.post("/chat", response_model=ChatResponse)
def legacy_chat(request: ChatRequest) -> ChatResponse:
    return _handle_chat(request)
