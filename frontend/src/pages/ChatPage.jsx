import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../api/agent';
import { appendChatMessage, createChatSession, deleteChatSession, loadChatHistory } from '../api/chatHistory';
import ChatInput from '../components/ChatInput';
import ChatMessage, { TypingIndicator } from '../components/ChatMessage';
import ChatSidebar from '../components/ChatSidebar';
import FloatingNavbar from '../components/FloatingNavbar';
import SpinningEarth from '../components/SpinningEarth';
import { supabase } from '../lib/supabaseClient';
import './ChatPage.css';

export default function ChatPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);

    // Current session
    const activeSession = sessions.find((s) => s.id === activeId);
    const messages = activeSession?.messages || [];

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!supabase) {
                if (isMounted) {
                    setHistoryError('Supabase is not configured. Add frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
                    setIsLoadingHistory(false);
                }
                return;
            }

            try {
                setHistoryError('');
                const { sessions: loadedSessions, user } = await loadChatHistory();

                if (!isMounted) {
                    return;
                }

                if (!user) {
                    navigate('/login', { replace: true });
                    return;
                }

                setSessions(loadedSessions);
                setActiveId(loadedSessions[0]?.id || null);
            } catch (error) {
                if (isMounted) {
                    setHistoryError(error.message || 'Failed to load chat history.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingHistory(false);
                }
            }
        };

        load();

        const { data: authListener } = supabase?.auth?.onAuthStateChange?.((_event, session) => {
            if (!session?.user) {
                if (isMounted) {
                    setSessions([]);
                    setActiveId(null);
                    setIsLoadingHistory(false);
                    navigate('/login', { replace: true });
                }
                return;
            }

            load();
        }) || {};

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe?.();
        };
    }, [navigate]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Create new chat
    const handleNewChat = useCallback(async () => {
        setHistoryError('');
        try {
            const newSession = await createChatSession('');
            setSessions((prev) => [newSession, ...prev]);
            setActiveId(newSession.id);
        } catch (error) {
            setHistoryError(error.message || 'Failed to create a new chat.');
        }
    }, []);

    // Select session
    const handleSelectSession = useCallback((id) => {
        setActiveId(id);
    }, []);

    // Delete session
    const handleDeleteSession = useCallback(async (id) => {
        setHistoryError('');
        try {
            await deleteChatSession(id);
            setSessions((prev) => {
                const updated = prev.filter((s) => s.id !== id);
                if (id === activeId) {
                    setActiveId(updated.length > 0 ? updated[0].id : null);
                }
                return updated;
            });
        } catch (error) {
            setHistoryError(error.message || 'Failed to delete chat history.');
        }
    }, [activeId]);

    // Send message
    const handleSend = useCallback(async (text, options = {}) => {
        setHistoryError('');

        if (!supabase) {
            setHistoryError('Supabase is not configured. Add frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
            return;
        }

        // If no active session, create one
        let currentId = activeId;
        if (!currentId) {
            try {
                const newSession = await createChatSession('');
                setSessions((prev) => [newSession, ...prev]);
                currentId = newSession.id;
                setActiveId(currentId);
            } catch (error) {
                setHistoryError(error.message || 'Failed to create a new chat.');
                return;
            }
        }

        const userMsg = {
            role: 'user',
            content: text,
            timestamp: Date.now(),
        };

        // Add user message
        setSessions((prev) =>
            prev.map((s) =>
                s.id === currentId
                    ? {
                        ...s,
                        messages: [...s.messages, userMsg],
                        preview: text.slice(0, 60),
                        timestamp: Date.now(),
                    }
                    : s
            )
        );

        try {
            await appendChatMessage({
                sessionId: currentId,
                role: 'user',
                content: text,
                sources: [],
            });
        } catch (error) {
            setHistoryError(error.message || 'Failed to save user message.');
        }

        // Show typing indicator
        setIsTyping(true);

        try {
            const response = await sendMessage(text);

            const agentMsg = {
                role: 'agent',
                content: response.reply || response.message || response.answer || 'Transmission received.',
                sources: Array.isArray(response.sources) ? response.sources : [],
                timestamp: Date.now(),
            };

            try {
                await appendChatMessage({
                    sessionId: currentId,
                    role: 'agent',
                    content: agentMsg.content,
                    sources: agentMsg.sources,
                });
            } catch (error) {
                setHistoryError(error.message || 'Failed to save assistant response.');
            }

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === currentId
                        ? { ...s, messages: [...s.messages, agentMsg] }
                        : s
                )
            );
        } catch (err) {
            const errorMsg = {
                role: 'agent',
                content: '⚠️ Signal lost. Unable to reach mission control. Please try again.',
                timestamp: Date.now(),
            };

            try {
                await appendChatMessage({
                    sessionId: currentId,
                    role: 'agent',
                    content: errorMsg.content,
                    sources: [],
                });
            } catch {
                // Keep the on-screen fallback even if persistence fails.
            }

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === currentId
                        ? { ...s, messages: [...s.messages, errorMsg] }
                        : s
                )
            );
        } finally {
            setIsTyping(false);
        }
    }, [activeId]);

    return (
        <div className="chat-page">
            <SpinningEarth />

            {/* Atmospheric Background Glows (same as landing page) */}
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />

            <FloatingNavbar />

            {historyError ? (
                <div className="chat-history-error">
                    {historyError}
                </div>
            ) : null}

            <ChatSidebar
                sessions={sessions}
                activeId={activeId}
                onSelect={handleSelectSession}
                onNew={handleNewChat}
                onDelete={handleDeleteSession}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Chat Area */}
            <main className={`chat-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
                {isLoadingHistory ? (
                    <div className="chat-empty">
                        <motion.div
                            className="empty-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="empty-icon">🛰️</span>
                            <h2 className="empty-title">Loading Mission History</h2>
                            <p className="empty-text">
                                Fetching your private chat sessions from the database.
                            </p>
                        </motion.div>
                    </div>
                ) : messages.length === 0 && !isTyping ? (
                    <div className="chat-empty">
                        <motion.div
                            className="empty-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="empty-icon">🚀</span>
                            <h2 className="empty-title">Mission Briefing</h2>
                            <p className="empty-text">
                                Initiate contact with the agent by entering your query below.
                                <br />
                                All transmissions are logged and can be reviewed in the history panel.
                            </p>
                            {/* <div className="empty-hints">
                                <span className="hint-item" onClick={() => handleSend("What can you do?")}>
                                    💡 "What can you do?"
                                </span>
                                <span className="hint-item" onClick={() => handleSend("Tell me about yourself")}>
                                    🛸 "Tell me about yourself"
                                </span>
                                <span className="hint-item" onClick={() => handleSend("Help me with a task")}>
                                    ⚡ "Help me with a task"
                                </span>
                            </div> */}
                        </motion.div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <ChatMessage key={i} message={msg} />
                        ))}
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <ChatInput onSend={handleSend} disabled={isTyping} />
            </main>
        </div>
    );
}
