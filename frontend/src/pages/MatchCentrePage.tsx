import React, { useEffect, useState } from 'react';
import { Search, Filter, Upload, ChevronLeft, ChevronRight, FileSpreadsheet, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { fetchMatches, fetchTeams, importMatchesCSV, MatchItem, TeamItem } from '../api';
import TeamBadge from '../components/TeamBadge';
import MatchDetailModal from '../components/MatchDetailModal';

export default function MatchCentrePage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ loading: boolean; msg: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchTeams().then(res => setTeams(res)).catch(err => console.error(err));
  }, []);

  const loadMatches = () => {
    setLoading(true);
    fetchMatches({
      team: selectedTeam || undefined,
      season: selectedSeason || undefined,
      stage: selectedStage || undefined,
      status: selectedStatus || undefined,
      page,
      page_size: 20,
    })
      .then(res => {
        setMatches(res.data);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatches();
  }, [page, selectedTeam, selectedSeason, selectedStage, selectedStatus]);

  const handleResetFilters = () => {
    setSelectedTeam('');
    setSelectedSeason('');
    setSelectedStage('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImportStatus({ loading: true, msg: 'Importing match data...', isError: false });
    try {
      const res = await importMatchesCSV(csvFile);
      setImportStatus({ loading: false, msg: res.message, isError: false });
      loadMatches();
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setCsvFile(null);
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Import failed.';
      setImportStatus({ loading: false, msg: typeof msg === 'string' ? msg : JSON.stringify(msg), isError: true });
    }
  };

  const seasonsList = [
    '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
    '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
  ];

  return (
    <div className="container py-8 space-y-6">
      {/* Title & Import Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">UEFA Champions League Match Centre</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Searchable repository of {totalCount.toLocaleString()} completed results and scheduled fixtures.
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
        >
          <Upload size={14} /> Import Match CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Team Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Filter by Club
            </label>
            <select
              value={selectedTeam}
              onChange={e => {
                setSelectedTeam(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-lg bg-navy-800 border border-white/10 text-white text-xs font-medium focus:outline-none"
            >
              <option value="">All Clubs (36 available)</option>
              {teams.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Season Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Filter by Season
            </label>
            <select
              value={selectedSeason}
              onChange={e => {
                setSelectedSeason(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-lg bg-navy-800 border border-white/10 text-white text-xs font-medium focus:outline-none"
            >
              <option value="">All Seasons (2015-2025)</option>
              {seasonsList.map(s => (
                <option key={s} value={s}>
                  Season {s}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Competition Stage
            </label>
            <select
              value={selectedStage}
              onChange={e => {
                setSelectedStage(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-lg bg-navy-800 border border-white/10 text-white text-xs font-medium focus:outline-none"
            >
              <option value="">All Phases</option>
              <option value="group">Group Stage</option>
              <option value="league_phase">League Phase</option>
              <option value="round_of_16">Round of 16</option>
              <option value="quarter_final">Quarter-Final</option>
              <option value="semi_final">Semi-Final</option>
              <option value="final">Final</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Match Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-lg bg-navy-800 border border-white/10 text-white text-xs font-medium focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="FINISHED">Finished (Historical Result)</option>
              <option value="SCHEDULED">Scheduled (Upcoming Fixture)</option>
            </select>
          </div>
        </div>

        {(selectedTeam || selectedSeason || selectedStage || selectedStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
            <span className="text-slate-400">
              Active filters applied • {totalCount} matching fixtures found
            </span>
            <button
              onClick={handleResetFilters}
              className="text-electric-400 hover:text-white underline transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Match Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-3" />
            Loading match records...
          </div>
        ) : matches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-xs text-slate-400 border-b border-white/10">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Season</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold">Home Club</th>
                  <th className="py-3 px-4 font-semibold text-center">Score</th>
                  <th className="py-3 px-4 font-semibold">Away Club</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {matches.map(m => {
                  const hasHomeScorers = m.scorers_home && m.scorers_home.length > 0;
                  const hasAwayScorers = m.scorers_away && m.scorers_away.length > 0;

                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                        <div className="font-semibold text-white">{m.match_date || 'N/A'}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">{m.season}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 uppercase whitespace-nowrap font-medium">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300">
                          {m.stage?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        <TeamBadge name={m.home_team} size="sm" showName />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono text-base font-black text-white bg-black/40 px-3 py-1 rounded-lg border border-white/10 shadow-sm">
                          {m.status === 'FINISHED' ? `${m.goals_home} - ${m.goals_away}` : 'VS'}
                        </span>
                        {(hasHomeScorers || hasAwayScorers) && (
                          <div className="text-[10px] text-slate-400 mt-1 max-w-[220px] truncate mx-auto font-medium" title={`${m.scorers_home?.join(', ') || ''} | ${m.scorers_away?.join(', ') || ''}`}>
                            <span className="text-[#00ff87]">⚽ </span>
                            {m.scorers_home?.[0] || ''}
                            {m.scorers_away?.[0] ? ` • ${m.scorers_away[0]}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        <TeamBadge name={m.away_team} size="sm" showName />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {m.status === 'FINISHED' ? (
                          <span className={m.result === 'H' ? 'badge-win' : m.result === 'A' ? 'badge-loss' : 'badge-draw'}>
                            {m.result === 'H' ? 'Home Win' : m.result === 'A' ? 'Away Win' : 'Draw'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                            Scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedMatchId(m.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-[#00ff87]/20 text-slate-300 hover:text-[#00ff87] transition-all border border-transparent hover:border-[#00ff87]/30 shadow-sm"
                          title="View In-Depth Match Details, Goalscorers & xG"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            No matches found matching the specified filters.
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount.toLocaleString()} total matches)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Match Detail Modal */}
      <MatchDetailModal
        matchId={selectedMatchId}
        isOpen={selectedMatchId !== null}
        onClose={() => setSelectedMatchId(null)}
      />

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card bg-navy-800 p-6 rounded-2xl border border-white/10 shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-electric" /> Import New Match Records (CSV)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a standard CSV file with match records. Requires columns: <code>season, home_team, away_team, goals_home, goals_away</code>. Duplicates will be safely skipped.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-electric file:text-white hover:file:bg-electric-400 cursor-pointer"
              />

              {importStatus && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    importStatus.isError
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {importStatus.isError ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                  <span>{importStatus.msg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importStatus?.loading}
                  className="btn-primary py-2 px-5 text-xs"
                >
                  {importStatus?.loading ? 'Uploading...' : 'Process Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
