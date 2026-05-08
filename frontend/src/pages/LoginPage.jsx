import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpaceAgentLogo from '../components/SpaceAgentLogo';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import './AuthPages.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!hasSupabaseConfig) {
            setError('Supabase is not configured. Add frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
            return;
        }

        const params = new URLSearchParams(location.search);
        if (params.get('signup') === 'success') {
            setError('Account created. Check your email to verify your account before signing in.');
        }

        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                navigate('/');
            }
        };

        checkSession();
    }, [location.search, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!supabase) {
            setError('Supabase is not configured. Add frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
            setIsLoading(false);
            return;
        }

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (authError) {
                throw authError;
            }

            if (data.session) {
                localStorage.setItem('spaceagent_auth', 'true');
                navigate('/');
            } else {
                setError('Check your email to confirm your account before signing in.');
            }
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Background layers */}
            <div className="auth-bg-image" />
            <div className="auth-bg-overlay" />
            <div className="auth-stars" />
            <div className="auth-glow auth-glow-1" />
            <div className="auth-glow auth-glow-2" />

            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-ring">
                        <SpaceAgentLogo size={48} />
                    </div>
                    <h1 className="auth-brand">TEJORAJ</h1>
                    <p className="auth-tagline">Access your mission control</p>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={handleLogin}>
                    {error && (
                        <motion.div
                            className="auth-error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">Email</label>
                        <div className="auth-input-wrapper">
                            <Mail size={16} className="auth-input-icon" />
                            <input
                                id="login-email"
                                type="email"
                                className="auth-input"
                                placeholder="commander@spaceagent.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">Password</label>
                        <div className="auth-input-wrapper">
                            <Lock size={16} className="auth-input-icon" />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-options">
                        <label className="auth-remember">
                            <input type="checkbox" className="auth-checkbox" />
                            <span>Remember me</span>
                        </label>
                        <button type="button" className="auth-forgot-btn">
                            Forgot password?
                        </button>
                    </div>

                    <motion.button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <span className="auth-spinner" />
                        ) : (
                            <>
                                <span>Launch Mission</span>
                                <Rocket size={16} />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                {/* Social Buttons (placeholders) */}
                <div className="auth-socials">
                    <button type="button" className="auth-social-btn" title="Sign in with Google">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Google</span>
                    </button>
                    <button type="button" className="auth-social-btn" title="Sign in with GitHub">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub</span>
                    </button>
                </div>

                {/* Switch to Signup */}
                <p className="auth-switch">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        className="auth-switch-btn"
                        onClick={() => navigate('/signup')}
                    >
                        Create one
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
