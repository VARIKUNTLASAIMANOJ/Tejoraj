import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import './ChatInput.css';

const AGENT_ROLES = [
    { value: 'space-researcher', label: '🔬 Space Researcher', icon: '🔬' },
    { value: 'space-scientist', label: '🧪 Space Scientist', icon: '🧪' },
    { value: 'astronaut', label: '🧑‍🚀 Astronaut', icon: '🧑‍🚀' },
    { value: 'mission-commander', label: '🎖️ Mission Commander', icon: '🎖️' },
    { value: 'astrophysicist', label: '🌌 Astrophysicist', icon: '🌌' },
];

const THINKING_MODES = [
    { value: 'deep-thinking', label: '🧠 Deep Thinking', icon: '🧠' },
    { value: 'analytical-thinking', label: '📊 Analytical Thinking', icon: '📊' },
    // { value: 'creative-thinking', label: '💡 Creative Thinking', icon: '💡' },
    // { value: 'critical-thinking', label: '🔍 Critical Thinking', icon: '🔍' },
    // { value: 'strategic-thinking', label: '♟️ Strategic Thinking', icon: '♟️' },
];

export default function ChatInput({ onSend, disabled }) {
    const [value, setValue] = useState('');
    const [agentRole, setAgentRole] = useState('space-researcher');
    const [thinkingMode, setThinkingMode] = useState('deep-thinking');
    const [roleOpen, setRoleOpen] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const textareaRef = useRef(null);
    const roleRef = useRef(null);
    const modeRef = useRef(null);

    const canSend = value.trim().length > 0 && !disabled;

    const selectedRole = AGENT_ROLES.find((r) => r.value === agentRole);
    const selectedMode = THINKING_MODES.find((m) => m.value === thinkingMode);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [value]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (roleRef.current && !roleRef.current.contains(e.target)) setRoleOpen(false);
            if (modeRef.current && !modeRef.current.contains(e.target)) setModeOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!canSend) return;
        onSend(value.trim(), { agentRole, thinkingMode });
        setValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input-wrapper">
            <div className="chat-input-container glass-panel">
                <div className="input-glow-border" />
                <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    placeholder="Enter your query to mission control..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={disabled}
                />
                <motion.button
                    className={`transmit-btn ${canSend ? 'active' : ''}`}
                    onClick={handleSubmit}
                    disabled={!canSend}
                    whileHover={canSend ? { scale: 1.08 } : {}}
                    whileTap={canSend ? { scale: 0.92 } : {}}
                >
                    <span className="transmit-text">TRANSMIT</span>
                </motion.button>
            </div>

            {/* ── Dropdown Selectors ── */}
            <div className="chat-dropdowns-row">
                {/* Agent Role Dropdown */}
                <div className="dropdown-wrapper" ref={roleRef}>
                    <motion.button
                        className={`dropdown-trigger ${roleOpen ? 'open' : ''}`}
                        onClick={() => { setRoleOpen(!roleOpen); setModeOpen(false); }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span className="dropdown-icon">{selectedRole?.icon}</span>
                        <span className="dropdown-label">{selectedRole?.label.replace(selectedRole?.icon + ' ', '')}</span>
                        <span className={`dropdown-chevron ${roleOpen ? 'rotated' : ''}`}>▾</span>
                    </motion.button>
                    {roleOpen && (
                        <motion.ul
                            className="dropdown-menu"
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            {AGENT_ROLES.map((role) => (
                                <li
                                    key={role.value}
                                    className={`dropdown-item ${agentRole === role.value ? 'selected' : ''}`}
                                    onClick={() => { setAgentRole(role.value); setRoleOpen(false); }}
                                >
                                    <span className="dropdown-item-icon">{role.icon}</span>
                                    <span>{role.label.replace(role.icon + ' ', '')}</span>
                                    {agentRole === role.value && <span className="dropdown-check">✓</span>}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </div>

                {/* Thinking Mode Dropdown */}
                <div className="dropdown-wrapper" ref={modeRef}>
                    <motion.button
                        className={`dropdown-trigger ${modeOpen ? 'open' : ''}`}
                        onClick={() => { setModeOpen(!modeOpen); setRoleOpen(false); }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span className="dropdown-icon">{selectedMode?.icon}</span>
                        <span className="dropdown-label">{selectedMode?.label.replace(selectedMode?.icon + ' ', '')}</span>
                        <span className={`dropdown-chevron ${modeOpen ? 'rotated' : ''}`}>▾</span>
                    </motion.button>
                    {modeOpen && (
                        <motion.ul
                            className="dropdown-menu"
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            {THINKING_MODES.map((mode) => (
                                <li
                                    key={mode.value}
                                    className={`dropdown-item ${thinkingMode === mode.value ? 'selected' : ''}`}
                                    onClick={() => { setThinkingMode(mode.value); setModeOpen(false); }}
                                >
                                    <span className="dropdown-item-icon">{mode.icon}</span>
                                    <span>{mode.label.replace(mode.icon + ' ', '')}</span>
                                    {thinkingMode === mode.value && <span className="dropdown-check">✓</span>}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </div>
            </div>

            <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
    );
}
