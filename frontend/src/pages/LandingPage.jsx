import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Atom, Brain, FileText, Globe, Rocket, Satellite, Shield, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingNavbar from '../components/FloatingNavbar';
import SolarSystem from '../components/SolarSystem';
import SpaceAgentLogo from '../components/SpaceAgentLogo';
import { supabase } from '../lib/supabaseClient';
import './LandingPage.css';

/* ── Feature Cards (Sticky Stacked) ── */
const featureCards = [
    {
        label: 'NLP',
        labelColor: '#a855f7',
        title: 'Natural Language Processing',
        subtitle: 'Human-Level Understanding',
        description:
            'Advanced language comprehension that understands context, nuance, and intent across complex queries. Info to be added later.',
        icon: <Brain size={48} />,
    },
    {
        label: 'RETRIEVAL',
        labelColor: '#00d4ff',
        title: 'Intelligent Data Retrieval',
        subtitle: 'Precision Search',
        description:
            'Lightning-fast access to vast knowledge repositories with contextual relevance scoring. Info to be added later.',
        icon: <Zap size={48} />,
    },
    {
        label: 'REASONING',
        labelColor: '#10b981',
        title: 'Multi-Step Reasoning',
        subtitle: 'Chain of Thought',
        description:
            'Complex problem decomposition and logical reasoning across multi-hop inference chains. Info to be added later.',
        icon: <Shield size={48} />,
    },
    {
        label: 'ADAPTIVE',
        labelColor: '#f59e0b',
        title: 'Adaptive Learning',
        subtitle: 'Evolving Intelligence',
        description:
            'Continuously improving through interaction patterns and feedback loops. Info to be added later.',
        icon: <Sparkles size={48} />,
    },
];

/* ── Capability Cards (Horizontal Scroll) ── */
const capabilityCards = [
    {
        icon: <Brain size={32} />,
        title: 'Deep Analysis',
        subtitle: 'Contextual reasoning',
        color: '#a855f7',
    },
    {
        icon: <Globe size={32} />,
        title: 'Global Knowledge',
        subtitle: 'Cross-domain data',
        color: '#00d4ff',
    },
    {
        icon: <Shield size={32} />,
        title: 'Secure Pipeline',
        subtitle: 'Encrypted comms',
        color: '#10b981',
    },
    {
        icon: <Zap size={32} />,
        title: 'Real-Time',
        subtitle: 'Sub-second latency',
        color: '#f59e0b',
    },
    {
        icon: <Sparkles size={32} />,
        title: 'Auto Refinement',
        subtitle: 'Self-improving',
        color: '#ec4899',
    },
    {
        icon: <Rocket size={32} />,
        title: 'Mission Ready',
        subtitle: 'Production grade',
        color: '#ef4444',
    },
];

/* ── Sticky Card Component (NeoRing-style stacking) ── */
function StickyFeatureCard({ card, index, totalCards }) {
    const cardRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start 0.4', 'end start'],
    });

    // Previous cards scale down as user scrolls past them
    const isLast = index === totalCards - 1;
    const scale = useTransform(scrollYProgress, [0, 1], isLast ? [1, 1] : [1, 0.93]);
    const opacity = useTransform(scrollYProgress, [0, 1], isLast ? [1, 1] : [1, 0.6]);

    return (
        <div
            className="sticky-card-wrapper"
            ref={cardRef}
            style={{ '--card-index': index }}
        >
            <motion.div
                className="feature-card"
                style={{ scale, opacity, transformOrigin: 'center top' }}
            >
                <div className="feature-card-content">
                    <span className="feature-label" style={{ color: card.labelColor }}>
                        {card.label}
                    </span>
                    <h3 className="feature-title">{card.title}</h3>
                    <p className="feature-subtitle">{card.subtitle}</p>
                    <p className="feature-desc">{card.description}</p>
                </div>
                <div className="feature-card-visual">
                    <div className="feature-icon-ring" style={{ '--ring-color': card.labelColor }}>
                        {card.icon}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Horizontal Scroll Section (continuous marquee) ── */
function HorizontalScroll() {
    return (
        <section className="horizontal-section">
            <div className="horizontal-inner">
                <div className="horizontal-header">

                    <h2 className="horizontal-title">
                        Explore<br />
                        <span className="gradient-text">Capabilities.</span>
                    </h2>
                    <p className="horizontal-subtitle">
                        From data retrieval to intelligent reasoning, SpaceAgent delivers end-to-end AI capabilities.
                    </p>
                </div>

                <div className="horizontal-track-container">
                    <div className="horizontal-track marquee-track">
                        {/* First set */}
                        {capabilityCards.map((card, i) => (
                            <div className="capability-card" key={`a-${i}`}>
                                <div className="capability-icon" style={{ color: card.color }}>
                                    {card.icon}
                                </div>
                                <h4 className="capability-title">{card.title}</h4>
                                <p className="capability-subtitle">{card.subtitle}</p>
                            </div>
                        ))}
                        {/* Duplicate set for seamless loop */}
                        {capabilityCards.map((card, i) => (
                            <div className="capability-card" key={`b-${i}`}>
                                <div className="capability-icon" style={{ color: card.color }}>
                                    {card.icon}
                                </div>
                                <h4 className="capability-title">{card.title}</h4>
                                <p className="capability-subtitle">{card.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer';
                setUserName(name);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="landing-page">
            <SolarSystem />
            <FloatingNavbar />

            {/* ═══ HERO ═══ */}
            <section className="hero-section">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {/* Greeting */}
                    {userName && (
                        <motion.div
                            className="hero-greeting"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <span className="greeting-hey">Hey, {userName} 👋</span>
                            <span className="greeting-welcome">Welcome to</span>
                        </motion.div>
                    )}

                    <h1 className="hero-title">
                        {/* <span className="hero-title-line">Space</span> */}
                        <span className="hero-title-line gradient-text">Tejoraj</span>
                    </h1>
                    <p className="hero-tagline">
                        .The Sovereign of All Cosmic Radiance.
                    </p>
                    <p className="hero-description">
                        Advanced AI-powered exploration, real-time analysis, and<br />
                        human-centric reasoning — all from a single agent.
                    </p>

                    <div className="hero-buttons-row">
                        <motion.button
                            className="nav-cta explorer-cta hero-explorer-btn"
                            onClick={() => navigate('/explorer-transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Satellite size={16} />
                            <span>Space Explorer</span>
                        </motion.button>
                        <motion.button
                            className="nav-cta research-cta hero-research-btn"
                            onClick={() => navigate('/research-transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            <FileText size={16} />
                            <span>Create Research Paper</span>
                        </motion.button>
                    </div>

                    {/* <motion.button
                        className="hero-cta"
                        onClick={() => navigate('/chat')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <span>Start a Conversation</span>
                        <ArrowRight size={18} />
                    </motion.button> */}
                </motion.div>

                <div className="scroll-indicator">
                    <motion.div
                        className="scroll-line"
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="scroll-text">SCROLL</span>
                </div>
            </section>

            {/* ═══ STICKY STACKED FEATURES ═══ */}
            <section className="sticky-section" id="about">
                <div className="sticky-header">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >

                        <h2 className="sticky-title">
                            Always Analyzing.{' '}
                            <span className="gradient-text">Always Learning.</span>
                        </h2>
                    </motion.div>
                </div>

                <div className="sticky-cards-container">
                    {featureCards.map((card, i) => (
                        <StickyFeatureCard key={i} card={card} index={i} totalCards={featureCards.length} />
                    ))}
                </div>
            </section>

            {/* ═══ HORIZONTAL SCROLL CAPABILITIES ═══ */}
            <HorizontalScroll />

            {/* ═══ CTA SECTION ═══ */}
            <section className="cta-section">
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="cta-title">
                        Ready to explore<br />
                        <span className="gradient-text">the cosmos of data?</span>
                    </h2>
                    <motion.button
                        className="hero-cta"
                        onClick={() => navigate('/transition')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>Launch Agent</span>
                        <ArrowRight size={18} />
                    </motion.button>
                </motion.div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="landing-footer">
                <div className="footer-divider" />
                <div className="footer-content">
                    <div className="footer-brand">
                        <SpaceAgentLogo size={20} />
                        <span>Tejoraj</span>
                    </div>
                    <p className="footer-text">
                        © {new Date().getFullYear()} Tejoraj. Built for the future.
                    </p>
                </div>
            </footer>

            {/* ═══ FLOATING BLACK HOLE BUTTON (bottom-right) ═══ */}
            <motion.button
                className="bh-float-btn"
                onClick={() => navigate('/blackhole')}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                title="Black Hole Simulation"
            >
                <Atom size={22} className="bh-float-icon" />
                <span className="bh-float-label">Black Hole</span>
            </motion.button>
        </div>
    );
}
