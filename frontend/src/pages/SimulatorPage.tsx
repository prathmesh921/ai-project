import React, { useEffect, useState } from 'react';
import { Trophy, Play, CheckSquare, Square, Sparkles, RefreshCw } from 'lucide-react';
import { fetchTeams, simulateTournament, TeamItem, SimResponse } from '../api';
import TeamBadge from '../components/TeamBadge';

export default function SimulatorPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [simulations, setSimulations] = useState<number>(1000);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [results, setResults] = useState<SimResponse | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(res => {
        setTeams(res);
        // Default select top 8 teams by Elo
        const top8 = res.slice(0, 8).map(t => t.name);
        setSelectedTeams(top8);
      })
      .catch(err => console.error(err));
  }, []);

  const toggleTeam = (name: string) => {
    if (selectedTeams.includes(name)) {
      if (selectedTeams.length <= 2) return;
      setSelectedTeams(s => s.filter(t => t !== name));
    } else {
      if (selectedTeams.length >= 16) return;
      setSelectedTeams(s => [...s, name]);
    }
  };

  const selectTop8 = () => {
    setSelectedTeams(teams.slice(0, 8).map(t => t.name));
  };

  const selectTop16 = () => {
    setSelectedTeams(teams.slice(0, 16).map(t => t.name));
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await simulateTournament(selectedTeams, simulations);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Sort simulated teams by winner probability
  const sortedProbabilities = results
    ? Object.entries(results.probabilities).sort((a, b) => b[1].winner - a[1].winner)
    : [];

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Trophy size={14} /> Monte Carlo Tournament Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Champions League Bracket Simulator</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Simulate 1,000 tournament brackets using trained machine learning match probabilities to project qualification rates and tournament champions.
        </p>
      </div>

      {/* Simulator Controls & Team Selection */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Select Knockout Competitors</h2>
            <p className="text-xs text-slate-400">
              Selected: <strong className="text-electric-400 font-mono">{selectedTeams.length}</strong> clubs (Recommended: 8 or 16)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectTop8}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              Top 8
            </button>
            <button
              onClick={selectTop16}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              Top 16
            </button>
            <button
              onClick={handleSimulate}
              disabled={simulating || selectedTeams.length < 2}
              className="btn-primary py-2 px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              {simulating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              {simulating ? 'Simulating...' : `Simulate ${simulations.toLocaleString()} Runs`}
            </button>
          </div>
        </div>

        {/* Club Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
          {teams.map(t => {
            const isSelected = selectedTeams.includes(t.name);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTeam(t.name)}
                className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-electric/20 border-electric text-white'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="truncate pr-1">{t.name}</span>
                {isSelected ? (
                  <CheckSquare size={14} className="text-electric shrink-0" />
                ) : (
                  <Square size={14} className="shrink-0 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Results Display */}
      {results && (
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" /> Projected Tournament Winners
              </h2>
              <p className="text-xs text-slate-400">
                Probability of lifting the trophy across {results.n_simulations.toLocaleString()} Monte Carlo runs
              </p>
            </div>
            {sortedProbabilities.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorite to Win</span>
                <span className="text-lg font-black text-amber-400">
                  {sortedProbabilities[0][0]} ({(sortedProbabilities[0][1].winner * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Club</th>
                  <th className="pb-3 font-semibold text-center">Semi-Final %</th>
                  <th className="pb-3 font-semibold text-center">Final %</th>
                  <th className="pb-3 font-semibold text-center">Winner Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedProbabilities.map(([teamName, probs], idx) => {
                  const winPct = (probs.winner * 100).toFixed(1);
                  const isTop = idx === 0;
                  return (
                    <tr key={teamName} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 text-xs font-mono text-slate-400">#{idx + 1}</td>
                      <td className="py-3 font-semibold text-white whitespace-nowrap">
                        <TeamBadge name={teamName} size="sm" showName />
                      </td>
                      <td className="py-3 text-center font-mono text-xs text-slate-300">
                        {(probs.sf * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 text-center font-mono text-xs text-slate-300">
                        {(probs.final * 100).toFixed(1)}%
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-36 sm:w-48 bg-navy-900 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isTop
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-glow-gold'
                                  : 'bg-electric'
                              }`}
                              style={{ width: `${winPct}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isTop ? 'text-amber-400' : 'text-white'
                            }`}
                          >
                            {winPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
