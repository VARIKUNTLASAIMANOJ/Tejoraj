import { AnimatePresence, motion } from 'framer-motion';
import { Home, Info, LogOut, Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './FloatingNavbar.css';
import SpaceAgentLogo from './SpaceAgentLogo';

export default function FloatingNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setScrolled(currentY > 50);
            if (currentY > 50 && Math.abs(currentY - lastScrollY.current) > 5) {
                setHidden(currentY > lastScrollY.current);
            } else if (currentY <= 50) {
                setHidden(false);
            }
            lastScrollY.current = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isChat = location.pathname === '/chat';
    const isResearch = location.pathname === '/research';
    const isAbout = location.pathname === '/about';
    const isExplorer = location.pathname === '/explorer';
    const isInnerPage = isChat || isResearch || isAbout || isExplorer;

    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('spaceagent_auth');
        navigate('/login', { replace: true });
    };

    return (
        <motion.nav
            className={`floating-navbar ${scrolled ? 'scrolled' : ''} ${hidden ? 'nav-hidden' : ''}`}
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: hidden ? -100 : 0, x: '-50%', opacity: hidden ? 0 : 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="nav-inner">
                {/* Logo */}
                <div className="nav-logo" onClick={() => navigate(isInnerPage ? '/return-transition' : '/')}>
                    <SpaceAgentLogo className="nav-logo-icon" size={28} />
                    <span className="nav-logo-text">Tejoraj</span>
                </div>

                {/* Desktop Links */}
                <div className="nav-links">
                    {!isChat && (
                        <a href="#about" className="nav-link">
                            {/* About */}
                        </a>
                    )}
                    {isInnerPage && (
                        <button className="nav-link" onClick={() => navigate('/return-transition')}>
                            {/* Home */}
                        </button>
                    )}
                </div>

                {/* CTA Buttons */}
                <div className="nav-cta-group">
                    {isInnerPage ? (
                        <motion.button
                            className="nav-cta home-cta"
                            onClick={() => navigate('/return-transition')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Home size={16} />
                            <span>Home</span>
                        </motion.button>
                    ) : (
                        <>
                            <motion.button
                                className="nav-cta about-cta"
                                onClick={() => navigate('/about')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Info size={16} />
                                <span>About</span>
                            </motion.button>
                            <motion.button
                                className="nav-cta"
                                onClick={() => navigate('/transition')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <MessageCircle size={16} />
                                <span>Chat with Agent</span>
                                <div className="cta-glow" />
                            </motion.button>
                        </>
                    )}

                    {/* Sign Out — only on landing page */}
                    {!isInnerPage && (
                        <motion.button
                            className="nav-cta signout-cta"
                            onClick={handleSignOut}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </motion.button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="mobile-menu glass-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isInnerPage ? (
                            <button
                                className="mobile-link"
                                onClick={() => {
                                    navigate('/return-transition');
                                    setMobileOpen(false);
                                }}
                            >
                                <Home size={16} /> Back to Home
                            </button>
                        ) : (
                            <>
                                <button
                                    className="mobile-link cta-mobile"
                                    onClick={() => {
                                        navigate('/transition');
                                        setMobileOpen(false);
                                    }}
                                >
                                    <MessageCircle size={16} /> Chat with Agent
                                </button>
                                <button
                                    className="mobile-link about-mobile"
                                    onClick={() => {
                                        navigate('/about');
                                        setMobileOpen(false);
                                    }}
                                >
                                    <Info size={16} /> About
                                </button>
                            </>
                        )}
                        {!isInnerPage && (
                            <button
                                className="mobile-link signout-mobile"
                                onClick={() => {
                                    handleSignOut();
                                    setMobileOpen(false);
                                }}
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav >
    );
}
