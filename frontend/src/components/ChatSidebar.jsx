import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';
import './ChatSidebar.css';

export default function ChatSidebar({ sessions, activeId, onSelect, onNew, onDelete, isOpen, onToggle }) {
    return (
        <>
            {/* Toggle Button */}
            <motion.button
                className="sidebar-toggle glass-panel"
                onClick={onToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ left: isOpen ? '280px' : '0px' }}
            >
                {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </motion.button>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop overlay — visible on mobile via CSS */}
                        <motion.div
                            className="sidebar-backdrop"
                            onClick={onToggle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                        <motion.aside
                            className="chat-sidebar glass-panel"
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* Header */}
                            <div className="sidebar-header">
                                <h3 className="sidebar-title">
                                    <Clock size={16} />
                                    History
                                </h3>
                                <motion.button
                                    className="new-chat-btn"
                                    onClick={onNew}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Plus size={16} />
                                    New Chat
                                </motion.button>
                            </div>

                            {/* Session List */}
                            <div className="sidebar-sessions">
                                {sessions.length === 0 ? (
                                    <div className="no-sessions">
                                        <MessageSquare size={28} strokeWidth={1} />
                                        <p>No conversations yet</p>
                                        <span>Start a new chat to begin</span>
                                    </div>
                                ) : (
                                    sessions.map((session) => (
                                        <motion.div
                                            key={session.id}
                                            className={`session-item ${session.id === activeId ? 'active' : ''}`}
                                            onClick={() => onSelect(session.id)}
                                            whileHover={{ x: 4 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <div className="session-info">
                                                <MessageSquare size={14} />
                                                <span className="session-preview">
                                                    {session.preview || 'New conversation'}
                                                </span>
                                            </div>
                                            <div className="session-meta">
                                                <span className="session-time">
                                                    {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                                <button
                                                    className="session-delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(session.id);
                                                    }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
