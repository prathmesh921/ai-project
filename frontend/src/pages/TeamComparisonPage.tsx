import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Trophy, Swords, BarChart3, Shield, MapPin, Sparkles, Calendar } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { fetchTeams, fetchTeamStats, fetchHeadToHead, TeamItem, TeamStats, HeadToHeadResponse } from '../api';
import TeamBadge from '../components/TeamBadge';

export default function TeamComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [team1Name, setTeam1Name] = useState<string>(searchParams.get('team1') || 'Real Madrid');
  const [team2Name, setTeam2Name] = useState<string>(searchParams.get('team2') || 'Manchester City');

  const [activeTab, setActiveTab] = useState<'h2h' | 'tactical'>('h2h');
  const [stats1, setStats1] = useState<TeamStats | null>(null);
  const [stats2, setStats2] = useState<TeamStats | null>(null);
  const [h2h, setH2H] = useState<HeadToHeadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeams()
      .then(res => {
        setTeams(res);
        if (!searchParams.get('team1') && res.length >= 2) {
          setTeam1Name(res[0].name);
          setTeam2Name(res[1].name);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (team1Name && team2Name && team1Name !== team2Name) {
      setLoading(true);
      Promise.all([
        fetchTeamStats(team1Name),
        fetchTeamStats(team2Name),
        fetchHeadToHead(team1Name, team2Name),
      ])
        .then(([s1, s2, h]) => {
          setStats1(s1);
          setStats2(s2);
          setH2H(h);
        })
        .catch(err => console.error('H2H & Compare fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [team1Name, team2Name]);

  const handleSwap = () => {
    const temp = team1Name;
    setTeam1Name(team2Name);
    setTeam2Name(temp);
  };

  const t1Club = teams.find(t => t.name === team1Name);
  const t2Club = teams.find(t => t.name === team2Name);

  // Radar data
  const radarData =
    stats1 && stats2
      ? [
          {
            metric: 'Elo Rating',
            Team1: Math.min(100, Math.round((stats1.elo / 2100) * 100)),
            Team2: Math.min(100, Math.round((stats2.elo / 2100) * 100)),
          },
          {
            metric: 'UEFA Coef',
            Team1: Math.min(100, Math.round((stats1.uefa_coef / 150) * 100)),
            Team2: Math.min(100, Math.round((stats2.uefa_coef / 150) * 100)),
          },
          {
            metric: 'Squad Value',
            Team1: Math.min(100, Math.round((stats1.squad_value_M / 1400) * 100)),
            Team2: Math.min(100, Math.round((stats2.squad_value_M / 1400) * 100)),
          },
          {
            metric: 'Win Rate %',
            Team1: Math.round(stats1.win_rate),
            Team2: Math.round(stats2.win_rate),
          },
          {
            metric: 'Avg Goals',
            Team1: Math.min(100, Math.round(stats1.avg_goals_scored * 32)),
            Team2: Math.min(100, Math.round(stats2.avg_goals_scored * 32)),
          },
        ]
      : [];

  // Bar Comparison Data
  const barData =
    stats1 && stats2
      ? [
          { metric: 'Wins', [team1Name]: stats1.wins, [team2Name]: stats2.wins },
          { metric: 'Draws', [team1Name]: stats1.draws, [team2Name]: stats2.draws },
          { metric: 'Losses', [team1Name]: stats1.losses, [team2Name]: stats2.losses },
          { metric: 'Goals Scored', [team1Name]: stats1.goals_scored, [team2Name]: stats2.goals_scored },
          { metric: 'Goals Conceded', [team1Name]: stats1.goals_conceded, [team2Name]: stats2.goals_conceded },
        ]
      : [];

  const totalMeetings = h2h?.total_meetings || 0;
  const t1WinPct = totalMeetings > 0 ? Math.round(((h2h?.team1_wins || 0) / totalMeetings) * 100) : 0;
  const drawPct = totalMeetings > 0 ? Math.round(((h2h?.draws || 0) / totalMeetings) * 100) : 0;
  const t2WinPct = totalMeetings > 0 ? Math.round(((h2h?.team2_wins || 0) / totalMeetings) * 100) : 0;

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff87]/15 text-[#00ff87] text-xs font-black uppercase tracking-wider border border-[#00ff87]/30">
          <Swords size={14} /> Head-to-Head & Club Comparison
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          European Clash & Tactical Analysis
        </h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Explore direct Champions League meeting records, player goalscorers, squad valuation, Elo ratings, and multi-dimensional tactical metrics.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
        {/* Team 1 */}
        <div className="md:col-span-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            First Club
          </label>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#04170d] border border-white/10">
            <TeamBadge name={team1Name} colour={t1Club?.colour} size="sm" />
            <select
              value={team1Name}
              onChange={e => setTeam1Name(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t.id} value={t.name} className="bg-[#072415] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-[#00ff87] hover:bg-[#00ff87]/20 transition-all shadow-sm"
            title="Swap Clubs"
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>

        {/* Team 2 */}
        <div className="md:col-span-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Second Club
          </label>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#04170d] border border-white/10">
            <TeamBadge name={team2Name} colour={t2Club?.colour} size="sm" />
            <select
              value={team2Name}
              onChange={e => setTeam2Name(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t.id} value={t.name} className="bg-[#072415] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-300">
          <div className="animate-spin w-10 h-10 border-3 border-[#00ff87] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-semibold text-sm">Analyzing head-to-head records and match goalscorers...</p>
        </div>
      ) : stats1 && stats2 ? (
        <div className="space-y-8">
          {/* Top Scoreboard Clash Banner */}
          <div className="glass-card p-6 border-t-4 border-[#00ff87] space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              {/* Club 1 */}
              <div className="flex items-center gap-4">
                <TeamBadge name={stats1.name} colour={stats1.colour} size="lg" />
                <div>
                  <h2 className="text-xl font-black text-white">{stats1.name}</h2>
                  <span className="text-xs text-slate-400 flex items-center gap-1 justify-center md:justify-start">
                    <MapPin size={12} className="text-[#00ff87]" /> {stats1.stadium} ({stats1.country})
                  </span>
                  <div className="flex gap-1 mt-1.5">
                    {stats1.recent_form.map((f, i) => (
                      <span
                        key={i}
                        className={f === 'W' ? 'badge-win text-[10px]' : f === 'A' || f === 'L' ? 'badge-loss text-[10px]' : 'badge-draw text-[10px]'}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Head-to-Head Record Badge */}
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">
                  Historical Head-to-Head
                </span>
                <div className="flex items-center gap-4 bg-black/40 px-5 py-2 rounded-2xl border border-white/10 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#00ff87] font-mono">{h2h?.team1_wins || 0}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[80px]">{stats1.name}</div>
                  </div>
                  <div className="text-center px-2 border-x border-white/10">
                    <div className="text-2xl font-black text-amber-400 font-mono">{h2h?.draws || 0}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Draws</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-rose-400 font-mono">{h2h?.team2_wins || 0}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[80px]">{stats2.name}</div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 font-medium">
                  {totalMeetings} Total Meetings • {h2h?.team1_goals || 0} - {h2h?.team2_goals || 0} Total Goals
                </span>
              </div>

              {/* Club 2 */}
              <div className="flex items-center gap-4 flex-row-reverse md:flex-row text-right md:text-right">
                <div className="text-right">
                  <h2 className="text-xl font-black text-white">{stats2.name}</h2>
                  <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    <MapPin size={12} className="text-[#00ff87]" /> {stats2.stadium} ({stats2.country})
                  </span>
                  <div className="flex gap-1 mt-1.5 justify-end">
                    {stats2.recent_form.map((f, i) => (
                      <span
                        key={i}
                        className={f === 'W' ? 'badge-win text-[10px]' : f === 'A' || f === 'L' ? 'badge-loss text-[10px]' : 'badge-draw text-[10px]'}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <TeamBadge name={stats2.name} colour={stats2.colour} size="lg" />
              </div>
            </div>

            {/* Dominance Bar */}
            {totalMeetings > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-300 font-bold">
                  <span>{stats1.name} ({t1WinPct}%)</span>
                  <span className="text-amber-400">Draws ({drawPct}%)</span>
                  <span>{stats2.name} ({t2WinPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden flex shadow-inner">
                  <div className="bg-[#00ff87]" style={{ width: `${t1WinPct}%` }} />
                  <div className="bg-amber-400" style={{ width: `${drawPct}%` }} />
                  <div className="bg-rose-500" style={{ width: `${t2WinPct}%` }} />
                </div>
              </div>
            )}

            {/* Run Prediction Shortcut */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400">Ready to simulate this matchup with Machine Learning?</span>
              <Link
                to={`/predict?home=${encodeURIComponent(team1Name)}&away=${encodeURIComponent(team2Name)}`}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-pitch"
              >
                <Sparkles size={14} /> Predict {stats1.name} vs {stats2.name}
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 gap-3">
            <button
              onClick={() => setActiveTab('h2h')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'h2h'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Swords size={16} /> Direct Meetings & Goalscorers ({h2h?.recent_matches.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tactical')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'tactical'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={16} /> Tactical & Squad Radar Comparison
            </button>
          </div>

          {/* Tab 1: Historical Meetings & Goalscorers */}
          {activeTab === 'h2h' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚽</span> Previous Direct Encounters with Match Goalscorers
                </h3>
                <span className="text-xs text-slate-400">
                  {h2h?.seasons_covered?.length || 0} UEFA Champions League Seasons
                </span>
              </div>

              {h2h && h2h.recent_matches.length > 0 ? (
                <div className="space-y-3">
                  {h2h.recent_matches.map(m => {
                    const scorersHome: string[] = Array.isArray(m.scorers_home) ? m.scorers_home : [];
                    const scorersAway: string[] = Array.isArray(m.scorers_away) ? m.scorers_away : [];

                    return (
                      <div
                        key={m.id}
                        className="glass-card p-5 border border-white/10 hover:border-[#00ff87]/30 transition-all space-y-3"
                      >
                        {/* Top Match Bar */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-slate-300 font-semibold">
                              <Calendar size={13} className="text-[#00ff87]" /> {m.date || 'Historical'}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold uppercase tracking-wider">
                              Season {m.season} ({m.stage.toUpperCase()})
                            </span>
                          </div>
                          <span
                            className={
                              m.result === 'D'
                                ? 'badge-draw'
                                : m.winner === team1Name
                                ? 'badge-win'
                                : 'badge-loss'
                            }
                          >
                            {m.winner === 'Draw' ? 'Draw Stalemate' : `${m.winner} Victory`}
                          </span>
                        </div>

                        {/* Teams & Score */}
                        <div className="grid grid-cols-7 items-center text-center py-1">
                          <div className="col-span-3 flex items-center justify-end gap-3">
                            <span className="font-bold text-white text-sm sm:text-base">{m.home_team}</span>
                            <TeamBadge name={m.home_team} size="sm" />
                          </div>

                          <div className="col-span-1">
                            <span className="font-mono text-xl sm:text-2xl font-black text-white bg-black/40 px-3 py-1 rounded-xl border border-white/10 shadow-sm">
                              {m.score}
                            </span>
                          </div>

                          <div className="col-span-3 flex items-center justify-start gap-3">
                            <TeamBadge name={m.away_team} size="sm" />
                            <span className="font-bold text-white text-sm sm:text-base">{m.away_team}</span>
                          </div>
                        </div>

                        {/* Match Goalscorers Details */}
                        <div className="bg-[#04170d] rounded-xl p-3 border border-white/5">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* Home Scorers */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {m.home_team} Goalscorers
                              </span>
                              {scorersHome.length > 0 ? (
                                scorersHome.map((sc, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-white font-medium">
                                    <span className="text-sm">⚽</span>
                                    <span className="text-[#00ff87] font-semibold">{sc}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">No goals</span>
                              )}
                            </div>

                            {/* Away Scorers */}
                            <div className="space-y-1 text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Goalscorers {m.away_team}
                              </span>
                              {scorersAway.length > 0 ? (
                                scorersAway.map((sc, i) => (
                                  <div key={i} className="flex items-center justify-end gap-1.5 text-white font-medium">
                                    <span className="text-[#34d399] font-semibold">{sc}</span>
                                    <span className="text-sm">⚽</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">No goals</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-10 text-center space-y-3">
                  <div className="text-3xl">🏟️</div>
                  <h4 className="font-bold text-white text-base">No Historical Meetings in Dataset</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {team1Name} and {team2Name} have not faced each other in the recorded UEFA Champions League matches (2015-2025). Switch to the Tactical Comparison tab to evaluate their relative squad strengths and metrics.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Tactical Radar & Squad Profiles */}
          {activeTab === 'tactical' && (
            <div className="space-y-6">
              {/* Squad Profiles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile 1 */}
                <div className="glass-card p-6 space-y-4 border-l-4" style={{ borderColor: stats1.colour }}>
                  <div className="flex items-center gap-3">
                    <TeamBadge name={stats1.name} colour={stats1.colour} size="md" />
                    <div>
                      <h4 className="font-bold text-white text-lg">{stats1.name}</h4>
                      <span className="text-xs text-slate-400">{stats1.stadium}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Elo Rating</span>
                      <strong className="text-white font-mono text-sm">{stats1.elo}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Squad Value</span>
                      <strong className="text-[#00ff87] font-mono text-sm">€{stats1.squad_value_M}M</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">UEFA Coef</span>
                      <strong className="text-white font-mono text-sm">{stats1.uefa_coef}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Champions League Win Rate:</span>
                      <span className="font-bold text-white">{stats1.win_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Goals Scored / Match:</span>
                      <span className="font-bold text-[#00ff87]">{stats1.avg_goals_scored}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Goals Conceded / Match:</span>
                      <span className="font-bold text-rose-400">{stats1.avg_goals_conceded}</span>
                    </div>
                  </div>
                </div>

                {/* Profile 2 */}
                <div className="glass-card p-6 space-y-4 border-l-4" style={{ borderColor: stats2.colour }}>
                  <div className="flex items-center gap-3">
                    <TeamBadge name={stats2.name} colour={stats2.colour} size="md" />
                    <div>
                      <h4 className="font-bold text-white text-lg">{stats2.name}</h4>
                      <span className="text-xs text-slate-400">{stats2.stadium}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Elo Rating</span>
                      <strong className="text-white font-mono text-sm">{stats2.elo}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Squad Value</span>
                      <strong className="text-[#00ff87] font-mono text-sm">€{stats2.squad_value_M}M</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">UEFA Coef</span>
                      <strong className="text-white font-mono text-sm">{stats2.uefa_coef}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Champions League Win Rate:</span>
                      <span className="font-bold text-white">{stats2.win_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Goals Scored / Match:</span>
                      <span className="font-bold text-[#00ff87]">{stats2.avg_goals_scored}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Goals Conceded / Match:</span>
                      <span className="font-bold text-rose-400">{stats2.avg_goals_conceded}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row: Radar & Historical Performance Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="glass-card p-6 space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} className="text-[#00ff87]" /> Multi-Dimensional Tactical Radar
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#ffffff20" />
                        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff20" />
                        <Radar name={stats1.name} dataKey="Team1" stroke={stats1.colour || '#00ff87'} fill={stats1.colour || '#00ff87'} fillOpacity={0.4} />
                        <Radar name={stats2.name} dataKey="Team2" stroke={stats2.colour || '#38bdf8'} fill={stats2.colour || '#38bdf8'} fillOpacity={0.4} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Historical Record Bars */}
                <div className="glass-card p-6 space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={14} className="text-[#00ff87]" /> Historical European Record
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#04170d', borderColor: '#ffffff20', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey={team1Name} fill={stats1.colour || '#00ff87'} radius={[4, 4, 0, 0]} />
                        <Bar dataKey={team2Name} fill={stats2.colour || '#38bdf8'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

