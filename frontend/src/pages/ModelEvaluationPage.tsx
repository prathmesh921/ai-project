import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, AlertTriangle, Info, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { fetchModelMetrics, ModelMetricsResponse } from '../api';
import ConfusionMatrix from '../components/ConfusionMatrix';

export default function ModelEvaluationPage() {
  const [data, setData] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<string>('random_forest');

  useEffect(() => {
    fetchModelMetrics()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-24 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full mx-auto mb-3" />
        Loading rigorous chronological evaluation metrics...
      </div>
    );
  }

  if (!data || !data.models) {
    return (
      <div className="container py-16 text-center text-rose-400">
        Unable to load model metrics. Please run <code>python -m ml.train</code> in the backend.
      </div>
    );
  }

  // Comparison Bar Chart data
  const comparisonData = Object.entries(data.models).map(([key, val]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    Accuracy: +(val.accuracy * 100).toFixed(1),
    'Macro F1': +(val.f1 * 100).toFixed(1),
    Precision: +(val.precision * 100).toFixed(1),
    Recall: +(val.recall * 100).toFixed(1),
  }));

  // Per-class metrics for selected model
  const currentModelReport = data.models[activeModel]?.class_report;
  const classBreakdown = currentModelReport
    ? [
        {
          class: 'Away Win (A)',
          Precision: +(currentModelReport['A']?.precision * 100).toFixed(1),
          Recall: +(currentModelReport['A']?.recall * 100).toFixed(1),
          'F1 Score': +(currentModelReport['A']?.['f1-score'] * 100).toFixed(1),
        },
        {
          class: 'Draw (D)',
          Precision: +(currentModelReport['D']?.precision * 100).toFixed(1),
          Recall: +(currentModelReport['D']?.recall * 100).toFixed(1),
          'F1 Score': +(currentModelReport['D']?.['f1-score'] * 100).toFixed(1),
        },
        {
          class: 'Home Win (H)',
          Precision: +(currentModelReport['H']?.precision * 100).toFixed(1),
          Recall: +(currentModelReport['H']?.recall * 100).toFixed(1),
          'F1 Score': +(currentModelReport['H']?.['f1-score'] * 100).toFixed(1),
        },
      ]
    : [];

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/15 text-electric-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={14} /> Empirical Evaluation & Validation
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Machine Learning Model Evaluation</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          All metrics below are calculated on an independent chronological test set (Seasons 2022-23 to 2024-25, 333 matches) with zero temporal data leakage.
        </p>
      </div>

      {/* Dataset & Split Methodology Card */}
      <div className="glass-card p-6 border-l-4 border-l-electric space-y-3">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Info size={18} className="text-electric" /> Chronological Train/Test Split Protocol
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard random K-Fold cross validation causes serious <em>temporal data leakage</em> in sports prediction because future matches are mixed into the training set.
          To eliminate leakage, this project fits all preprocessing scalers, encoders, and decision trees strictly on historical seasons (2015-16 through 2021-22), and tests strictly on subsequent future seasons (2022-23 through 2024-25).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-2 rounded bg-white/5">
            <span className="text-slate-400 block text-[10px]">Train Period</span>
            <strong className="text-white">{data.metadata?.train_period || '2015-16 to 2021-22'}</strong>
          </div>
          <div className="p-2 rounded bg-white/5">
            <span className="text-slate-400 block text-[10px]">Test Period</span>
            <strong className="text-white">{data.metadata?.test_period || '2022-23 to 2024-25'}</strong>
          </div>
          <div className="p-2 rounded bg-white/5">
            <span className="text-slate-400 block text-[10px]">Training Size</span>
            <strong className="text-white">{data.metadata?.train_samples || 777} Matches</strong>
          </div>
          <div className="p-2 rounded bg-white/5">
            <span className="text-slate-400 block text-[10px]">Test Size</span>
            <strong className="text-white">{data.metadata?.test_samples || 333} Matches</strong>
          </div>
        </div>
      </div>

      {/* Models Comparative Table */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Model Performance Summary (Chronological Test Set)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="pb-3 font-semibold">Model Architecture</th>
                <th className="pb-3 font-semibold text-center">Accuracy</th>
                <th className="pb-3 font-semibold text-center">Macro F1</th>
                <th className="pb-3 font-semibold text-center">Precision</th>
                <th className="pb-3 font-semibold text-center">Recall</th>
                <th className="pb-3 font-semibold text-center">Log Loss</th>
                <th className="pb-3 text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(data.models).map(([name, m]) => (
                <tr
                  key={name}
                  onClick={() => setActiveModel(name)}
                  className={`cursor-pointer transition-colors ${
                    activeModel === name ? 'bg-electric/15 text-white' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-3 font-bold text-white capitalize">
                    {name.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-electric-400">
                    {(m.accuracy * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-center font-mono text-white">
                    {(m.f1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-center font-mono text-slate-300">
                    {(m.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-center font-mono text-slate-300">
                    {(m.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-center font-mono text-amber-400">
                    {m.log_loss ? m.log_loss.toFixed(3) : 'N/A'}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        name === 'logistic_regression'
                          ? 'bg-slate-500/20 text-slate-300'
                          : name === 'random_forest'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {name === 'logistic_regression'
                        ? 'Baseline'
                        : name === 'random_forest'
                        ? 'Primary Classifier'
                        : 'Gradient Boosted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Comparison Chart */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Benchmark Comparison (Accuracy vs Macro F1)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#ffffff20', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Macro F1" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Confusion Matrix & Per-Class Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Confusion Matrix</h3>
            <div className="flex gap-1.5">
              {Object.keys(data.models).map(mKey => (
                <button
                  key={mKey}
                  onClick={() => setActiveModel(mKey)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeModel === mKey ? 'bg-electric text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {mKey === 'logistic_regression' ? 'LR' : mKey === 'random_forest' ? 'RF' : 'XGB'}
                </button>
              ))}
            </div>
          </div>

          <ConfusionMatrix
            matrix={data.models[activeModel]?.confusion_matrix}
            modelName={activeModel}
          />
        </div>

        {/* Per-Class Breakdown Chart */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-white text-base">
            Per-Class Metrics — {activeModel.replace(/_/g, ' ').toUpperCase()}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Note how Draw (D) exhibits lower recall across sports classification models—a well-documented challenge in football analytics.
          </p>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="class" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#ffffff20', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Precision" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1 Score" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Calibration Curve Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Probability Calibration Analysis</h3>
          <span className="text-xs text-emerald-400 font-semibold">Reliable Probability Scaling</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Compares predicted outcome probabilities against actual observed win frequencies. A perfectly calibrated model follows the dashed 45-degree diagonal.
        </p>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.calibration} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="bin" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#ffffff20', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="predicted_prob" stroke="#94a3b8" strokeDasharray="4 4" name="Predicted Probability Bin" />
              <Line type="monotone" dataKey="observed_win_rate" stroke="#3b82f6" strokeWidth={3} name="Observed Actual Win Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Limitations Card */}
      <div className="glass-card p-6 space-y-3 border-l-4 border-l-amber-400">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" /> Academic Discussion & Limitations
        </h3>
        <ul className="space-y-2 text-xs text-slate-300">
          {data.limitations.map((lim, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
