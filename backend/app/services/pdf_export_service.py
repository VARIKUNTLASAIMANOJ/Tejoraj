from __future__ import annotations

import logging
import re
from io import BytesIO
from typing import Iterable

import requests
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from app.models.research_paper import ResearchPaperSection
from app.services.latex_export_service import (
    _clean_inline,
    _escape_html,
    _extract_figures,
)

logger = logging.getLogger(__name__)


def _download_image_to_bytes(url: str) -> BytesIO | None:
    try:
        resp = requests.get(
            url,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (SpaceAgent PDF Export)",
                "Accept": "image/*,*/*;q=0.8",
            },
        )
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").lower()
        if content_type and "image" not in content_type:
            logger.warning("URL did not return an image: %s (content-type=%s)", url, content_type)
            return None
        bio = BytesIO(resp.content)
        bio.seek(0)
        return bio
    except Exception as exc:
        logger.warning("Failed to download image %s: %s", url, exc)
        return None


def _strip_inline_citations(text: str) -> str:
    cleaned = text
    cleaned = re.sub(r"\(\s*arXiv:[^\)]*\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\[\s*arXiv:[^\]]*\]", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(arXiv:[A-Za-z0-9.\-vV]+)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def build_pdf_bytes(
    *,
    title: str,
    keywords: Iterable[str],
    authors: str | None,
    sections: list[ResearchPaperSection],
    references: ResearchPaperSection | None = None,
) -> bytes:
    buffer = BytesIO()

    # Document with 0.75in margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.85 * inch,
    )

    width = letter[0] - (0.9 + 0.9) * inch

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        alignment=TA_CENTER,
        fontSize=14,
        leading=18,
        spaceAfter=10,
    )
    author_style = ParagraphStyle(
        'Author',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=11,
        leading=14,
        spaceAfter=10,
    )
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        alignment=TA_CENTER,
        fontSize=11,
        leading=14,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        fontSize=10,
        leading=15,
        firstLineIndent=18,
        spaceAfter=7,
    )
    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=9,
        leading=11,
        spaceAfter=5,
        italic=True,
    )
    ref_style = ParagraphStyle(
        'Reference',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        fontSize=10,
        leading=14.5,
        leftIndent=18,
        spaceAfter=6,
    )

    story = []

    # Title + authors
    story.append(Paragraph(_escape_html(title), title_style))
    if authors:
        story.append(Paragraph(_escape_html(authors), author_style))
    story.append(Spacer(1, 6))

    # Abstract
    abstract = next((s for s in sections if s.id == 'abstract'), None)
    if abstract:
        abstract_text, _ = _extract_figures(abstract.content)
        cleaned = _strip_inline_citations(_clean_inline(abstract_text))
        story.append(Paragraph('<b>Abstract—</b> ' + _escape_html(cleaned), body_style))
        kw = ', '.join([k.strip() for k in keywords if k and k.strip()])
        if kw:
            story.append(Paragraph('<b>Index Terms—</b> ' + _escape_html(kw), body_style))
        story.append(Spacer(1, 12))

    # Content sections
    numbered_idx = 0
    for section in sections:
        if section.id in ('abstract', 'references'):
            continue
        numbered_idx += 1
        roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][numbered_idx - 1] if numbered_idx - 1 < 12 else str(numbered_idx)
        heading = f"{roman}. {section.title}"
        story.append(Paragraph(heading.upper(), heading_style))

        clean_text, figures = _extract_figures(section.content)
        cleaned = _strip_inline_citations(_clean_inline(clean_text))

        # Split into paragraphs
        for para in [p.strip() for p in cleaned.split('\n\n') if p.strip()]:
            # Detect math-like paragraph and render in italic block
            if para.startswith('$$') or para.startswith('$') or para.startswith('\\'):
                story.append(Paragraph(_escape_html(para), caption_style))
            else:
                story.append(Paragraph(_escape_html(para), body_style))

        # Add figures (attempt to download images)
        for fig in figures:
            img_bytes = _download_image_to_bytes(fig.get('url'))
            if img_bytes:
                try:
                    img = ImageReader(img_bytes)
                    iw, ih = img.getSize()
                    max_width = width * 0.92
                    scale = min(max_width / float(iw), 1.0)
                    rendered = Image(img_bytes, width=iw * scale, height=ih * scale)
                    rendered.hAlign = 'CENTER'
                    story.append(Spacer(1, 8))
                    story.append(KeepTogether([rendered, Paragraph(_escape_html(fig.get('caption', fig.get('title', ''))), caption_style)]))
                except Exception:
                    # Fallback to placeholder caption
                    story.append(Paragraph(_escape_html(fig.get('caption', fig.get('title', ''))), caption_style))
            else:
                # Placeholder box using Paragraph (ReportLab doesn't support arbitrary boxes easily without Flowables)
                story.append(Spacer(1, 6))
                story.append(Paragraph('[Figure: ' + _escape_html(fig.get('title', '')) + ']', caption_style))
                story.append(Paragraph(_escape_html(fig.get('caption', '')), caption_style))

        story.append(Spacer(1, 8))

    # References at end
    if references:
        story.append(PageBreak())
        story.append(Paragraph('References', heading_style))
        for idx, line in enumerate(references.content.splitlines(), start=1):
            clean_line = line.strip()
            if clean_line:
                story.append(Paragraph(f'[{idx}] ' + _escape_html(_strip_inline_citations(clean_line)), ref_style))

    # Build PDF
    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
