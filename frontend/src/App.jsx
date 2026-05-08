import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import AboutPage from './pages/AboutPage';
import ChatPage from './pages/ChatPage';
import ExplorerTransitionPage from './pages/ExplorerTransitionPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ResearchPaperPage from './pages/ResearchPaperPage';
import ResearchTransitionPage from './pages/ResearchTransitionPage';
import ReturnTransitionPage from './pages/ReturnTransitionPage';
import SignupPage from './pages/SignupPage';
import SpaceExplorerPage from './pages/SpaceExplorerPage';
import BlackHolePage from './pages/BlackHolePage';
import TransitionPage from './pages/TransitionPage';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = { duration: 0.4, ease: 'easeInOut' };

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <LoginPage />
            </motion.div>
          }
        />
        <Route
          path="/signup"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <SignupPage />
            </motion.div>
          }
        />
        <Route
          path="/"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <LandingPage />
            </motion.div>
          }
        />
        <Route
          path="/transition"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <TransitionPage />
            </motion.div>
          }
        />
        <Route
          path="/chat"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <ChatPage />
            </motion.div>
          }
        />
        <Route
          path="/research-transition"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <ResearchTransitionPage />
            </motion.div>
          }
        />
        <Route
          path="/research"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <ResearchPaperPage />
            </motion.div>
          }
        />
        <Route
          path="/about"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <AboutPage />
            </motion.div>
          }
        />
        <Route
          path="/explorer-transition"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <ExplorerTransitionPage />
            </motion.div>
          }
        />
        <Route
          path="/explorer"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <SpaceExplorerPage />
            </motion.div>
          }
        />
        <Route
          path="/blackhole"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <BlackHolePage />
            </motion.div>
          }
        />
        <Route
          path="/return-transition"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} style={{ minHeight: '100vh' }}>
              <ReturnTransitionPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

/* Wrapper that handles splash → login redirect */
function SplashWrapper({ onComplete }) {
  const navigate = useNavigate();

  const handleSplashDone = () => {
    onComplete();
    navigate('/login', { replace: true });
  };

  return <SplashScreen onComplete={handleSplashDone} />;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <BrowserRouter>
      {!splashDone && <SplashWrapper onComplete={() => setSplashDone(true)} />}
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

