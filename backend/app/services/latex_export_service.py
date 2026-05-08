from __future__ import annotations

import re
from typing import Iterable

from app.models.research_paper import ResearchPaperSection


def _escape_latex(text: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    escaped = text
    for needle, replacement in replacements.items():
        escaped = escaped.replace(needle, replacement)
    return escaped


def _escape_html(text: str) -> str:
    """Escape text for HTML output."""
    replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }
    escaped = text
    for needle, replacement in replacements.items():
        escaped = escaped.replace(needle, replacement)
    return escaped


def _extract_figures(text: str) -> tuple[str, list[dict]]:
    """
    Extract figure references from markdown (![...](url)) format.
    Returns cleaned text and list of figure dicts with title and caption.
    """
    figures = []
    
    # Match markdown images: ![alt text](url)
    pattern = r"!\[Figure\s+(\d+):\s*([^\]]+)\]\(([^)]+)\)"
    
    def replace_figure(match):
        fig_num = match.group(1)
        fig_title = match.group(2).strip()
        fig_url = match.group(3).strip()
        
        figures.append({
            "number": int(fig_num),
            "title": fig_title,
            "url": fig_url,
            "caption": f"Fig. {fig_num}: {fig_title}"
        })
        
        # Return empty to remove from content
        return ""
    
    # Remove markdown image syntax and collect figures
    cleaned = re.sub(pattern, replace_figure, text)
    
    # Also match italic figure captions that follow images: *Figure X: caption text*
    caption_pattern = r"\*Figure\s+(\d+):\s*([^*]+)\*"
    def update_caption(match):
        fig_num = int(match.group(1))
        caption_text = match.group(2).strip()
        
        # Update the figure with the full caption text
        for fig in figures:
            if fig["number"] == fig_num:
                fig["caption"] = f"Fig. {fig_num}: {caption_text}"
                break
        
        return ""
    
    cleaned = re.sub(caption_pattern, update_caption, cleaned)
    
    # Clean up extra blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    
    return cleaned.strip(), sorted(figures, key=lambda x: x["number"])


def _clean_inline(text: str) -> str:
    """Clean inline markdown and format content for proper display."""
    cleaned = text.strip()
    
    # Remove markdown headings
    cleaned = re.sub(r"(?m)^#{1,6}\s*", "", cleaned)
    
    # Remove markdown bold/italic markers
    cleaned = cleaned.replace("**", "")
    cleaned = cleaned.replace("__", "")
    cleaned = cleaned.replace("*", "")
    cleaned = cleaned.replace("_", "")
    
    # Remove markdown links but keep text: [text](url) -> text
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    
    # Remove standalone arXiv references that appear on their own lines
    cleaned = re.sub(r"\(\s*arXiv:[^\)]*\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*\(arXiv:[^\)]+\)\s*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*arXiv:[^\s]+\s*$", "", cleaned, flags=re.MULTILINE)
    
    # Clean up parenthetical escapes
    cleaned = cleaned.replace(r"\(", "").replace(r"\)", "")
    cleaned = cleaned.replace(r"\[", "").replace(r"\]", "")
    
    # Handle superscripts and subscripts
    cleaned = re.sub(r"\^\{([^{}]+)\}", r"^\1", cleaned)
    cleaned = re.sub(r"_\{([^{}]+)\}", r"_\1", cleaned)
    
    # Replace common LaTeX symbols
    cleaned = cleaned.replace(r"\times", " x ")
    cleaned = cleaned.replace(r"\cdot", " · ")
    cleaned = cleaned.replace(r"\rightarrow", "→")
    cleaned = cleaned.replace(r"\leftarrow", "←")
    cleaned = cleaned.replace(r"\approx", "≈")
    
    # Clean excessive whitespace
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    
    return cleaned.strip()


def build_ieee_latex_document(
    *,
    title: str,
    keywords: Iterable[str],
    authors: str | None,
    sections: list[ResearchPaperSection],
    references: ResearchPaperSection | None = None,
) -> str:
    keyword_text = ", ".join([item.strip() for item in keywords if item and item.strip()])
    author_text = authors.strip() if authors else "SpaceAgent"

    latex_parts: list[str] = [
        r"\documentclass[conference]{IEEEtran}",
        r"\usepackage{cite}",
        r"\usepackage{graphicx}",
        r"\usepackage{url}",
        r"\usepackage{amsmath,amssymb}",
        r"\usepackage{booktabs}",
        r"\begin{document}",
        rf"\title{{{_escape_latex(title)}}}",
        rf"\author{{{_escape_latex(author_text)}}}",
        r"\maketitle",
    ]

    abstract_section = next((section for section in sections if section.id == "abstract"), None)
    if abstract_section:
        abstract_content, _ = _extract_figures(abstract_section.content)
        latex_parts.extend(
            [
                r"\begin{abstract}",
                _escape_latex(_clean_inline(abstract_content)),
                r"\end{abstract}",
            ]
        )

    if keyword_text:
        latex_parts.append(rf"\begin{{IEEEkeywords}}{_escape_latex(keyword_text)}\end{{IEEEkeywords}}")

    # Process all sections except abstract and references
    for section in sections:
        if section.id == "abstract" or section.id == "references":
            continue
        
        # Extract figures from content
        clean_content, figures = _extract_figures(section.content)
        
        latex_parts.append(rf"\section{{{_escape_latex(section.title)}}}")
        latex_parts.append(_escape_latex(_clean_inline(clean_content)))
        
        # Add figure captions after section content
        for fig in figures:
            latex_parts.append(f"\n\\textit{{{fig['caption']}}}\n")

    # References section at the very end
    if references:
        latex_parts.append(r"\section{References}")
        latex_parts.append(r"\begin{thebibliography}{99}")
        for index, line in enumerate(references.content.splitlines(), start=1):
            clean_line = line.strip()
            if clean_line:
                latex_parts.append(rf"\bibitem{{ref{index}}} {_escape_latex(clean_line)}")
        latex_parts.append(r"\end{thebibliography}")

    latex_parts.append(r"\end{document}")
    return "\n\n".join(latex_parts)


def build_ieee_export_html(
    *,
    title: str,
    keywords: Iterable[str],
    authors: str | None,
    sections: list[ResearchPaperSection],
    references: ResearchPaperSection | None = None,
) -> str:
    """
    Build clean, valid HTML for PDF export that html2pdf can render properly.
    Generates IEEE-compliant formatting.
    """
    keyword_text = ", ".join([item.strip() for item in keywords if item and item.strip()])
    author_text = authors.strip() if authors else "[Author Name]"

    # Start with minimal, clean HTML structure
    html = ['<!DOCTYPE html>']
    html.append('<html>')
    html.append('<head>')
    html.append('<meta charset="UTF-8">')
    html.append('<style>')
    html.append("""
    @page {
        size: letter;
        margin: 0.75in;
    }
    * {
        margin: 0;
        padding: 0;
    }
    body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
        line-height: 1.8;
        color: #000;
        text-align: justify;
    }
    h1 {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin-bottom: 12pt;
        page-break-after: avoid;
    }
    h2 {
        font-size: 11pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-top: 16pt;
        margin-bottom: 8pt;
        page-break-after: avoid;
    }
    .author {
        text-align: center;
        font-size: 11pt;
        margin-bottom: 16pt;
    }
    .hr-line {
        border: none;
        border-top: 1.5pt solid #000;
        margin: 12pt 0;
    }
    .abstract-section {
        margin-top: 12pt;
        margin-bottom: 16pt;
    }
    p {
        text-align: justify;
        text-indent: 0.25in;
        margin: 0 0 8pt 0;
        orphans: 3;
        widows: 3;
    }
    .figure {
        margin: 12pt 0;
        text-align: center;
        page-break-inside: avoid;
    }
    .figure img {
        max-width: 90%;
        height: auto;
        margin: 8pt 0;
        border: 1px solid #ccc;
    }
    .figure-caption {
        font-size: 9pt;
        font-style: italic;
        margin: 4pt 0;
    }
    .equation {
        display: block;
        margin: 8pt 0;
        text-align: center;
        font-style: italic;
        background: #f9f9f9;
        padding: 8pt;
        border-radius: 4pt;
    }
    .references {
        page-break-before: always;
    }
    .reference {
        text-align: justify;
        text-indent: -0.25in;
        margin-left: 0.25in;
        margin-bottom: 6pt;
        font-size: 10pt;
    }
    sup {
        font-size: 8pt;
    }
    """)
    html.append('</style>')
    html.append('</head>')
    html.append('<body>')

    # Title
    html.append(f'<h1>{_escape_html(title)}</h1>')
    
    # Authors
    html.append(f'<div class="author">{_escape_html(author_text)}</div>')
    
    # HR
    html.append('<hr class="hr-line">')

    # Abstract section
    abstract_section = next((section for section in sections if section.id == "abstract"), None)
    if abstract_section:
        abstract_content, _ = _extract_figures(abstract_section.content)
        abstract_text = _clean_inline(abstract_content)
        html.append('<div class="abstract-section">')
        html.append(f'<p><strong>Abstract—</strong>{_escape_html(abstract_text)}')
        if keyword_text:
            html.append('</p>')
            html.append(f'<p><strong>Index Terms—</strong>{_escape_html(keyword_text)}')
        html.append('</p>')
        html.append('</div>')

    # Content sections
    numbered_idx = 0
    for section in sections:
        if section.id in ["abstract", "references"]:
            continue
        
        clean_content, figures = _extract_figures(section.content)
        clean_text = _clean_inline(clean_content)
        
        numbered_idx += 1
        roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][numbered_idx - 1] if numbered_idx - 1 < 12 else str(numbered_idx)
        
        html.append(f'<h2>{roman}. {_escape_html(section.title)}</h2>')
        
        # Split text into paragraphs and handle equations
        for paragraph in clean_text.split('\n\n'):
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            # Check if this is an equation (starts with common math symbols)
            if paragraph.startswith(('$', '\\', 'γ', 'σ', 'Σ', '∫')):
                # Render as equation block
                html.append(f'<div class="equation">{_escape_html(paragraph)}</div>')
            else:
                # Regular paragraph
                html.append(f'<p>{_escape_html(paragraph)}</p>')
        
        # Add figures after section
        if figures:
            for fig in figures:
                html.append('<div class="figure">')
                # Use a placeholder or simple text since external URLs don't work in html2pdf
                html.append(f'<div style="background:#e0e0e0; padding:20pt; text-align:center; border:1px solid #999; color:#666;">[Figure: {_escape_html(fig["title"])}]</div>')
                html.append(f'<div class="figure-caption">{_escape_html(fig["caption"])}</div>')
                html.append('</div>')

    # References section
    if references:
        html.append('<div class="references">')
        html.append('<h2>REFERENCES</h2>')
        for idx, line in enumerate(references.content.splitlines(), start=1):
            clean_line = line.strip()
            if clean_line:
                html.append(f'<div class="reference">[{idx}] {_escape_html(clean_line)}</div>')
        html.append('</div>')

    html.append('</body>')
    html.append('</html>')

    return '\n'.join(html)
