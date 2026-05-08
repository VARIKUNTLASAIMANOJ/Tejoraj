import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/TransitionPage.css';

const FULL_TEXT = 'Initializing Research Lab...';

export default function ResearchTransitionPage() {
    const navigate = useNavigate();
    const [displayedText, setDisplayedText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);

    /* Typewriter effect */
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < FULL_TEXT.length) {
                setDisplayedText(FULL_TEXT.slice(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 45);

        return () => clearInterval(interval);
    }, []);

    /* Blinking cursor */
    useEffect(() => {
        const blink = setInterval(() => setCursorVisible((v) => !v), 500);
        return () => clearInterval(blink);
    }, []);

    /* Navigate to research page after transition */
    useEffect(() => {
        const timeout = setTimeout(() => navigate('/research', { replace: true }), 1800);
        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="transition-page">
            {/* Background glows */}
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />
            {/* Subtle star particles */}
            <div className="transition-stars" />

            <motion.div
                className="transition-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <motion.p
                    className="transition-text"
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {displayedText}
                    <span className={`cursor ${cursorVisible ? '' : 'cursor-hidden'}`}>|</span>
                </motion.p>
            </motion.div>
        </div>
    );
}
