import React, { useEffect, useState } from 'react';
import { History, Trash2, Search, Calendar, Shield, Trophy } from 'lucide-react';
import { fetchPredictionHistory, deletePrediction, clearAllPredictions, PredictionHistoryItem } from '../api';
import TeamBadge from '../components/TeamBadge';

export default function PredictionHistoryPage() {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTeam, setSearchTeam] = useState<string>('');

  const loadHistory = () => {
    setLoading(true);
    fetchPredictionHistory({ team: searchTeam || undefined, limit: 50 })
      .then(res => setHistory(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [searchTeam]);

  const handleDelete = async (id: number) => {
    try {
      await deletePrediction(id);
      setHistory(h => h.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all saved prediction records?')) return;
    try {
      await clearAllPredictions();
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <History size={26} className="text-electric" /> Prediction History & Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Persistent log of all match outcome predictions generated and stored in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by club..."
              value={searchTeam}
              onChange={e => setSearchTeam(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-navy-800 border border-white/10 text-white text-xs focus:outline-none focus:border-electric"
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Clear All Predictions"
            >
              <Trash2 size={14} /> Clear Log
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-2" />
            Loading prediction log...
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-xs text-slate-400 border-b border-white/10">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Home Club</th>
                  <th className="py-3 px-4 font-semibold text-center">Estimated Score</th>
                  <th className="py-3 px-4 font-semibold">Away Club</th>
                  <th className="py-3 px-4 font-semibold text-center">Predicted Outcome</th>
                  <th className="py-3 px-4 font-semibold text-center">Probabilities (H/D/A)</th>
                  <th className="py-3 px-4 font-semibold text-center">Confidence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      <TeamBadge name={item.home_team} size="sm" showName />
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                      {item.predicted_score_home} - {item.predicted_score_away}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      <TeamBadge name={item.away_team} size="sm" showName />
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={
                          item.predicted_outcome === 'Home Win'
                            ? 'badge-win'
                            : item.predicted_outcome === 'Away Win'
                            ? 'badge-loss'
                            : 'badge-draw'
                        }
                      >
                        {item.predicted_outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-300 whitespace-nowrap">
                      {(item.prob_home_win * 100).toFixed(0)}% / {(item.prob_draw * 100).toFixed(0)}% / {(item.prob_away_win * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-xs text-slate-300 font-medium">{item.confidence_level}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Trophy size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No predictions saved yet.</p>
            <p className="text-xs text-slate-500">Run a match prediction from the Predictor page to automatically record audit logs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
