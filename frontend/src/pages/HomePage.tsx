import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Activity, Target, ShieldCheck, ArrowRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { fetchDashboardStats, DashboardStats } from '../api';
import TeamBadge from '../components/TeamBadge';
import MatchDetailModal from '../components/MatchDetailModal';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(res => setStats(res))
      .catch(err => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats
    ? [
        { name: 'Home Win', value: stats.class_distribution.H, color: '#00ff87' },
        { name: 'Draw', value: stats.class_distribution.D, color: '#fbbf24' },
        { name: 'Away Win', value: stats.class_distribution.A, color: '#f43f5e' },
      ]
    : [];

  return (
    <div className="container py-8 space-y-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-[#00ff87]/30 shadow-[0_15px_50px_rgba(0,0,0,0.7),0_0_40px_rgba(0,255,135,0.12)] bg-gradient-to-br from-[#072415] via-[#04170d] to-[#020b06]"
      >
        {/* Stadium floodlight glow */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#00ff87]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00ff87]/15 border border-[#00ff87]/30 text-[#00ff87] text-xs font-black tracking-wider uppercase">
            <span>⚽</span> Academic Machine Learning Project • B.Tech Sem V (50 Marks)
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-sans">
            UEFA Champions League <br />
            <span className="gradient-text">AI Match Outcome Predictor</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Full-stack machine learning match analytics platform evaluating 1,110 Champions League fixtures.
            Simulate matchups, discover who scored the goals in direct encounters, compare club squads, and predict match results with calibrated AI probabilities.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/predict" className="btn-primary flex items-center gap-2 shadow-pitch">
              <span>⚽</span> Predict Match Outcome
              <ArrowRight size={16} />
            </Link>
            <Link to="/compare" className="btn-secondary flex items-center gap-2">
              <Trophy size={18} /> H2H & Club Compare
            </Link>
            <Link to="/matches" className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition-all">
              <Calendar size={16} className="text-[#00ff87]" /> Match Centre & Goalscorers
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Historical Matches</span>
            <Activity size={18} className="text-electric" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats ? stats.total_historical_matches.toLocaleString() : '1,110'}
          </div>
          <span className="text-xs text-slate-400">10 Seasons (2015-2025)</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clubs Loaded</span>
            <Trophy size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats ? stats.total_teams : '36'}
          </div>
          <span className="text-xs text-slate-400">Official European clubs</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Goals / Match</span>
            <Target size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats ? stats.avg_goals_per_match : '2.89'}
          </div>
          <span className="text-xs text-slate-400">Total: {stats?.total_goals_scored || '3,210'} goals</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Test Accuracy</span>
            <TrendingUp size={18} className="text-electric-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            55.3%
          </div>
          <span className="text-xs text-slate-400">Chronological Test Set</span>
        </div>
      </div>

      {/* Main Grid: Recent Matches & Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Matches Table (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Completed Matches</h2>
              <p className="text-xs text-slate-400">Actual historical UEFA Champions League results</p>
            </div>
            <Link to="/matches" className="text-xs text-electric-400 hover:text-electric flex items-center gap-1 font-semibold">
              Match Centre <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Home Club</th>
                  <th className="pb-3 font-semibold text-center">Score</th>
                  <th className="pb-3 font-semibold">Away Club</th>
                  <th className="pb-3 font-semibold text-center">Outcome</th>
                  <th className="pb-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.recent_matches || []).map(m => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-xs text-slate-400 whitespace-nowrap">{m.date}</td>
                    <td className="py-3 font-medium text-white">
                      <TeamBadge name={m.home_team} size="sm" showName />
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-white whitespace-nowrap">
                      {m.score}
                    </td>
                    <td className="py-3 font-medium text-white">
                      <TeamBadge name={m.away_team} size="sm" showName />
                    </td>
                    <td className="py-3 text-center">
                      <span className={m.result === 'H' ? 'badge-win' : m.result === 'A' ? 'badge-loss' : 'badge-draw'}>
                        {m.result === 'H' ? 'Home Win' : m.result === 'A' ? 'Away Win' : 'Draw'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedMatchId(m.id)}
                        className="text-xs text-slate-400 hover:text-electric underline transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outcome Distribution & Model Overview (1 col) */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Historical Outcome Share</h2>
            <p className="text-xs text-slate-400">Class balance across 1,110 matches</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1526', borderColor: '#ffffff20', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[#00ff87] font-black text-sm block">{stats?.home_win_rate || 45.3}%</span>
              <span className="text-slate-300 text-[11px] font-medium">Home Win</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-amber-400 font-black text-sm block">{stats?.draw_rate || 22.8}%</span>
              <span className="text-slate-300 text-[11px] font-medium">Draw</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-rose-400 font-black text-sm block">{stats?.away_win_rate || 31.9}%</span>
              <span className="text-slate-300 text-[11px] font-medium">Away Win</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Verified Fixtures
            </h3>
            <div className="space-y-2">
              {(stats?.upcoming_fixtures || []).slice(0, 3).map(u => (
                <div key={u.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-white truncate">{u.home_team}</span>
                    <span className="text-slate-500">vs</span>
                    <span className="font-semibold text-white truncate">{u.away_team}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-electric-400 bg-electric/10 px-1.5 py-0.5 rounded shrink-0">
                    {u.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match Detail Modal */}
      <MatchDetailModal
        matchId={selectedMatchId}
        isOpen={selectedMatchId !== null}
        onClose={() => setSelectedMatchId(null)}
      />
    </div>
  );
}
