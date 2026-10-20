import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Palette, Eye, EyeOff, Sliders } from 'lucide-react';
import { useStore } from '../store';

interface Props { open: boolean; onClose: () => void; }

const ACCENT_COLOURS = [
  { name: 'Electric Blue', value: '#3b82f6' },
  { name: 'UCL Gold',      value: '#f0c040' },
  { name: 'Emerald',       value: '#10b981' },
  { name: 'Purple',        value: '#8b5cf6' },
  { name: 'Rose',          value: '#f43f5e' },
];

const MODELS = [
  { value: 'xgboost',             label: 'XGBoost (recommended)' },
  { value: 'random_forest',       label: 'Random Forest' },
  { value: 'logistic_regression', label: 'Logistic Regression' },
  { value: 'gradient_boosting',   label: 'Gradient Boosting' },
  { value: 'naive_bayes',         label: 'Naive Bayes' },
];

const SECTIONS = [
  { key: 'home',        label: 'Home Page' },
  { key: 'predictor',   label: 'Predictor' },
  { key: 'simulator',   label: 'Simulator' },
  { key: 'research',    label: 'Research' },
  { key: 'models',      label: 'Models' },
  { key: 'data',        label: 'Data Explorer' },
  { key: 'about',       label: 'About' },
];

export default function SettingsPanel({ open, onClose }: Props) {
  const {
    mode, setMode,
    accentColor, setAccentColor,
    defaultModel, setDefaultModel,
    defaultFormWindow, setDefaultFormWindow,
    showSection, setSectionVisible,
  } = useStore();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-navy-800/98 backdrop-blur-xl
                       border-l border-white/10 shadow-2xl overflow-y-auto"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-electric" />
                  <h2 className="font-bold text-white text-lg">Settings</h2>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">View Mode</p>
                <div className="flex gap-2">
                  {(['beginner', 'expert'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                        mode === m
                          ? 'bg-electric text-white shadow-glow'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {m === 'beginner' ? '📚 Beginner' : '🔬 Expert'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {mode === 'beginner'
                    ? 'Simple explanations, key metrics only'
                    : 'Full technical metrics, confusion matrices, calibration plots'}
                </p>
              </div>

              {/* Accent colour */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Accent Colour</p>
                <div className="flex gap-2 flex-wrap">
                  {ACCENT_COLOURS.map(c => (
                    <button key={c.value} onClick={() => setAccentColor(c.value)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        accentColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Default model */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Default Model</p>
                <select
                  value={defaultModel}
                  onChange={e => setDefaultModel(e.target.value)}
                  className="select-field text-sm"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Form window */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                  Default Form Window: <span className="text-electric font-bold">{defaultFormWindow} matches</span>
                </p>
                <input type="range" min={3} max={10} step={1}
                  value={defaultFormWindow}
                  onChange={e => setDefaultFormWindow(Number(e.target.value))}
                  className="w-full accent-electric"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>3</span><span>10</span>
                </div>
              </div>

              {/* Show/hide sections */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Show Sections</p>
                <div className="space-y-2">
                  {SECTIONS.map(s => (
                    <div key={s.key} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{s.label}</span>
                      <button
                        onClick={() => setSectionVisible(s.key, !showSection[s.key])}
                        className={`p-1.5 rounded-lg transition-all ${
                          showSection[s.key] ? 'text-electric hover:bg-electric/10' : 'text-slate-600 hover:bg-white/5'
                        }`}
                      >
                        {showSection[s.key] ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="glass-card p-3 text-xs text-slate-400">
                Settings are saved automatically to your browser's local storage.
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
