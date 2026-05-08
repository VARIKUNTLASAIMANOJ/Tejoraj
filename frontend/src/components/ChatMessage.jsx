import { motion } from 'framer-motion';
import './ChatMessage.css';

function renderInlineBold(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
        const match = part.match(/^\*\*([^*]+)\*\*$/);
        if (match) {
            return <strong key={`b-${idx}`}>{match[1]}</strong>;
        }
        return <span key={`t-${idx}`}>{part}</span>;
    });
}

function isTableLine(line) {
    return line.includes('|');
}

function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line) {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
}

function renderFormattedMessage(content) {
    const lines = String(content || '').split('\n');
    const blocks = [];

    let i = 0;
    while (i < lines.length) {
        const current = lines[i] || '';
        const next = lines[i + 1] || '';

        if (isTableLine(current) && isTableSeparator(next)) {
            const tableLines = [current, next];
            i += 2;

            while (i < lines.length && isTableLine(lines[i])) {
                tableLines.push(lines[i]);
                i += 1;
            }

            const header = parseTableRow(tableLines[0]);
            const rows = tableLines
                .slice(2)
                .filter((line) => line.trim())
                .map(parseTableRow)
                .filter((row) => row.length > 0);

            blocks.push(
                <div key={`tbl-wrap-${blocks.length}`} className="message-table-wrap">
                    <table className="message-table">
                        <thead>
                            <tr>
                                {header.map((cell, idx) => (
                                    <th key={`th-${idx}`}>{renderInlineBold(cell)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIdx) => (
                                <tr key={`tr-${rIdx}`}>
                                    {row.map((cell, cIdx) => (
                                        <td key={`td-${rIdx}-${cIdx}`}>{renderInlineBold(cell)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        blocks.push(
            <span key={`txt-${blocks.length}`}>
                {renderInlineBold(current)}
                {i < lines.length - 1 ? <br /> : null}
            </span>
        );
        i += 1;
    }

    return blocks;
}

export default function ChatMessage({ message }) {
    const isUser = message.role === 'user';
    const hasSources = !isUser && Array.isArray(message.sources) && message.sources.length > 0;

    return (
        <motion.div
            className={`chat-message ${isUser ? 'user-message' : 'agent-message'}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            {!isUser && (
                <div className="message-avatar">
                    <span className="avatar-icon">🛰️</span>
                </div>
            )}

            <div className={`message-bubble ${isUser ? 'user-bubble' : 'agent-bubble'}`}>
                <div className="message-text">{renderFormattedMessage(message.content)}</div>

                {hasSources && (
                    <div className="message-sources">
                        <p className="sources-title">Sources</p>
                        <ul className="sources-list">
                            {message.sources.map((source, idx) => (
                                <li key={`${source.url || source.title || 'source'}-${idx}`}>
                                    {source.url ? (
                                        <a
                                            className="source-link"
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {source.source ? `${source.source}: ` : ''}{source.title || source.url}
                                        </a>
                                    ) : (
                                        <span className="source-link source-link-disabled">
                                            {source.source ? `${source.source}: ` : ''}{source.title || 'Source'}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {isUser && (
                <div className="message-avatar user-avatar">
                    <span className="avatar-icon">👤</span>
                </div>
            )}
        </motion.div>
    );
}

/* ── Typing Indicator ── */
export function TypingIndicator() {
    return (
        <motion.div
            className="chat-message agent-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="message-avatar">
                <span className="avatar-icon">🛰️</span>
            </div>
            <div className="message-bubble agent-bubble typing-bubble">
                <div className="typing-dots">
                    <span className="dot" style={{ animationDelay: '0s' }} />
                    <span className="dot" style={{ animationDelay: '0.2s' }} />
                    <span className="dot" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        </motion.div>
    );
}
