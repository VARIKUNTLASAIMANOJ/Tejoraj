from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.research_paper import (
    ResearchExportResponse,
    ResearchPaperRequest,
    ResearchPaperResponse,
    ResearchSectionResponse,
)
from app.services.pdf_export_service import build_pdf_bytes
from app.services.research_paper_service import (
    build_research_export,
    generate_research_paper,
    generate_research_section,
)

router = APIRouter(prefix="/api/v1/research", tags=["research-paper"])
api_router = APIRouter(prefix="/api/research", tags=["research-paper"])
legacy_router = APIRouter(tags=["research-paper"])


def _handle_generate_paper(request: ResearchPaperRequest) -> ResearchPaperResponse:
    try:
        return generate_research_paper(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Research paper generation failed: {exc}") from exc


def _handle_generate_section(request: ResearchPaperRequest) -> ResearchSectionResponse:
    try:
        return generate_research_section(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Research section generation failed: {exc}") from exc


@router.post("/generate", response_model=ResearchPaperResponse)
def generate_paper(request: ResearchPaperRequest) -> ResearchPaperResponse:
    return _handle_generate_paper(request)


@api_router.post("/generate", response_model=ResearchPaperResponse)
def api_generate_paper(request: ResearchPaperRequest) -> ResearchPaperResponse:
    return _handle_generate_paper(request)


@legacy_router.post("/research/generate", response_model=ResearchPaperResponse)
def legacy_generate_paper(request: ResearchPaperRequest) -> ResearchPaperResponse:
    return _handle_generate_paper(request)


@router.post("/section", response_model=ResearchSectionResponse)
def generate_section(request: ResearchPaperRequest) -> ResearchSectionResponse:
    return _handle_generate_section(request)


@api_router.post("/section", response_model=ResearchSectionResponse)
def api_generate_section(request: ResearchPaperRequest) -> ResearchSectionResponse:
    return _handle_generate_section(request)


@legacy_router.post("/research/section", response_model=ResearchSectionResponse)
def legacy_generate_section(request: ResearchPaperRequest) -> ResearchSectionResponse:
    return _handle_generate_section(request)


@api_router.post("/export", response_model=ResearchExportResponse)
def api_export_paper(request: ResearchPaperRequest) -> ResearchExportResponse:
    try:
        return build_research_export(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Research paper export failed: {exc}") from exc


@api_router.post("/export/pdf")
def api_export_pdf(request: ResearchPaperRequest):
    try:
        export_source = None
        sections = []

        if request.metadata and isinstance(request.metadata.get("sections"), list):
            from app.models.research_paper import ResearchPaperSection

            for section_data in request.metadata.get("sections"):
                sections.append(ResearchPaperSection(**section_data))
            paper_title = str((request.metadata or {}).get("paper_title") or request.paper_title or f"Research Paper: {request.topic}").strip()
            keywords = request.metadata.get("keywords") or []
            authors = str((request.metadata or {}).get("authors") or request.authors or "").strip() or None
        else:
            export_source = generate_research_paper(request)
            sections = export_source.sections
            paper_title = export_source.paper_title
            keywords = export_source.keywords
            authors = export_source.authors

        references = next((section for section in sections if section.id == "references"), None)
        content_sections = [section for section in sections if section.id != "references"]

        pdf_bytes = build_pdf_bytes(
            title=paper_title,
            keywords=keywords,
            authors=authors,
            sections=content_sections,
            references=references,
        )

        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"PDF export failed: {exc}") from exc