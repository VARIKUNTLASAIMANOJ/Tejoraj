import { AnimatePresence, motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileDown,
    FileText,
    Loader2,
    Plus,
    Sparkles,
    Trash2,
    UserPlus,
    Wand2,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportResearchPaper, generateResearchPaper, generateResearchSection } from '../api/research';
import FloatingNavbar from '../components/FloatingNavbar';
import './ResearchPaperPage.css';

/* ── Custom Image Component for Markdown Rendering ── */
function CustomImage({ src, alt }) {
    return (
        <div className="markdown-figure">
            <img src={src} alt={alt} className="markdown-image" onError={(e) => { e.target.style.display = 'none'; }} />
            {alt && <p className="figure-caption">{alt}</p>}
        </div>
    );
}

/* ── IEEE Section Numbering ── */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/* ── Default Sections (IEEE Structure) ── */
const DEFAULT_SECTIONS = [
    { id: 'abstract', title: 'Abstract', content: '', locked: true, noNumber: true },
    { id: 'introduction', title: 'Introduction', content: '', locked: true },
    { id: 'literature', title: 'Literature Review', content: '', locked: false },
    { id: 'methodology', title: 'Methodology', content: '', locked: false },
    { id: 'results', title: 'Results', content: '', locked: false },
    { id: 'discussion', title: 'Discussion', content: '', locked: false },
    { id: 'conclusion', title: 'Conclusion', content: '', locked: true },
    { id: 'references', title: 'References', content: '', locked: true, noNumber: true },
];

/* ── Author Entry ── */
function AuthorEntry({ author, index, onUpdate, onRemove, canRemove }) {
    return (
        <div className="author-entry">
            <div className="author-fields">
                <input
                    className="author-input"
                    placeholder="Author Name"
                    value={author.name}
                    onChange={(e) => onUpdate(index, 'name', e.target.value)}
                />
                <input
                    className="author-input author-affiliation"
                    placeholder="Affiliation (e.g., University)"
                    value={author.affiliation}
                    onChange={(e) => onUpdate(index, 'affiliation', e.target.value)}
                />
                <input
                    className="author-input author-email"
                    placeholder="Email"
                    value={author.email}
                    onChange={(e) => onUpdate(index, 'email', e.target.value)}
                />
            </div>
            {canRemove && (
                <button className="author-remove-btn" onClick={() => onRemove(index)} title="Remove author">
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

/* ── Section Card ── */
function SectionCard({ section, index, sectionNumber, onUpdate, onDelete, onGenerate, isGenerating }) {
    const [expanded, setExpanded] = useState(section.id === 'abstract' || section.id === 'introduction');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    return (
        <motion.div
            className="section-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            layout
        >
            <div className="section-header" onClick={() => setExpanded(!expanded)}>
                <div className="section-header-left">
                    <span className="section-label">
                        {section.noNumber ? '' : `${sectionNumber}. `}
                    </span>
                    <input
                        className="section-title-input"
                        value={section.title}
                        onChange={(e) => onUpdate(section.id, 'title', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Section Title"
                    />
                </div>
                <div className="section-header-right">
                    <motion.button
                        className="section-ai-btn"
                        onClick={(e) => { e.stopPropagation(); onGenerate(section.id); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isGenerating}
                        title="Generate with AI"
                    >
                        {isGenerating ? <Loader2 size={14} className="spin-icon" /> : <Wand2 size={14} />}
                        <span>Generate</span>
                    </motion.button>
                    {!section.locked && (
                        <button
                            className="section-delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
                            title="Remove section"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button className="section-toggle-btn">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="section-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {section.id === 'abstract' && (
                            <p className="section-hint">
                                150–250 words. Summarize the research question, methods, key results, and conclusions.
                            </p>
                        )}
                        {section.id === 'references' && (
                            <p className="section-hint">
                                Use IEEE citation style: [1] A. Author, "Title," Journal, vol. X, no. Y, pp. 1–10, Year.
                            </p>
                        )}
                        
                        {/* Mode Toggle */}
                        <div className="section-mode-toggle">
                            <button
                                className={`mode-btn ${!isPreviewMode ? 'active' : ''}`}
                                onClick={() => setIsPreviewMode(false)}
                            >
                                Edit
                            </button>
                            <button
                                className={`mode-btn ${isPreviewMode ? 'active' : ''}`}
                                onClick={() => setIsPreviewMode(true)}
                            >
                                Preview
                            </button>
                        </div>

                        {!isPreviewMode ? (
                            <>
                                <textarea
                                    className="section-textarea"
                                    value={section.content}
                                    onChange={(e) => onUpdate(section.id, 'content', e.target.value)}
                                    placeholder={`Write your ${section.title.toLowerCase()} here, or click "Generate" to let AI draft it...`}
                                    rows={section.id === 'abstract' ? 5 : 8}
                                />
                                <div className="section-footer">
                                    <span className="word-count">
                                        {section.content.trim() ? section.content.trim().split(/\s+/).length : 0} words
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="section-preview">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    className="markdown-content"
                                    components={{
                                        img: ({ node, ...props }) => <CustomImage {...props} />,
                                    }}
                                >
                                    {section.content || `*No content yet. Add text or click "Generate" to create content.*`}
                                </ReactMarkdown>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ResearchPaperPage() {
    const [topic, setTopic] = useState('');
    const [paperTitle, setPaperTitle] = useState('');
    const [paperSubtitle, setPaperSubtitle] = useState('');
    const [keywords, setKeywords] = useState('');
    const [authors, setAuthors] = useState([{ name: '', affiliation: '', email: '' }]);
    const [sections, setSections] = useState(DEFAULT_SECTIONS);
    const [generatingSection, setGeneratingSection] = useState(null);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isExporting, setIsExporting] = useState(null); // 'pdf' | 'doc' | null
    const previewRef = useRef(null);

    /* ── Author Management ── */
    const handleUpdateAuthor = useCallback((index, field, value) => {
        setAuthors(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
    }, []);

    const handleAddAuthor = useCallback(() => {
        setAuthors(prev => [...prev, { name: '', affiliation: '', email: '' }]);
    }, []);

    const handleRemoveAuthor = useCallback((index) => {
        setAuthors(prev => prev.filter((_, i) => i !== index));
    }, []);

    /* ── Section Management ── */
    const handleUpdateSection = useCallback((id, field, value) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    }, []);

    const handleDeleteSection = useCallback((id) => {
        setSections(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleAddSection = useCallback(() => {
        const newSection = { id: `custom-${Date.now()}`, title: 'New Section', content: '', locked: false };
        setSections(prev => {
            const refIdx = prev.findIndex(s => s.id === 'references');
            if (refIdx !== -1) { const copy = [...prev]; copy.splice(refIdx, 0, newSection); return copy; }
            return [...prev, newSection];
        });
    }, []);

    /* ── Build request payload ── */
    const buildRequestPayload = useCallback(
        (sectionId = null) => ({
            topic: topic.trim(),
            paper_title: paperTitle.trim() || undefined,
            authors: authors.filter(a => a.name.trim()).map(a => a.name.trim()).join(', ') || undefined,
            section_id: sectionId || undefined,
            mode: 'space_researcher',
            thinking_style: 'deep_thinking',
        }),
        [topic, paperTitle, authors]
    );

    const mergeGeneratedSections = useCallback((generatedSections) => {
        if (!Array.isArray(generatedSections) || generatedSections.length === 0) return;
        setSections(prev => {
            const map = new Map(generatedSections.filter(s => s?.id).map(s => [s.id, s]));
            const merged = prev.map(s => {
                const g = map.get(s.id);
                return g ? { ...s, title: g.title || s.title, content: g.content || s.content } : s;
            });
            const ids = new Set(prev.map(s => s.id));
            const extras = generatedSections.filter(s => s?.id && !ids.has(s.id));
            return [...merged, ...extras.map(s => ({ id: s.id, title: s.title || s.id, content: s.content || '', locked: false }))];
        });
    }, []);

    const buildExportPayload = useCallback(() => ({
        topic: topic.trim(),
        paper_title: paperTitle.trim() || undefined,
        authors: authors.filter(a => a.name.trim()).map(a => a.name.trim()).join(', ') || undefined,
        mode: 'space_researcher',
        thinking_style: 'deep_thinking',
        metadata: {
            paper_title: paperTitle.trim() || undefined,
            authors: authors.filter(a => a.name.trim()).map(a => a.name.trim()).join(', ') || undefined,
            keywords: keywords,
            sections: sections.map((section) => ({
                id: section.id,
                title: section.title,
                content: section.content,
            })),
        },
    }), [topic, paperTitle, authors, keywords, sections]);

    /* ── Generate single section ── */
    const handleGenerateSection = useCallback(async (sectionId) => {
        if (!topic.trim()) return;
        setErrorMessage('');
        setGeneratingSection(sectionId);
        try {
            const response = await generateResearchSection(buildRequestPayload(sectionId));
            const generated = response?.section;
            if (generated?.id) {
                setSections(prev => prev.map(s => s.id === generated.id
                    ? { ...s, title: generated.title || s.title, content: generated.content || s.content }
                    : s
                ));
            }
        } catch (error) {
            setErrorMessage(error.message || 'Failed to generate the section.');
        } finally {
            setGeneratingSection(null);
        }
    }, [topic, buildRequestPayload]);

    /* ── Generate entire paper ── */
    const handleGenerateAll = useCallback(async () => {
        if (!topic.trim()) return;
        setErrorMessage('');
        setIsGeneratingAll(true);
        try {
            const response = await generateResearchPaper(buildRequestPayload());
            if (response?.paper_title) setPaperTitle(response.paper_title);
            if (Array.isArray(response?.keywords) && response.keywords.length) {
                setKeywords(response.keywords.join(', '));
            }
            if (response?.authors) {
                const authorNames = typeof response.authors === 'string'
                    ? response.authors.split(',').map(n => ({ name: n.trim(), affiliation: '', email: '' }))
                    : [];
                if (authorNames.length) setAuthors(authorNames);
            }
            mergeGeneratedSections(response?.sections || []);
        } catch (error) {
            setErrorMessage(error.message || 'Failed to generate the research paper.');
        } finally {
            setGeneratingSection(null);
            setIsGeneratingAll(false);
        }
    }, [topic, buildRequestPayload, mergeGeneratedSections]);

    /* ══════════════════════════════════════════════
       Markdown to HTML Converter (for PDF/DOC export)
       ══════════════════════════════════════════════ */
    const markdownToHtml = useCallback((markdown) => {
        if (!markdown) return '';
        let html = markdown;

        // Convert markdown images to HTML with figure caption
        // ![Figure 1: Description](url) -> <figure>...<figcaption>...
        html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (match, alt, url) => {
            return `<div style="margin:16pt 0; text-align:center;">
                <img src="${url}" alt="${alt}" style="max-width:100%; max-height:400px; border-radius:4px; border:1px solid #999; margin-bottom:8pt;" onerror="this.style.display='none'"  />
                <p style="font-size:9pt; font-style:italic; color:#666; margin:0;">${alt}</p>
            </div>`;
        });

        // Convert markdown tables to HTML tables
        const tablePattern = /\|(.+)\n\|[-\s|:]+\n((?:\|.+\n?)*)/g;
        html = html.replace(tablePattern, (match) => {
            const lines = match.trim().split('\n');
            const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
            const rows = lines.slice(2).map(line =>
                line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
            ).filter(row => row.length > 0);

            let table = '<table style="border-collapse:collapse; margin:12pt 0; width:100%; font-size:9pt;">';
            table += '<tr style="background:rgba(168,85,247,0.1);">';
            table += headers.map(h => `<th style="border:1px solid #999; padding:6pt; text-align:left; font-weight:bold;">${h}</th>`).join('');
            table += '</tr>';
            rows.forEach((row, idx) => {
                table += `<tr style="background:${idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};">`;
                table += row.map(cell => `<td style="border:1px solid #999; padding:6pt;">${cell}</td>`).join('');
                table += '</tr>';
            });
            table += '</table>';
            return table;
        });

        // Convert **bold** to <strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Convert *italic* to <em>
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        return html;
    }, []);

    /* ══════════════════════════════════════════════
       IEEE-FORMATTED HTML (used for both exports)
       ══════════════════════════════════════════════ */
    const buildIEEEHtml = useCallback(() => {
        const title = paperTitle || topic || 'Untitled Research Paper';
        const subtitle = paperSubtitle || '';
        const authorHtml = authors
            .filter(a => a.name.trim())
            .map(a => `
                <div style="text-align:center; margin-bottom:4px;">
                    <span style="font-size:11pt;">${a.name}</span><br/>
                    <span style="font-size:9pt; font-style:italic;">${a.affiliation || ''}</span><br/>
                    <span style="font-size:9pt;">${a.email || ''}</span>
                </div>
            `).join('');

        let numberedIdx = 0;
        const sectionHtml = sections.map(s => {
            if (!s.content.trim() && s.id !== 'abstract') return '';
            let heading = '';
            if (s.id === 'abstract') {
                return `
                    <div style="margin-top:16pt;">
                        <p style="text-align:justify; font-size:9pt; line-height:1.6;">
                            <span style="font-style:italic; font-weight:bold;">Abstract—</span>${s.content.trim() || '[No abstract provided]'}
                        </p>
                        ${keywords ? `<p style="font-size:9pt; margin-top:6pt;"><span style="font-style:italic; font-weight:bold;">Index Terms—</span>${keywords}</p>` : ''}
                    </div>
                `;
            }
            if (s.id === 'references') {
                heading = `<h2 style="text-align:center; font-size:10pt; font-variant:small-caps; margin:18pt 0 8pt; font-weight:bold;">References</h2>`;
            } else {
                numberedIdx++;
                const roman = ROMAN[numberedIdx - 1] || numberedIdx;
                heading = `<h2 style="text-align:center; font-size:10pt; font-variant:small-caps; margin:18pt 0 8pt; font-weight:bold;">${roman}. ${s.title}</h2>`;
            }
            // Convert markdown content (including tables) to HTML
            const htmlContent = markdownToHtml(s.content);
            // Split by paragraphs if it's not a table
            let content = '';
            if (htmlContent.includes('<table')) {
                content = htmlContent;
            } else {
                content = s.content
                    .split('\n')
                    .filter(l => l.trim())
                    .map(l => `<p style="text-indent:0.25in; text-align:justify; font-size:10pt; line-height:2; margin:0 0 2pt;">${l}</p>`)
                    .join('');
            }
            return heading + content;
        }).join('');

        return `
            <div style="font-family:'Times New Roman', Times, serif; max-width:7.5in; margin:0 auto; padding:1in; color:#000; background:#fff;">
                <h1 style="text-align:center; font-size:24pt; font-weight:bold; margin-bottom:8pt; text-transform:uppercase;">
                    ${title}
                </h1>
                ${subtitle ? `<h2 style="text-align:center; font-size:14pt; font-weight:normal; font-style:italic; margin-bottom:16pt;">${subtitle}</h2>` : ''}
                <div style="display:flex; justify-content:center; gap:40px; flex-wrap:wrap; margin-bottom:20pt;">
                    ${authorHtml || '<div style="text-align:center; font-size:11pt;">[Author Name]</div>'}
                </div>
                <hr style="border:none; border-top:1px solid #000; margin:12pt 0;" />
                ${sectionHtml}
            </div>
        `;
    }, [paperTitle, paperSubtitle, topic, keywords, authors, sections, markdownToHtml]);

    /* ── Export as PDF ── */
    const handleExportPDF = useCallback(async () => {
        setIsExporting('pdf');
        try {
            const exportBundle = await exportResearchPaper(buildExportPayload());
            if (!exportBundle) {
                setErrorMessage('No export data received from server.');
                return;
            }
            if (!exportBundle.export_html) {
                setErrorMessage('Missing export_html in response. Server response: ' + JSON.stringify(exportBundle).substring(0, 200));
                return;
            }
            const container = document.createElement('div');
            container.innerHTML = exportBundle.export_html || buildIEEEHtml();
            document.body.appendChild(container);

            const opt = {
                margin: 0,
                filename: `${(paperTitle || topic || 'research-paper').replace(/\s+/g, '-').toLowerCase()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };

            await html2pdf().set(opt).from(container).save();
            document.body.removeChild(container);
        } catch (err) {
            console.error('PDF export error:', err);
            setErrorMessage('Failed to export PDF: ' + (err?.message || String(err)));
        } finally {
            setIsExporting(null);
        }
    }, [buildExportPayload, buildIEEEHtml, paperTitle, topic]);

    /* ── Export as DOC ── */
    const handleExportDOC = useCallback(async () => {
        setIsExporting('doc');
        try {
            const exportBundle = await exportResearchPaper(buildExportPayload());
            if (!exportBundle) {
                setErrorMessage('No export data received from server.');
                return;
            }
            if (!exportBundle.export_html) {
                setErrorMessage('Missing export_html in response. Server response: ' + JSON.stringify(exportBundle).substring(0, 200));
                return;
            }
            const htmlContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office"
                      xmlns:w="urn:schemas-microsoft-com:office:word"
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8" />
                    <style>
                        @page { margin: 1in; size: letter; }
                        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; color: #000; }
                        h1 { font-size: 24pt; text-align: center; text-transform: uppercase; font-weight: bold; }
                        h2 { font-size: 10pt; text-align: center; font-variant: small-caps; font-weight: bold; margin-top: 18pt; }
                        p { text-align: justify; margin: 0 0 2pt; text-indent: 0.25in; }
                    </style>
                </head>
                <body>
                    ${exportBundle.export_html}
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(paperTitle || topic || 'research-paper').replace(/\s+/g, '-').toLowerCase()}.doc`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('DOC export error:', err);
            setErrorMessage('Failed to export DOC: ' + (err?.message || String(err)));
        } finally {
            setIsExporting(null);
        }
    }, [buildExportPayload, paperTitle, topic]);

    /* ── Stats ── */
    const totalWords = sections.reduce(
        (acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0
    );

    /* ── Compute numbered section index ── */
    const getSectionNumber = (index) => {
        let numberedCount = 0;
        for (let i = 0; i <= index; i++) {
            if (!sections[i].noNumber) numberedCount++;
        }
        return ROMAN[numberedCount - 1] || numberedCount;
    };

    return (
        <div className="research-page">
            {/* Background layers */}
            <div className="research-bg-image" />
            <div className="research-bg-overlay" />
            <div className="research-bg-glow research-glow-1" />
            <div className="research-bg-glow research-glow-2" />
            <div className="research-bg-glow research-glow-3" />
            <div className="research-stars" />

            <FloatingNavbar />

            <main className="research-main">
                {/* ═══ Header / Title Page ═══ */}
                <motion.section
                    className="research-hero"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <div className="research-hero-icon">
                        <FileText size={32} />
                    </div>
                    <h1 className="research-hero-title">
                        IEEE Research Paper <span className="gradient-text">Generator</span>
                    </h1>
                    <p className="research-hero-subtitle">
                        Craft IEEE-formatted research papers with AI assistance.
                        Structured sections, proper formatting, and ready-to-export in PDF or DOC.
                    </p>

                    {errorMessage && (
                        <motion.div className="research-error-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {errorMessage}
                        </motion.div>
                    )}

                    {/* ── Topic & Title Fields ── */}
                    <div className="research-topic-form">
                        <div className="topic-input-wrapper">
                            <BookOpen size={18} className="topic-icon" />
                            <input
                                id="research-topic-input"
                                className="topic-input"
                                type="text"
                                placeholder="Enter your research topic..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                        <div className="meta-row">
                            <input
                                className="meta-input"
                                type="text"
                                placeholder="Paper Title"
                                value={paperTitle}
                                onChange={(e) => setPaperTitle(e.target.value)}
                            />
                            <input
                                className="meta-input"
                                type="text"
                                placeholder="Subtitle (optional)"
                                value={paperSubtitle}
                                onChange={(e) => setPaperSubtitle(e.target.value)}
                            />
                        </div>
                        <input
                            className="meta-input meta-keywords"
                            type="text"
                            placeholder="Index Terms / Keywords (comma-separated)"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                        />
                    </div>

                    {/* ── Authors ── */}
                    <div className="authors-section">
                        <div className="authors-header">
                            <h3 className="authors-label">Authors</h3>
                            <button className="author-add-btn" onClick={handleAddAuthor}>
                                <UserPlus size={14} /> Add Author
                            </button>
                        </div>
                        {authors.map((author, i) => (
                            <AuthorEntry
                                key={i}
                                author={author}
                                index={i}
                                onUpdate={handleUpdateAuthor}
                                onRemove={handleRemoveAuthor}
                                canRemove={authors.length > 1}
                            />
                        ))}
                    </div>
                </motion.section>

                {/* ═══ Actions Bar ═══ */}
                <motion.div className="research-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <div className="actions-left">
                        <span className="section-count"><FileText size={14} /> {sections.length} Sections</span>
                        <span className="total-words">{totalWords.toLocaleString()} words</span>
                    </div>
                    <div className="actions-right">
                        <motion.button className="action-btn add-btn" onClick={handleAddSection} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Plus size={16} /><span>Add Section</span>
                        </motion.button>
                        <motion.button
                            className="action-btn generate-all-btn"
                            onClick={handleGenerateAll}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={!topic.trim() || isGeneratingAll}
                        >
                            {isGeneratingAll ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                            <span>{isGeneratingAll ? 'Generating...' : 'Generate Paper'}</span>
                        </motion.button>

                        {/* Export buttons */}
                        <motion.button
                            className="action-btn export-btn export-pdf"
                            onClick={handleExportPDF}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isExporting === 'pdf'}
                        >
                            {isExporting === 'pdf' ? <Loader2 size={16} className="spin-icon" /> : <FileDown size={16} />}
                            <span>PDF</span>
                        </motion.button>
                        <motion.button
                            className="action-btn export-btn export-doc"
                            onClick={handleExportDOC}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isExporting === 'doc'}
                        >
                            {isExporting === 'doc' ? <Loader2 size={16} className="spin-icon" /> : <FileDown size={16} />}
                            <span>DOC</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* ═══ Formatting Guidelines ═══ */}
                <div className="format-guidelines">
                    <span>IEEE Format</span>
                    <span>•</span>
                    <span>Times New Roman, 12pt</span>
                    <span>•</span>
                    <span>Double-spaced</span>
                    <span>•</span>
                    <span>1" margins</span>
                    <span>•</span>
                    <span>Justified text</span>
                </div>

                {/* ═══ Sections List ═══ */}
                <div className="research-sections" ref={previewRef}>
                    <AnimatePresence>
                        {sections.map((section, i) => (
                            <SectionCard
                                key={section.id}
                                section={section}
                                index={i}
                                sectionNumber={section.noNumber ? '' : getSectionNumber(i)}
                                onUpdate={handleUpdateSection}
                                onDelete={handleDeleteSection}
                                onGenerate={handleGenerateSection}
                                isGenerating={generatingSection === section.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
