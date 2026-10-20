import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  ArrowRightLeft,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Shield,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Sliders,
} from 'lucide-react';
import { fetchTeams, predictMatch, TeamItem, PredictResponse } from '../api';
import TeamBadge from '../components/TeamBadge';
import ProbabilityBar from '../components/ProbabilityBar';
import ScorelineHeatmap from '../components/ScorelineHeatmap';

export default function PredictorPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Form State
  const [homeTeam, setHomeTeam] = useState<string>('Real Madrid');
  const [awayTeam, setAwayTeam] = useState<string>('Manchester City');
  const [stage, setStage] = useState<string>('league_phase');
  const [venue, setVenue] = useState<string>('home');
  const [model, setModel] = useState<string>('random_forest');
  const [formWindow, setFormWindow] = useState<number>(5);
  const [homeAdvWeight, setHomeAdvWeight] = useState<number>(1.0);
  const [injuryHome, setInjuryHome] = useState<boolean>(false);
  const [injuryAway, setInjuryAway] = useState<boolean>(false);

  // Advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Prediction State
  const [predicting, setPredicting] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(res => {
        setTeams(res);
        if (res.length >= 2) {
          setHomeTeam(res[0].name);
          setAwayTeam(res[1].name);
        }
      })
      .catch(err => {
        console.error('Failed to load teams:', err);
        setErrorMsg('Unable to connect to backend server. Make sure FastAPI is running on port 8000.');
      })
      .finally(() => setLoadingTeams(false));
  }, []);

  const handleSwap = () => {
    const temp = homeTeam;
    setHomeTeam(awayTeam);
    setAwayTeam(temp);
    setPrediction(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeam === awayTeam) {
      setErrorMsg('Home team and away team must be distinct clubs.');
      return;
    }
    setErrorMsg(null);
    setPredicting(true);

    try {
      const res = await predictMatch({
        home_team: homeTeam,
        away_team: awayTeam,
        stage,
        venue,
        model,
        form_window: formWindow,
        home_adv_weight: homeAdvWeight,
        injury_home: injuryHome,
        injury_away: injuryAway,
      });
      setPrediction(res);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Prediction failed.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPredicting(false);
    }
  };

  const homeClub = teams.find(t => t.name === homeTeam);
  const awayClub = teams.find(t => t.name === awayTeam);

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/15 text-electric-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} /> Statistical AI Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">UEFA Champions League Match Predictor</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Choose any two European clubs from the verified 36-team dataset to generate calibrated match outcome probabilities, score predictions, and explainable feature breakdowns.
        </p>
      </div>

      {/* Main Interactive Predictor Form */}
      <form onSubmit={handlePredict} className="glass-card p-6 sm:p-8 space-y-6">
        {/* Team Selectors with Swap */}
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
          {/* Home Team Select */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-electric-400" /> Home Club (Venue Advantage)
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-800 border border-white/10">
              <TeamBadge name={homeTeam} colour={homeClub?.colour} size="md" />
              <select
                value={homeTeam}
                onChange={e => {
                  setHomeTeam(e.target.value);
                  setPrediction(null);
                }}
                className="w-full bg-transparent text-white font-semibold text-sm sm:text-base focus:outline-none cursor-pointer"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.name} className="bg-navy-800 text-white">
                    {t.name} ({t.country}) — Elo: {t.elo}
                  </option>
                ))}
              </select>
            </div>
            {homeClub && (
              <div className="text-[11px] text-slate-400 flex justify-between px-1">
                <span>Elo: <strong>{homeClub.elo}</strong></span>
                <span>Squad: <strong>€{homeClub.squad_value_M}M</strong></span>
                <span>UEFA Coef: <strong>{homeClub.uefa_coef}</strong></span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-electric/20 hover:border-electric/50 transition-all shadow-md active:scale-95"
              title="Swap Home and Away Clubs"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* Away Team Select */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-rose-400" /> Away Club (Visiting)
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-800 border border-white/10">
              <TeamBadge name={awayTeam} colour={awayClub?.colour} size="md" />
              <select
                value={awayTeam}
                onChange={e => {
                  setAwayTeam(e.target.value);
                  setPrediction(null);
                }}
                className="w-full bg-transparent text-white font-semibold text-sm sm:text-base focus:outline-none cursor-pointer"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.name} className="bg-navy-800 text-white">
                    {t.name} ({t.country}) — Elo: {t.elo}
                  </option>
                ))}
              </select>
            </div>
            {awayClub && (
              <div className="text-[11px] text-slate-400 flex justify-between px-1">
                <span>Elo: <strong>{awayClub.elo}</strong></span>
                <span>Squad: <strong>€{awayClub.squad_value_M}M</strong></span>
                <span>UEFA Coef: <strong>{awayClub.uefa_coef}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Phase, Venue & Model Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} /> Competition Phase
            </label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-electric"
            >
              <option value="league_phase">League Phase (2024-25 Modern Format)</option>
              <option value="group">Group Stage (Historical Format)</option>
              <option value="round_of_16">Round of 16 (Knockout)</option>
              <option value="quarter_final">Quarter-Final (Knockout)</option>
              <option value="semi_final">Semi-Final (Knockout)</option>
              <option value="final">Final (Single Tie / Neutral)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Activity size={13} /> Venue Condition
            </label>
            <select
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-electric"
            >
              <option value="home">Home Venue Advantage (Standard)</option>
              <option value="neutral">Neutral Stadium (No Home Advantage)</option>
              <option value="away">Away Venue</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Layers size={13} /> Model Architecture
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-electric"
            >
              <option value="random_forest">Random Forest Classifier (Primary)</option>
              <option value="xgboost">XGBoost Classifier (Gradient Boosted)</option>
              <option value="logistic_regression">Logistic Regression (Baseline)</option>
              <option value="ensemble">Soft Voting Multi-Model Ensemble</option>
            </select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-electric-400 hover:text-electric flex items-center gap-1.5 font-semibold transition-colors"
          >
            <Sliders size={14} />
            {showAdvanced ? 'Hide Advanced Feature Controls' : 'Show Advanced Feature Controls (Rolling Window, Injuries, Home Adv Weight)'}
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-3 border-t border-white/5 bg-white/5 p-4 rounded-xl"
            >
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Rolling Form Window: <strong className="text-white font-mono">{formWindow} Matches</strong>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={formWindow}
                  onChange={e => setFormWindow(parseInt(e.target.value))}
                  className="w-full accent-electric cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Evaluates last {formWindow} prior fixtures</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Home Advantage Multiplier: <strong className="text-white font-mono">{homeAdvWeight.toFixed(1)}x</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.2"
                  value={homeAdvWeight}
                  onChange={e => setHomeAdvWeight(parseFloat(e.target.value))}
                  className="w-full accent-electric cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Scale home stadium statistical weight</span>
              </div>

              <div className="flex flex-col gap-2 justify-center">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={injuryHome}
                    onChange={e => setInjuryHome(e.target.checked)}
                    className="rounded accent-electric"
                  />
                  <span>Simulate Home Key Player Injuries</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={injuryAway}
                    onChange={e => setInjuryAway(e.target.checked)}
                    className="rounded accent-electric"
                  />
                  <span>Simulate Away Key Player Injuries</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Predict Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            * Evaluated using pre-match chronological data only. Probabilities sum to 100%.
          </span>
          <button
            type="submit"
            disabled={predicting || loadingTeams}
            className="btn-primary py-3 px-8 text-sm sm:text-base flex items-center gap-2 shadow-glow"
          >
            {predicting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Calculating Outcome...
              </>
            ) : (
              <>
                <Trophy size={18} /> Predict Match
              </>
            )}
          </button>
        </div>
      </form>

      {/* Prediction Output Section */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="space-y-6"
          >
            {/* Main Result Banner */}
            <div className="glass-card p-6 sm:p-8 border-electric/30 shadow-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-electric/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Most Probable Outcome
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                      {prediction.predicted_outcome === 'Home Win' && `${prediction.home_team} Win`}
                      {prediction.predicted_outcome === 'Away Win' && `${prediction.away_team} Win`}
                      {prediction.predicted_outcome === 'Draw' && 'Stalemate / Draw'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">Estimated Score</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                        {prediction.predicted_score.home} - {prediction.predicted_score.away}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
                      <span
                        className={`text-sm font-bold ${
                          prediction.confidence_level === 'High'
                            ? 'text-emerald-400'
                            : prediction.confidence_level === 'Moderate'
                            ? 'text-electric-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {prediction.confidence_level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calibrated 3-Way Probability Bar */}
                <ProbabilityBar
                  probH={prediction.probabilities.H}
                  probD={prediction.probabilities.D}
                  probA={prediction.probabilities.A}
                  homeTeam={prediction.home_team}
                  awayTeam={prediction.away_team}
                  homeColour={homeClub?.colour}
                  awayColour={awayClub?.colour}
                />

                {/* Confidence Explanation Banner & H2H link */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#04170d] border border-white/10 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#00ff87] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Model Reasoning & Analytical Context</strong>
                      {prediction.confidence_explanation}
                    </div>
                  </div>
                  <a
                    href={`/compare?team1=${encodeURIComponent(prediction.home_team)}&team2=${encodeURIComponent(prediction.away_team)}`}
                    className="btn-secondary py-2 px-3 text-xs shrink-0 flex items-center gap-1.5"
                  >
                    <span>⚔️</span> View Direct H2H & Scorers
                  </a>
                </div>
              </div>
            </div>

            {/* Split Row: Explainability Feature Importance & Scoreline Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature Explainability Card */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Key Influential Features</h3>
                  <span className="text-xs text-slate-400">Random Forest Importance</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Relative statistical importance of features determining this prediction (measures variance reduction):
                </p>

                <div className="space-y-3 pt-2">
                  {prediction.top_features.map((feat, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200">{feat.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            feat.direction === 'favours home'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : feat.direction === 'favours away'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {feat.direction}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Feature Value: <strong className="text-white font-mono">{feat.value}</strong></span>
                        <span>Model Importance: <strong className="text-electric-400 font-mono">{(feat.importance * 100).toFixed(1)}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoreline Heatmap & Bookmaker Comparison */}
              <div className="glass-card p-6 space-y-6">
                <ScorelineHeatmap
                  scorelines={prediction.scorelines}
                  mostLikely={prediction.predicted_score}
                  homeTeam={prediction.home_team}
                  awayTeam={prediction.away_team}
                />

                {/* Bookmaker Odds Comparison */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span>Elo Market Benchmark Comparison</span>
                    <span className="text-[11px] text-slate-500">Implied Elo Odds</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-white/5">
                      <span className="text-slate-400 block text-[10px]">H Benchmark</span>
                      <strong className="text-white">{(prediction.bookmaker_implied_probs.H * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="text-slate-400 block text-[10px]">D Benchmark</span>
                      <strong className="text-white">{(prediction.bookmaker_implied_probs.D * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="text-slate-400 block text-[10px]">A Benchmark</span>
                      <strong className="text-white">{(prediction.bookmaker_implied_probs.A * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
