import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Trophy, Shield, Flame } from 'lucide-react';
import { fetchMatchDetail } from '../api';
import TeamBadge from './TeamBadge';

interface MatchDetailModalProps {
  matchId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchDetailModal({ matchId, isOpen, onClose }: MatchDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (matchId && isOpen) {
      setLoading(true);
      fetchMatchDetail(matchId)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [matchId, isOpen]);

  if (!isOpen) return null;

  const scorersHome: string[] = Array.isArray(data?.scorers_home) ? data.scorers_home : [];
  const scorersAway: string[] = Array.isArray(data?.scorers_away) ? data.scorers_away : [];
  const totalGoals = (data?.goals_home || 0) + (data?.goals_away || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#061d11] border border-[#00ff87]/30 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(0,255,135,0.15)] overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Top stadium floodlight glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-[#00ff87]/10 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors z-10"
          >
            <X size={20} />
          </button>

          {loading ? (
            <div className="py-20 text-center text-slate-300">
              <div className="animate-spin w-10 h-10 border-3 border-[#00ff87] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="font-semibold text-sm">Loading stadium match data...</p>
            </div>
          ) : data ? (
            <div className="space-y-6 relative z-10">
              {/* Header Match Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Calendar size={14} className="text-[#00ff87]" />
                    {data.match_date || 'Historical Match'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider">
                    <Trophy size={14} />
                    {data.season} ({data.stage?.replace('_', ' ').toUpperCase()})
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin size={14} className="text-emerald-400" />
                  {data.stadium}
                </span>
              </div>

              {/* Match Scoreboard Pitch Display */}
              <div className="bg-gradient-to-b from-[#0b331e]/90 to-[#072415]/90 border border-white/10 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                <div className="grid grid-cols-7 items-center text-center">
                  {/* Home Club */}
                  <div className="col-span-3 flex flex-col items-center gap-2">
                    <TeamBadge name={data.home_team} colour={data.home_colour} size="lg" />
                    <span className="font-extrabold text-white text-base md:text-lg tracking-tight leading-tight">
                      {data.home_team}
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      Elo {data.home_elo}
                    </span>
                  </div>

                  {/* Score Pill */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="font-mono text-3xl sm:text-5xl font-black text-white tracking-widest bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                      {data.goals_home !== null ? `${data.goals_home}:${data.goals_away}` : 'VS'}
                    </div>
                    <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                      {data.status === 'FINISHED'
                        ? data.result === 'H'
                          ? 'Home Win'
                          : data.result === 'A'
                          ? 'Away Win'
                          : 'Draw'
                        : 'Scheduled'}
                    </span>
                  </div>

                  {/* Away Club */}
                  <div className="col-span-3 flex flex-col items-center gap-2">
                    <TeamBadge name={data.away_team} colour={data.away_colour} size="lg" />
                    <span className="font-extrabold text-white text-base md:text-lg tracking-tight leading-tight">
                      {data.away_team}
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      Elo {data.away_elo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Goalscorers Timeline Section */}
              <div className="bg-[#04170d]/90 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#00ff87] flex items-center gap-2">
                    <span>⚽</span> Match Goalscorers
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {totalGoals} Total Goals Scored
                  </span>
                </div>

                {totalGoals === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    Goalless Encounter — Both defenses kept a clean sheet (0 - 0).
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    {/* Home Scorers */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        {data.home_team} ({scorersHome.length})
                      </span>
                      {scorersHome.length > 0 ? (
                        scorersHome.map((sc, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white font-medium shadow-sm"
                          >
                            <span className="text-base leading-none">⚽</span>
                            <span className="font-bold text-[#00ff87]">{sc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 italic block py-1">— None —</span>
                      )}
                    </div>

                    {/* Away Scorers */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1 text-right">
                        ({scorersAway.length}) {data.away_team}
                      </span>
                      {scorersAway.length > 0 ? (
                        scorersAway.map((sc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-end gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white font-medium shadow-sm"
                          >
                            <span className="font-bold text-[#34d399]">{sc}</span>
                            <span className="text-base leading-none">⚽</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 italic block py-1 text-right">— None —</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Match Statistics & Tactical Performance */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Shield size={14} className="text-[#00ff87]" /> Tactical Match Statistics
                </h3>

                {/* Expected Goals (xG) */}
                <div className="bg-[#072415] border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span className="text-[#00ff87]">{data.xg_home?.toFixed(2) || '1.40'}</span>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[11px]">Expected Goals (xG)</span>
                    <span className="text-emerald-400">{data.xg_away?.toFixed(2) || '1.10'}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#00ff87]"
                      style={{
                        width: `${((data.xg_home || 1) / ((data.xg_home || 1) + (data.xg_away || 1))) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${((data.xg_away || 1) / ((data.xg_home || 1) + (data.xg_away || 1))) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Possession */}
                <div className="bg-[#072415] border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span className="text-[#00ff87]">{data.poss_home}%</span>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[11px]">Ball Possession</span>
                    <span className="text-emerald-400">{data.poss_away}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div className="bg-[#00ff87]" style={{ width: `${data.poss_home}%` }} />
                    <div className="bg-emerald-600" style={{ width: `${data.poss_away}%` }} />
                  </div>
                </div>

                {/* Shots on Target */}
                <div className="bg-[#072415] border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span className="text-[#00ff87]">{data.shots_home}</span>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[11px]">Shots on Target</span>
                    <span className="text-emerald-400">{data.shots_away}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#00ff87]"
                      style={{
                        width: `${((data.shots_home || 1) / Math.max(1, (data.shots_home || 1) + (data.shots_away || 1))) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-emerald-600"
                      style={{
                        width: `${((data.shots_away || 1) / Math.max(1, (data.shots_home || 1) + (data.shots_away || 1))) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Disciplinary & Corners Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-[#04170d] border border-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Disciplinary</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold text-white">
                        <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm inline-block shadow-sm" />
                        {data.yellow_cards_home || 1} - {data.yellow_cards_away || 2}
                      </span>
                      {(data.red_cards_home > 0 || data.red_cards_away > 0) && (
                        <span className="flex items-center gap-1 font-bold text-rose-400">
                          <span className="w-2.5 h-3.5 bg-red-600 rounded-sm inline-block shadow-sm" />
                          {data.red_cards_home || 0} - {data.red_cards_away || 0}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#04170d] border border-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Pre-Match Elo Diff</span>
                    <span className="font-mono font-bold text-[#00ff87]">
                      {data.elo_diff > 0 ? `+${data.elo_diff} (Favored Home)` : `${data.elo_diff} (Favored Away)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">Match fixture record not found.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

