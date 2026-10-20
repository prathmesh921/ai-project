import React from 'react';
import { ScorelineProbability } from '../api';

interface ScorelineHeatmapProps {
  scorelines: ScorelineProbability[];
  mostLikely: { home: number; away: number };
  homeTeam: string;
  awayTeam: string;
}

export default function ScorelineHeatmap({ scorelines, mostLikely, homeTeam, awayTeam }: ScorelineHeatmapProps) {
  const top12 = scorelines.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Estimated Scoreline Distribution (Poisson xG Model)</span>
        <span className="text-amber-400 font-medium">Most Likely: {mostLikely.home} - {mostLikely.away}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {top12.map((s, idx) => {
          const isTop = s.home_goals === mostLikely.home && s.away_goals === mostLikely.away;
          const pct = (s.probability * 100).toFixed(1);
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isTop
                  ? 'bg-amber-500/20 border-amber-400/50 shadow-glow-gold'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="font-mono text-base font-bold text-white mb-0.5">
                {s.home_goals} - {s.away_goals}
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {pct}%
              </div>
              {isTop && (
                <span className="inline-block mt-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Top Pick
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 italic">
        * Note: Scorelines are evaluated separately via Poisson goal distribution based on team attack/defense coefficients, not derived purely from outcome probabilities.
      </p>
    </div>
  );
}
