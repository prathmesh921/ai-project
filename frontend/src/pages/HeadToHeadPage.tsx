import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Trophy, Calendar, MapPin, Swords } from 'lucide-react';
import { fetchTeams, fetchHeadToHead, TeamItem, HeadToHeadResponse } from '../api';
import TeamBadge from '../components/TeamBadge';

export default function HeadToHeadPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [team1, setTeam1] = useState<string>('Real Madrid');
  const [team2, setTeam2] = useState<string>('Manchester City');
  const [h2h, setH2H] = useState<HeadToHeadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeams()
      .then(res => {
        setTeams(res);
        if (res.length >= 2) {
          setTeam1(res[0].name);
          setTeam2(res[1].name);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (team1 && team2 && team1 !== team2) {
      setLoading(true);
      fetchHeadToHead(team1, team2)
        .then(res => setH2H(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [team1, team2]);

  const handleSwap = () => {
    const t = team1;
    setTeam1(team2);
    setTeam2(t);
  };

  const t1Club = teams.find(t => t.name === team1);
  const t2Club = teams.find(t => t.name === team2);

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/15 text-electric-400 text-xs font-bold uppercase tracking-wider">
          <Swords size={14} /> Historical Encounters
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Direct Head-to-Head Record</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Explore the historical Champions League meeting record, goal margins, and past outcomes between any two clubs.
        </p>
      </div>

      {/* Team Selectors Bar */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Club A
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-navy-800 border border-white/10">
            <TeamBadge name={team1} colour={t1Club?.colour} size="sm" />
            <select
              value={team1}
              onChange={e => setTeam1(e.target.value)}
              className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t.id} value={t.name} className="bg-navy-800 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-electric/20 transition-all"
            title="Swap Clubs"
          >
            <ArrowRightLeft size={16} />
          </button>
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Club B
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-navy-800 border border-white/10">
            <TeamBadge name={team2} colour={t2Club?.colour} size="sm" />
            <select
              value={team2}
              onChange={e => setTeam2(e.target.value)}
              className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t.id} value={t.name} className="bg-navy-800 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-3" />
          Loading head-to-head records...
        </div>
      ) : h2h ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Total Meetings</span>
              <strong className="text-3xl font-black text-white font-mono">{h2h.total_meetings}</strong>
              <span className="text-[11px] text-slate-500 block mt-1">Dataset coverage</span>
            </div>

            <div className="glass-card p-5 text-center border-t-2" style={{ borderColor: t1Club?.colour }}>
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1 truncate">{team1} Wins</span>
              <strong className="text-3xl font-black text-blue-400 font-mono">{h2h.team1_wins}</strong>
              <span className="text-[11px] text-slate-500 block mt-1">{h2h.team1_goals} Goals Scored</span>
            </div>

            <div className="glass-card p-5 text-center border-t-2 border-amber-400">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Draws</span>
              <strong className="text-3xl font-black text-amber-400 font-mono">{h2h.draws}</strong>
              <span className="text-[11px] text-slate-500 block mt-1">Stalemates</span>
            </div>

            <div className="glass-card p-5 text-center border-t-2" style={{ borderColor: t2Club?.colour }}>
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1 truncate">{team2} Wins</span>
              <strong className="text-3xl font-black text-rose-400 font-mono">{h2h.team2_wins}</strong>
              <span className="text-[11px] text-slate-500 block mt-1">{h2h.team2_goals} Goals Scored</span>
            </div>
          </div>

          {/* Past Meetings List */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Previous Champions League Meetings</h2>
            {h2h.recent_matches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="pb-3 font-semibold">Season</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Stage</th>
                      <th className="pb-3 font-semibold">Home Club</th>
                      <th className="pb-3 font-semibold text-center">Score</th>
                      <th className="pb-3 font-semibold">Away Club</th>
                      <th className="pb-3 font-semibold text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {h2h.recent_matches.map(m => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-xs text-slate-400 whitespace-nowrap">{m.season}</td>
                        <td className="py-3 text-xs text-slate-400 whitespace-nowrap">{m.date || 'Historical'}</td>
                        <td className="py-3 text-xs text-slate-400 uppercase whitespace-nowrap">{m.stage}</td>
                        <td className="py-3 font-semibold text-white whitespace-nowrap">{m.home_team}</td>
                        <td className="py-3 text-center font-mono font-black text-white whitespace-nowrap">{m.score}</td>
                        <td className="py-3 font-semibold text-white whitespace-nowrap">{m.away_team}</td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              m.result === 'D'
                                ? 'badge-draw'
                                : m.winner === team1
                                ? 'badge-win'
                                : 'badge-loss'
                            }`}
                          >
                            {m.winner}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white/5 rounded-xl text-sm">
                No previous direct meetings recorded between {team1} and {team2} in the 2015-2025 dataset.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
