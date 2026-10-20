import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][]; // 3x3: [[AA, AD, AH], [DA, DD, DH], [HA, HD, HH]]
  labels?: string[];
  modelName: string;
}

export default function ConfusionMatrix({ matrix, labels = ['Away Win (A)', 'Draw (D)', 'Home Win (H)'], modelName }: ConfusionMatrixProps) {
  if (!matrix || matrix.length < 3) return null;

  // Find max value for color scaling
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Confusion Matrix — {modelName.replace(/_/g, ' ').toUpperCase()}</span>
        <span>Rows: Ground Truth | Columns: Model Prediction</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-slate-500 font-normal">Actual \ Pred</th>
              {labels.map((lbl, idx) => (
                <th key={idx} className="p-2 text-xs font-semibold text-electric-400">
                  {lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="p-2 text-xs font-semibold text-slate-300 text-left whitespace-nowrap">
                  {labels[rIdx]}
                </td>
                {row.map((val, cIdx) => {
                  const isDiag = rIdx === cIdx;
                  const ratio = val / maxVal;
                  const bg = isDiag
                    ? `rgba(59, 130, 246, ${Math.max(0.2, ratio * 0.85)})`
                    : `rgba(239, 68, 68, ${Math.max(0.05, ratio * 0.4)})`;

                  return (
                    <td
                      key={cIdx}
                      className="p-3 font-mono text-sm font-bold border border-white/5 rounded transition-transform hover:scale-105"
                      style={{ backgroundColor: bg }}
                      title={`Actual ${labels[rIdx]}, Predicted ${labels[cIdx]}: ${val} matches`}
                    >
                      <span className={isDiag ? 'text-white' : 'text-slate-300'}>{val}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Diagonal: Correct predictions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/40"></span> Off-diagonal: Classification errors
        </span>
      </div>
    </div>
  );
}
