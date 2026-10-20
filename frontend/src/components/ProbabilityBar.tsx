import React from 'react';
import { motion } from 'framer-motion';

interface ProbabilityBarProps {
  probH: number;
  probD: number;
  probA: number;
  homeTeam: string;
  awayTeam: string;
  homeColour?: string;
  awayColour?: string;
}

export default function ProbabilityBar({
  probH,
  probD,
  probA,
  homeTeam,
  awayTeam,
  homeColour = '#3b82f6',
  awayColour = '#ef4444',
}: ProbabilityBarProps) {
  const pctH = (probH * 100).toFixed(1);
  const pctD = (probD * 100).toFixed(1);
  const pctA = (probA * 100).toFixed(1);

  return (
    <div className="w-full space-y-3">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-1.5 text-blue-400">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColour }}></span>
          <span>{homeTeam} Win: <strong className="text-white font-mono text-base">{pctH}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Draw: <strong className="text-white font-mono text-base">{pctD}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColour }}></span>
          <span>{awayTeam} Win: <strong className="text-white font-mono text-base">{pctA}%</strong></span>
        </div>
      </div>

      {/* Segmented Bar */}
      <div className="h-4 w-full bg-navy-800 rounded-full overflow-hidden flex p-0.5 border border-white/10 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctH}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-l-full relative group cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(90deg, ${homeColour}, #2563eb)` }}
          title={`${homeTeam} Win: ${pctH}%`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctD}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full relative group cursor-pointer bg-gradient-to-r from-amber-500 to-amber-400 transition-opacity hover:opacity-90"
          title={`Draw: ${pctD}%`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctA}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-r-full relative group cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(90deg, #dc2626, ${awayColour})` }}
          title={`${awayTeam} Win: ${pctA}%`}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-500">
        <span>* Calibrated model probabilities sum strictly to 100.0%</span>
        <span>Independent multiclass soft probabilities</span>
      </div>
    </div>
  );
}
