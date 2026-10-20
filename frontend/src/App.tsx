import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Menu, X, Settings, Sparkles, Activity, Shield, Swords, Layers, History, Database } from 'lucide-react';
import { useStore } from './store';

// Pages
import HomePage from './pages/HomePage';
import PredictorPage from './pages/PredictorPage';
import TeamComparisonPage from './pages/TeamComparisonPage';
import MatchCentrePage from './pages/MatchCentrePage';
import TeamExplorerPage from './pages/TeamExplorerPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import SimulatorPage from './pages/SimulatorPage';
import SettingsPanel from './components/SettingsPanel';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/predict', label: 'Predictor' },
  { to: '/compare', label: 'H2H & Compare' },
  { to: '/matches', label: 'Match Centre' },
  { to: '/teams', label: 'Clubs' },
  { to: '/models', label: 'Model Evaluation' },
  { to: '/history', label: 'History' },
  { to: '/simulator', label: 'Simulator' },
];

function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#04170d]/95 backdrop-blur-xl border-b border-[#00ff87]/20 shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
            : 'bg-[#04170d]/80 backdrop-blur-md border-b border-white/5'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00ff87] to-[#047857] rounded-xl flex items-center justify-center shadow-pitch group-hover:scale-105 transition-all border border-white/30 text-xl">
              ⚽
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base text-white tracking-tight leading-none flex items-center gap-1.5">
                UCL Predictor
                <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
              </span>
              <span className="text-[10px] text-[#00ff87] font-bold tracking-widest uppercase leading-tight mt-0.5">
                AI Match Centre
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden xl:flex items-center gap-4">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-xs font-bold transition-all py-1.5 px-3 rounded-xl ${
                  location.pathname === l.to
                    ? 'text-[#020b06] bg-[#00ff87] shadow-pitch'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Compact Tablet nav */}
          <div className="hidden md:flex xl:hidden items-center gap-3">
            <Link to="/predict" className="text-xs font-bold text-slate-300 hover:text-[#00ff87]">Predictor</Link>
            <Link to="/compare" className="text-xs font-bold text-slate-300 hover:text-[#00ff87]">H2H & Compare</Link>
            <Link to="/matches" className="text-xs font-bold text-slate-300 hover:text-[#00ff87]">Matches</Link>
            <Link to="/models" className="text-xs font-bold text-slate-300 hover:text-[#00ff87]">Evaluation</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#00ff87] hover:bg-white/10 transition-all border border-transparent hover:border-[#00ff87]/30"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <Link to="/predict" className="btn-primary py-2 px-4 text-xs font-extrabold flex items-center gap-1.5 shadow-pitch">
              <Sparkles size={14} /> Predict Match
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden bg-[#04170d]/98 backdrop-blur-2xl border-b border-[#00ff87]/20"
            >
              <div className="container py-4 grid grid-cols-2 gap-2">
                {NAV_LINKS.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      location.pathname === l.to
                        ? 'bg-[#00ff87] text-[#020b06]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function AppInner() {
  const location = useLocation();
  return (
    <div className="min-h-screen relative flex flex-col justify-between pt-16 pitch-pattern">
      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="flex-grow"
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/predict" element={<PredictorPage />} />
            <Route path="/compare" element={<TeamComparisonPage />} />
            <Route path="/matches" element={<MatchCentrePage />} />
            <Route path="/teams" element={<TeamExplorerPage />} />
            <Route path="/h2h" element={<Navigate to="/compare" replace />} />
            <Route path="/explainability" element={<Navigate to="/models" replace />} />
            <Route path="/models" element={<ModelEvaluationPage />} />
            <Route path="/history" element={<PredictionHistoryPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#04170d]/95 border-t border-[#00ff87]/20 py-6 mt-16 text-xs text-slate-400">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span className="font-black text-white">UEFA Champions League AI Match Outcome Predictor</span>
            <span className="text-slate-500">• B.Tech Computer Engineering Project (50 Marks)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="text-[#00ff87] font-semibold">1,110 Historical UCL Matches</span>
            <span>Poisson & Random Forest ML Classifiers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI Render Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020b06] text-white">
          <div className="max-w-md p-8 rounded-2xl bg-[#072415] border border-[#00ff87]/30 shadow-2xl space-y-4">
            <span className="text-4xl block">⚽</span>
            <h2 className="text-xl font-bold text-white">Temporary Interface Refresh Required</h2>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || "An unexpected error occurred while loading this view."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-xs px-4 py-2"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
