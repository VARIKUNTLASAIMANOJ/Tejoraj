import { motion } from 'framer-motion';
import {
    ArrowRight,
    BookOpen,
    Brain,
    Database,
    Eye,
    FileText,
    Globe,
    MessageCircle,
    Newspaper,
    Satellite,
    Search,
    Shield,
    Sparkles,
    Star,
    Telescope,
    Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FloatingNavbar from '../components/FloatingNavbar';
import SpaceAgentLogo from '../components/SpaceAgentLogo';
import './AboutPage.css';

/* ── Core Capabilities ── */
const capabilities = [
    {
        icon: <Telescope size={28} />,
        title: 'Space-Focused Intelligence',
        desc: 'Purpose-built for space science. Tejoraj pulls from NASA databases, arXiv preprints, and satellite telemetry — not generic web scraping.',
    },
    {
        icon: <FileText size={28} />,
        title: 'IEEE Paper Generator',
        desc: 'Draft complete IEEE-formatted research papers with Title Page, Abstract, all standard sections, and export directly to PDF or DOC.',
    },
    {
        icon: <Brain size={28} />,
        title: 'Deep Reasoning Engine',
        desc: 'Multi-agent reasoning with configurable thinking styles — from surface-level summaries to deep analytical chains of thought.',
    },
    {
        icon: <Database size={28} />,
        title: 'Real-Time Data Pipelines',
        desc: 'Live feeds from NASA APIs, CelesTrak TLE data, and arXiv scholarly databases. No stale training cutoffs.',
    },
    {
        icon: <Search size={28} />,
        title: 'Source-Cited Responses',
        desc: 'Every answer includes traceable sources — NASA publications, arXiv papers, and mission datasets you can verify.',
    },
    {
        icon: <Shield size={28} />,
        title: 'Mission-Grade Accuracy',
        desc: 'Tuned for scientific precision. Tejoraj prioritizes factual accuracy over fluent but speculative responses.',
    },
    {
        icon: <Eye size={28} />,
        title: 'Space Explorer Dashboard',
        desc: 'Daily NASA APOD imagery, 3D interactive solar system via NASA Eyes, and live space news — all in one immersive dashboard.',
    },
    {
        icon: <Satellite size={28} />,
        title: 'Live Space News',
        desc: 'Aggregated real-time space news from industry sources — launches, discoveries, missions, and cosmic events updated continuously.',
    },
];

/* ── Comparison Table Data ── */
const comparisonFeatures = [
    {
        feature: 'Space Science Focus',
        tejoraj: 'Purpose-built for space science & astrophysics',
        chatgpt: 'General-purpose, no domain focus',
        claude: 'General-purpose, no domain focus',
        gemini: 'General-purpose with Google integration',
        perplexity: 'General search engine with AI',
    },
    {
        feature: 'Data Sources',
        tejoraj: 'NASA APIs, arXiv, CelesTrak TLE, satellite feeds',
        chatgpt: 'Training data (cutoff date) + web browsing',
        claude: 'Training data (cutoff date)',
        gemini: 'Google Search + training data',
        perplexity: 'Web search aggregation',
    },
    {
        feature: 'Research Paper Generation',
        tejoraj: 'Full IEEE-format papers with PDF & DOC export',
        chatgpt: 'Can draft text, no structured paper builder',
        claude: 'Can draft text, no structured paper builder',
        gemini: 'Basic text drafting only',
        perplexity: 'No paper generation',
    },
    {
        feature: 'Source Citations',
        tejoraj: 'Every response with NASA/arXiv source links',
        chatgpt: 'Sometimes with web browsing enabled',
        claude: 'No live source citations',
        gemini: 'Links to Google results',
        perplexity: 'Inline web citations',
    },
    {
        feature: 'Real-Time Space Data',
        tejoraj: 'Live NASA feeds, TLE, APOD, NEO tracking',
        chatgpt: 'No real-time space data',
        claude: 'No real-time data access',
        gemini: 'Limited through Google',
        perplexity: 'Generic web results only',
    },
    {
        feature: 'Thinking Modes',
        tejoraj: 'Configurable: deep thinking, analytical, creative',
        chatgpt: 'Single reasoning mode',
        claude: 'Extended thinking (limited)',
        gemini: 'Single reasoning mode',
        perplexity: 'Single reasoning mode',
    },
    {
        feature: 'Agent Personas',
        tejoraj: 'Space Researcher, Mission Analyst, Astrophysicist',
        chatgpt: 'Custom GPTs (separate setup)',
        claude: 'No built-in personas',
        gemini: 'No built-in personas',
        perplexity: 'No personas',
    },
    {
        feature: 'Target Audience',
        tejoraj: 'Researchers, students, space enthusiasts',
        chatgpt: 'General public',
        claude: 'Developers & writers',
        gemini: 'Google ecosystem users',
        perplexity: 'Information seekers',
    },
    {
        feature: '3D Space Visuals',
        tejoraj: 'Embedded NASA Eyes — Solar System, Earth & Asteroids',
        chatgpt: 'No visual tools',
        claude: 'No visual tools',
        gemini: 'Google Earth (separate)',
        perplexity: 'No visual tools',
    },
    {
        feature: 'Space News Feed',
        tejoraj: 'Live curated space news with sources & timestamps',
        chatgpt: 'No news feed',
        claude: 'No news feed',
        gemini: 'Google News (separate)',
        perplexity: 'Generic web search only',
    },
    {
        feature: 'Daily Space Imagery',
        tejoraj: 'NASA APOD with date navigation & HD views',
        chatgpt: 'No image features',
        claude: 'No image features',
        gemini: 'No daily imagery',
        perplexity: 'No image features',
    },
];

/* ── Fade-in animation ── */
const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7 },
};

export default function AboutPage() {
    const navigate = useNavigate();

    return (
        <div className="about-page">
            {/* Background */}
            <div className="about-bg-image" />
            <div className="about-bg-overlay" />
            <div className="about-stars" />
            <div className="about-glow about-glow-1" />
            <div className="about-glow about-glow-2" />

            <FloatingNavbar />

            <main className="about-main">
                {/* ═══ HERO ═══ */}
                <motion.section className="about-hero" {...fadeUp}>
                    <div className="about-hero-badge">
                        <SpaceAgentLogo size={22} />
                        <span>About Tejoraj</span>
                    </div>

                    <h1 className="about-hero-title">
                        <span className="about-acronym">T</span>ranscendent{' '}
                        <span className="about-acronym">E</span>xtraterrestrial{' '}
                        <span className="about-acronym">J</span>ournal of{' '}
                        <span className="about-acronym">O</span>rbital{' '}
                        <span className="about-acronym">R</span>esearch,{' '}
                        <span className="about-acronym">A</span>nalysis &{' '}
                        <span className="about-acronym">J</span>ourney
                    </h1>

                    <p className="about-hero-subtitle">
                        Tejoraj is a specialized AI platform engineered exclusively for space science
                        exploration, orbital research, and astrophysical analysis. From real-time APOD imagery
                        and 3D solar system exploration to IEEE paper generation — every component is
                        purpose-built for the cosmos.
                    </p>
                </motion.section>

                {/* ═══ WHAT IS TEJORAJ ═══ */}
                <motion.section className="about-section" {...fadeUp}>
                    <div className="about-section-header">
                        <Globe size={20} className="section-icon" />
                        <h2>What is Tejoraj?</h2>
                    </div>
                    <div className="about-text-block">
                        <p>
                            <strong>TEJORAJ</strong> — <em>Transcendent Extraterrestrial Journal of Orbital
                            Research, Analysis & Journey</em> — is an advanced AI-powered platform that
                            combines real-time space data, scholarly research, and multi-agent reasoning
                            to serve as your definitive space science companion.
                        </p>
                        <p>
                            Powered by a network of specialized agents, Tejoraj ingests live NASA mission
                            feeds, arXiv preprints, CelesTrak satellite tracking data, and Near-Earth Object
                            catalogs. It then synthesizes this information through configurable reasoning
                            pipelines — enabling everything from quick factual lookups to deep analytical
                            research paper generation.
                        </p>
                        <p>
                            Whether you're an astrophysics researcher drafting an IEEE paper, a student
                            exploring orbital mechanics, or a space enthusiast curious about the latest
                            Mars rover findings — Tejoraj is built to answer with precision, evidence,
                            and traceable sources.
                        </p>
                    </div>
                </motion.section>

                {/* ═══ CORE CAPABILITIES ═══ */}
                <motion.section className="about-section" {...fadeUp}>
                    <div className="about-section-header">
                        <Sparkles size={20} className="section-icon" />
                        <h2>Core Capabilities</h2>
                    </div>
                    <div className="capabilities-grid">
                        {capabilities.map((cap, i) => (
                            <motion.div
                                key={i}
                                className="capability-item"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                            >
                                <div className="capability-icon">{cap.icon}</div>
                                <h3>{cap.title}</h3>
                                <p>{cap.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* ═══ PLATFORM FEATURES ═══ */}
                <motion.section className="about-section" {...fadeUp}>
                    <div className="about-section-header">
                        <Zap size={20} className="section-icon" />
                        <h2>Platform Features</h2>
                    </div>
                    <div className="features-list">
                        <div className="feature-row">
                            <MessageCircle size={18} />
                            <div>
                                <strong>AI Chat Agent</strong> — Conversational interface with multiple agent modes
                                (Space Researcher, Mission Analyst, Astrophysicist). Get source-cited answers to
                                any space science question with configurable reasoning depth.
                            </div>
                        </div>
                        <div className="feature-row">
                            <FileText size={18} />
                            <div>
                                <strong>IEEE Research Paper Generator</strong> — Build complete academic papers
                                with proper structure: Title Page, Abstract, Introduction, Literature Review,
                                Methodology, Results, Discussion, Conclusion, and References. Export to PDF or DOC.
                            </div>
                        </div>
                        <div className="feature-row">
                            <Database size={18} />
                            <div>
                                <strong>Live Data Integration</strong> — Real-time connections to NASA's API suite
                                (APOD, NEO, Mars Rover Photos, EPIC), arXiv scholarly database, and CelesTrak
                                satellite TLE feeds. No stale training data — always current information.
                            </div>
                        </div>
                        <div className="feature-row">
                            <BookOpen size={18} />
                            <div>
                                <strong>Source Transparency</strong> — Every response includes traceable citations
                                to NASA publications, arXiv papers, and mission datasets. Verify any claim with
                                a single click.
                            </div>
                        </div>
                        <div className="feature-row">
                            <Eye size={18} />
                            <div>
                                <strong>Space Explorer Dashboard</strong> — Immersive visual hub featuring NASA's
                                Astronomy Picture of the Day with date navigation, embedded NASA Eyes 3D interactive
                                views (Solar System, Earth, Asteroids), and a live space news feed aggregated from
                                top space industry sources.
                            </div>
                        </div>
                        <div className="feature-row">
                            <Newspaper size={18} />
                            <div>
                                <strong>Space News Feed</strong> — Real-time curated news from Spaceflight News API
                                covering launches, discoveries, missions, and cosmic events. Each article shows source,
                                timestamp, thumbnail, and summary.
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ═══ COMPARISON TABLE ═══ */}
                <motion.section className="about-section comparison-section" {...fadeUp}>
                    <div className="about-section-header">
                        <Star size={20} className="section-icon" />
                        <h2>Tejoraj vs General AI Chatbots</h2>
                    </div>
                    <p className="comparison-intro">
                        Tejoraj isn't competing with general-purpose chatbots — it's a fundamentally different
                        tool designed for a specific mission. Here's how it compares:
                    </p>

                    <div className="comparison-table-wrapper">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th className="feature-col">Feature</th>
                                    <th className="tejoraj-col">
                                        <SpaceAgentLogo size={16} /> Tejoraj
                                    </th>
                                    <th>ChatGPT</th>
                                    <th>Claude</th>
                                    <th>Gemini</th>
                                    <th>Perplexity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonFeatures.map((row, i) => (
                                    <tr key={i}>
                                        <td className="feature-col">{row.feature}</td>
                                        <td className="tejoraj-col">{row.tejoraj}</td>
                                        <td>{row.chatgpt}</td>
                                        <td>{row.claude}</td>
                                        <td>{row.gemini}</td>
                                        <td>{row.perplexity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* ═══ CTA ═══ */}
                <motion.section className="about-cta" {...fadeUp}>
                    <h2>Ready to explore the cosmos?</h2>
                    <p>Start a conversation, explore 3D space, or generate your first research paper.</p>
                    <div className="about-cta-buttons">
                        <motion.button
                            className="about-cta-btn primary"
                            onClick={() => navigate('/transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <MessageCircle size={16} />
                            <span>Chat with Agent</span>
                            <ArrowRight size={16} />
                        </motion.button>
                        <motion.button
                            className="about-cta-btn explorer"
                            onClick={() => navigate('/explorer-transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Satellite size={16} />
                            <span>Space Explorer</span>
                        </motion.button>
                        <motion.button
                            className="about-cta-btn secondary"
                            onClick={() => navigate('/research-transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FileText size={16} />
                            <span>Create Research Paper</span>
                        </motion.button>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
