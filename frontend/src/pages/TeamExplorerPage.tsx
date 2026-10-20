import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, MapPin, X, TrendingUp, Shield, Activity, Target } from 'lucide-react';
import { fetchTeams, fetchTeamStats, TeamItem, TeamStats } from '../api';
import TeamBadge from '../components/TeamBadge';

export default function TeamExplorerPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Selected team profile modal
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  useEffect(() => {
    fetchTeams()
      .then(res => setTeams(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenTeam = (team: TeamItem) => {
    setSelectedTeam(team);
    setLoadingStats(true);
    fetchTeamStats(team.name)
      .then(res => setTeamStats(res))
      .catch(err => console.error(err))
      .finally(() => setLoadingStats(false));
  };

  const filteredTeams = teams.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">UEFA Champions League Clubs Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Official profiles and European tournament statistics for all 36 clubs in the active dataset.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by club or nation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-electric"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-3" />
          Loading club profiles...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeams.map(t => (
            <motion.div
              key={t.id}
              whileHover={{ y: -4 }}
              onClick={() => handleOpenTeam(t)}
              className="glass-card p-5 cursor-pointer space-y-4 border border-white/10 hover:border-electric/50 transition-all hover:shadow-glow"
            >
              <div className="flex items-center gap-3">
                <TeamBadge name={t.name} colour={t.colour} size="md" />
                <div className="truncate">
                  <h3 className="font-bold text-white text-sm truncate">{t.name}</h3>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={11} /> {t.country}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-white/5">
                <div className="p-1.5 rounded bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Elo</span>
                  <strong className="text-white font-mono">{t.elo}</strong>
                </div>
                <div className="p-1.5 rounded bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Squad</span>
                  <strong className="text-white font-mono">€{t.squad_value_M}M</strong>
                </div>
                <div className="p-1.5 rounded bg-white/5">
                  <span className="text-[10px] text-slate-400 block">UEFA Coef</span>
                  <strong className="text-white font-mono">{t.uefa_coef}</strong>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Team Details Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card bg-navy-800 p-6 sm:p-8 rounded-2xl border border-white/10 shadow-glass space-y-6"
            >
              <button
                onClick={() => setSelectedTeam(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>

              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <TeamBadge name={selectedTeam.name} colour={selectedTeam.colour} size="xl" />
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedTeam.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin size={13} className="text-electric-400" />
                    {selectedTeam.stadium} • {selectedTeam.country}
                  </p>
                </div>
              </div>

              {loadingStats ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-2" />
                  Compiling match statistics...
                </div>
              ) : teamStats ? (
                <div className="space-y-6">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <span className="text-xs text-slate-400 block mb-0.5">Matches Played</span>
                      <strong className="text-xl font-bold text-white font-mono">{teamStats.total_matches}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <span className="text-xs text-slate-400 block mb-0.5">Win Rate</span>
                      <strong className="text-xl font-bold text-electric-400 font-mono">{teamStats.win_rate}%</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <span className="text-xs text-slate-400 block mb-0.5">Record (W-D-L)</span>
                      <strong className="text-xl font-bold text-white font-mono">
                        {teamStats.wins}-{teamStats.draws}-{teamStats.losses}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <span className="text-xs text-slate-400 block mb-0.5">Goal Diff</span>
                      <strong className="text-xl font-bold text-emerald-400 font-mono">
                        {teamStats.goal_difference > 0 ? `+${teamStats.goal_difference}` : teamStats.goal_difference}
                      </strong>
                    </div>
                  </div>

                  {/* Form and Splits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-xs text-slate-400 font-semibold uppercase block">
                        Recent 5 Fixtures Form
                      </span>
                      <div className="flex gap-2">
                        {teamStats.recent_form.map((f, idx) => (
                          <span
                            key={idx}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              f === 'W'
                                ? 'badge-win'
                                : f === 'A' || f === 'L'
                                ? 'badge-loss'
                                : 'badge-draw'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-xs text-slate-400 font-semibold uppercase block">
                        Home vs Away Split
                      </span>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>
                          Home Record: <strong>{teamStats.home_record.wins}W - {teamStats.home_record.draws}D - {teamStats.home_record.losses}L</strong>
                        </div>
                        <div>
                          Away Record: <strong>{teamStats.away_record.wins}W - {teamStats.away_record.draws}D - {teamStats.away_record.losses}L</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Season by Season Breakdown Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Season-by-Season Tournament Record
                    </h4>
                    <div className="overflow-x-auto max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-2">Season</th>
                            <th className="pb-2 text-center">Played</th>
                            <th className="pb-2 text-center">W</th>
                            <th className="pb-2 text-center">D</th>
                            <th className="pb-2 text-center">L</th>
                            <th className="pb-2 text-center">GF</th>
                            <th className="pb-2 text-center">GA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Object.entries(teamStats.season_records).map(([season, rec]) => (
                            <tr key={season} className="hover:bg-white/5">
                              <td className="py-2 text-slate-300 font-medium">{season}</td>
                              <td className="py-2 text-center font-mono">{rec.P}</td>
                              <td className="py-2 text-center font-mono text-emerald-400">{rec.W}</td>
                              <td className="py-2 text-center font-mono text-amber-400">{rec.D}</td>
                              <td className="py-2 text-center font-mono text-rose-400">{rec.L}</td>
                              <td className="py-2 text-center font-mono">{rec.GF}</td>
                              <td className="py-2 text-center font-mono">{rec.GA}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
