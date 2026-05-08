import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Eye,
    Globe,
    Loader2,
    Newspaper,
    Orbit,
    RefreshCw,
    Satellite,
    Sparkles,
    Star,
    Telescope,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ENDPOINTS } from '../api/config';
import FloatingNavbar from '../components/FloatingNavbar';
import './SpaceExplorerPage.css';

/* ── Fade-in animation ── */
const fadeUp = {
    initial: { opacity: 0, y: 25 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 },
};

/* ══════════════════════════════════════════
   APOD CARD
   ══════════════════════════════════════════ */
function APODCard({ data, loading, error, onRefresh, onDateChange, currentDate }) {
    const formatDate = (d) => d.toISOString().split('T')[0];
    const today = formatDate(new Date());

    const goBack = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        onDateChange(formatDate(d));
    };

    const goForward = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        const maxDate = new Date();
        if (d <= maxDate) onDateChange(formatDate(d));
    };

    return (
        <div className="explorer-card apod-card">
            <div className="card-header">
                <div className="card-header-left">
                    <Telescope size={22} className="card-icon" />
                    <div>
                        <h2>Astronomy Picture of the Day</h2>
                        <span className="card-subtitle">NASA APOD</span>
                    </div>
                </div>
                <div className="date-nav">
                    <button className="date-btn" onClick={goBack} title="Previous day">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="date-label">
                        <Calendar size={14} />
                        {currentDate}
                    </span>
                    <button className="date-btn" onClick={goForward} disabled={currentDate === today} title="Next day">
                        <ChevronRight size={16} />
                    </button>
                    <button className="refresh-btn" onClick={onRefresh} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
                    </button>
                </div>
            </div>

            <div className="apod-content">
                {loading ? (
                    <div className="apod-loading">
                        <Loader2 size={32} className="spin-icon" />
                        <p>Fetching today's cosmic image...</p>
                    </div>
                ) : error ? (
                    <div className="apod-error">
                        <p>{error}</p>
                        <button onClick={onRefresh}>Try Again</button>
                    </div>
                ) : data ? (
                    <>
                        <div className="apod-media-wrapper">
                            {data.media_type === 'video' ? (
                                <iframe
                                    className="apod-video"
                                    src={data.url}
                                    title={data.title}
                                    allowFullScreen
                                />
                            ) : (
                                <img
                                    className="apod-image"
                                    src={data.hdurl || data.url}
                                    alt={data.title}
                                    loading="lazy"
                                />
                            )}
                        </div>
                        <div className="apod-details">
                            <h3 className="apod-title">{data.title}</h3>
                            {data.copyright && (
                                <span className="apod-copyright">© {data.copyright}</span>
                            )}
                            <p className="apod-explanation">{data.explanation}</p>
                            {data.url && (
                                <a
                                    className="apod-link"
                                    href={data.hdurl || data.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink size={14} />
                                    View Full Resolution
                                </a>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   NASA EYES EMBED
   ══════════════════════════════════════════ */
function NASAEyesCard() {
    const [activeView, setActiveView] = useState('solar-system');

    const views = [
        {
            id: 'solar-system',
            label: 'Solar System',
            icon: <Orbit size={14} />,
            url: 'https://eyes.nasa.gov/apps/solar-system/#/home',
        },
        {
            id: 'earth',
            label: 'Earth',
            icon: <Globe size={14} />,
            url: 'https://eyes.nasa.gov/apps/earth/#/',
        },
        {
            id: 'asteroids',
            label: 'Asteroids',
            icon: <Star size={14} />,
            url: 'https://eyes.nasa.gov/apps/asteroids/#/home',
        },
    ];

    const current = views.find((v) => v.id === activeView);

    return (
        <div className="explorer-card eyes-card">
            <div className="card-header">
                <div className="card-header-left">
                    <Eye size={22} className="card-icon" />
                    <div>
                        <h2>NASA Eyes — 3D Interactive Explorer</h2>
                        <span className="card-subtitle">Fly through the cosmos in real time</span>
                    </div>
                </div>
            </div>

            <div className="eyes-tabs">
                {views.map((v) => (
                    <button
                        key={v.id}
                        className={`eyes-tab ${activeView === v.id ? 'active' : ''}`}
                        onClick={() => setActiveView(v.id)}
                    >
                        {v.icon}
                        <span>{v.label}</span>
                    </button>
                ))}
            </div>

            <div className="eyes-iframe-wrapper">
                <iframe
                    key={activeView}
                    className="eyes-iframe"
                    src={current.url}
                    title={`NASA Eyes - ${current.label}`}
                    allowFullScreen
                />
            </div>

            <div className="eyes-footer">
                <a
                    className="eyes-external-link"
                    href={current.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <ExternalLink size={14} />
                    Open in full screen
                </a>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   SPACE NEWS SECTION
   ══════════════════════════════════════════ */
function SpaceNewsCard({ articles, loading }) {
    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return `${days}d ago`;
    };

    return (
        <div className="explorer-card news-card">
            <div className="card-header">
                <div className="card-header-left">
                    <Newspaper size={22} className="card-icon" />
                    <div>
                        <h2>Space News</h2>
                        <span className="card-subtitle">Latest from the cosmos</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="news-loading">
                    <Loader2 size={24} className="spin-icon" />
                    <p>Loading space news...</p>
                </div>
            ) : articles.length === 0 ? (
                <div className="news-loading">
                    <p>No news articles available right now.</p>
                </div>
            ) : (
                <div className="news-list">
                    {articles.map((article, i) => (
                        <motion.a
                            key={i}
                            className="news-item"
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                        >
                            {article.image_url && (
                                <div className="news-thumb">
                                    <img src={article.image_url} alt={article.title} loading="lazy" />
                                </div>
                            )}
                            <div className="news-body">
                                <h3 className="news-title">{article.title}</h3>
                                <p className="news-summary">{article.summary}</p>
                                <div className="news-meta">
                                    <span className="news-source">{article.news_site}</span>
                                    <span className="news-time">
                                        <Clock size={12} />
                                        {timeAgo(article.published_at)}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink size={14} className="news-link-icon" />
                        </motion.a>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function SpaceExplorerPage() {
    const [apodData, setApodData] = useState(null);
    const [apodLoading, setApodLoading] = useState(true);
    const [apodError, setApodError] = useState('');
    const [apodDate, setApodDate] = useState(new Date().toISOString().split('T')[0]);
    const [newsArticles, setNewsArticles] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);

    /* ── Fetch APOD ── */
    const fetchAPOD = useCallback(async (date) => {
        setApodLoading(true);
        setApodError('');
        try {
            const url = `${ENDPOINTS.apod}?date=${date}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch APOD');
            const data = await res.json();
            setApodData(data);
        } catch (err) {
            setApodError(err.message || 'Could not load the Astronomy Picture of the Day.');
        } finally {
            setApodLoading(false);
        }
    }, []);

    /* ── Fetch Space News ── */
    const fetchNews = useCallback(async () => {
        setNewsLoading(true);
        try {
            const res = await fetch(ENDPOINTS.spaceNews);
            if (!res.ok) throw new Error('Failed to fetch news');
            const data = await res.json();
            setNewsArticles(data.articles || []);
        } catch {
            setNewsArticles([]);
        } finally {
            setNewsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAPOD(apodDate); }, [apodDate, fetchAPOD]);
    useEffect(() => { fetchNews(); }, [fetchNews]);

    const handleDateChange = (newDate) => { setApodDate(newDate); };

    return (
        <div className="explorer-page">
            {/* Background */}
            <div className="explorer-bg-image" />
            <div className="explorer-bg-overlay" />
            <div className="explorer-stars" />
            <div className="explorer-glow explorer-glow-1" />
            <div className="explorer-glow explorer-glow-2" />

            <FloatingNavbar />

            <main className="explorer-main">
                {/* ═══ HERO ═══ */}
                <motion.section className="explorer-hero" {...fadeUp}>
                    <div className="explorer-hero-badge">
                        <Satellite size={18} />
                        <span>Dynamic Space Visuals</span>
                    </div>
                    <h1 className="explorer-hero-title">
                        Space <span className="gradient-text">Explorer</span>
                    </h1>
                    <p className="explorer-hero-subtitle">
                        Live NASA imagery, 3D interactive solar system, and real-time cosmic data —
                        all streamed directly from NASA's mission feeds.
                    </p>
                </motion.section>

                {/* ═══ APOD ═══ */}
                <motion.div {...fadeUp}>
                    <APODCard
                        data={apodData}
                        loading={apodLoading}
                        error={apodError}
                        onRefresh={() => fetchAPOD(apodDate)}
                        onDateChange={handleDateChange}
                        currentDate={apodDate}
                    />
                </motion.div>

                {/* ═══ NASA EYES ═══ */}
                <motion.div {...fadeUp}>
                    <NASAEyesCard />
                </motion.div>

                {/* ═══ SPACE NEWS ═══ */}
                <motion.div {...fadeUp}>
                    <SpaceNewsCard articles={newsArticles} loading={newsLoading} />
                </motion.div>

                {/* ═══ INFO BAR ═══ */}
                <div className="explorer-info-bar">
                    <Sparkles size={14} />
                    <span>
                        Data sourced in real-time from NASA APIs • APOD • NASA Eyes • Spaceflight News API
                    </span>
                </div>
            </main>
        </div>
    );
}
