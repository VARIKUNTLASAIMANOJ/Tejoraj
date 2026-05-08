import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './SplashScreen.css';

const FULL_TEXT = 'Welcome to the TEJORAJ';
const TYPING_SPEED = 55;       // ms per character
const HOLD_AFTER_TYPE = 1200;  // ms to hold after text is fully typed
const FADE_OUT_DURATION = 0.8; // seconds

export default function SplashScreen({ onComplete }) {
    const [displayedText, setDisplayedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Typing effect
    useEffect(() => {
        let charIndex = 0;
        const interval = setInterval(() => {
            charIndex++;
            setDisplayedText(FULL_TEXT.slice(0, charIndex));
            if (charIndex >= FULL_TEXT.length) {
                clearInterval(interval);
                // Hold for a beat, then fade out
                setTimeout(() => {
                    setShowCursor(false);
                    setIsExiting(true);
                }, HOLD_AFTER_TYPE);
            }
        }, TYPING_SPEED);
        return () => clearInterval(interval);
    }, []);

    // After exit animation completes, notify parent
    const handleExitComplete = () => {
        onComplete?.();
    };

    return (
        <AnimatePresence onExitComplete={handleExitComplete}>
            {!isExiting && (
                <motion.div
                    className="splash-screen"
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: FADE_OUT_DURATION, ease: 'easeInOut' }}
                >
                    {/* Spinning Galaxy Background */}
                    <div className="splash-galaxy-container">
                        <div className="splash-galaxy" />
                    </div>

                    {/* Dark overlay for text readability */}
                    <div className="splash-overlay" />

                    {/* Particle dust */}
                    <div className="splash-particles">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={i}
                                className="splash-particle"
                                style={{
                                    '--x': `${Math.random() * 100}%`,
                                    '--y': `${Math.random() * 100}%`,
                                    '--size': `${1 + Math.random() * 2}px`,
                                    '--duration': `${2 + Math.random() * 4}s`,
                                    '--delay': `${Math.random() * 3}s`,
                                    '--opacity': `${0.3 + Math.random() * 0.7}`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Text Content */}
                    <div className="splash-content">
                        <motion.p
                            className="splash-text"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            {displayedText}
                            {showCursor && <span className="splash-cursor">|</span>}
                        </motion.p>

                        {/* Subtle subtitle that fades in */}
                        <motion.p
                            className="splash-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: displayedText.length > 20 ? 0.5 : 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            Initializing mission systems...
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
