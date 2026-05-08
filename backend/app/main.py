from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.explorer_routes import router as explorer_router
from app.api.research_routes import api_router as research_api_router
from app.api.research_routes import legacy_router as research_legacy_router
from app.api.research_routes import router as research_router
from app.api.routes import legacy_router, router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(legacy_router)
app.include_router(research_router)
app.include_router(research_api_router)
app.include_router(research_legacy_router)
app.include_router(explorer_router)
