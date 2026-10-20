import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, BarChart2, ShieldCheck, AlertCircle, Info, CheckCircle2, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { fetchModelMetrics } from '../api';

const FEATURE_DESCRIPTIONS = [
  {
    feature: 'elo_diff',
    name: 'Elo Rating Advantage',
    category: 'Club Quality',
    formula: '(Home Club Elo - Away Club Elo) + Home Venue Advantage',
    explanation:
      'Elo measures long-term relative playing strength updated dynamically after every European fixture. In football analytics, a +100 Elo differential historically corresponds to roughly a 64% expected win probability for the favored side in a neutral venue.',
  },
  {
    feature: 'sqval_diff',
    name: 'Squad Market Value Gap (€M)',
    category: 'Financial & Depth',
    formula: 'Home Squad Value (€M) - Away Squad Value (€M)',
    explanation:
      'Aggregated market valuation from Transfermarkt reflects squad depth, international talent density, and wage power. Top clubs with €900M+ squads can rotate world-class benches, heavily impacting Champions League knockout depth.',
  },
  {
    feature: 'ucoef_diff',
    name: 'UEFA 5-Year Coefficient',
    category: 'European Pedigree',
    formula: 'Home UEFA Coefficient - Away UEFA Coefficient',
    explanation:
      'Official UEFA club ranking derived strictly from results in European competitions over the past 5 rolling seasons. Reflects continental experience and European tournament pedigree under pressure.',
  },
  {
    feature: 'form_diff',
    name: 'Recent 5-Match Form Differential',
    category: 'Momentum',
    formula: 'Home Form Points (Last 5) - Away Form Points (Last 5)',
    explanation:
      'Calculated strictly from matches prior to the fixture (3 pts for win, 1 pt for draw). Captures short-term tactical momentum, player confidence, and recent performance trajectories.',
  },
  {
    feature: 'home_avg_gf / away_avg_gf',
    name: 'Rolling Average Goals Scored',
    category: 'Attacking Output',
    formula: 'Sum of pre-match goals scored in recent matches / N',
    explanation:
      'Rolling goalscoring averages quantify offensive finishing efficiency and chance conversion rate prior to entering the contest.',
  },
  {
    feature: 'home_avg_ga / away_avg_ga',
    name: 'Rolling Average Goals Conceded',
    category: 'Defensive Resilience',
    formula: 'Sum of pre-match goals conceded in recent matches / N',
    explanation:
      'Rolling defensive leakage indicator. Teams with low goals conceded consistently advance deeper into the knockout stages.',
  },
  {
    feature: 'rest_days_diff',
    name: 'Physical Rest Days Advantage',
    category: 'Fatigue & Congestion',
    formula: 'Home Rest Days - Away Rest Days',
    explanation:
      'The difference in calendar days since each club’s previous competitive domestic or European match. Highlights fixture congestion and squad fatigue.',
  },
  {
    feature: 'is_knockout',
    name: 'Competition Phase Indicator',
    category: 'Context',
    formula: '1 if Knockout Stage (R16, QF, SF, Final); 0 if Group / League Phase',
    explanation:
      'Knockout ties feature higher stakes and defensive caution compared to round-robin group fixtures, resulting in tighter goal margins.',
  },
];

export default function ExplainabilityPage() {
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchModelMetrics()
      .then(res => {
        const sorted = (res.feature_importance || []).map(item => ({
          feature: item.feature,
          importance: +(item.importance * 100).toFixed(1),
        }));
        setFeatureImportance(sorted);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/15 text-electric-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle size={14} /> Explainable Artificial Intelligence (XAI)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Model Explainability & Feature Insights</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Understanding why the machine learning models predict specific outcomes, how features are engineered without data leakage, and why correlation does not equate to clinical causation.
        </p>
      </div>

      {/* Feature Importance Bar Chart */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 size={18} className="text-electric" /> Random Forest Gini Feature Importance
          </h2>
          <span className="text-xs text-slate-400">Mean Decrease in Impurity</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The chart below illustrates the relative proportion of statistical entropy reduction contributed by each feature across all 150 decision trees in the ensemble:
        </p>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading feature importances...</div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1526', borderColor: '#ffffff20', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val}%`, 'Relative Importance']}
                />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Critical Methodology Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-3 border-l-4 border-l-emerald-400">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" /> Prevention of Temporal Data Leakage
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            A fatal flaw in naive sports ML projects is including the match being predicted in its own rolling averages (e.g. including today's goals in today's form).
            In this project, all rolling features are shifted by <code>t-1</code>: only matches that concluded <em>strictly prior</em> to the kickoff timestamp are used to construct feature vectors.
          </p>
        </div>

        <div className="glass-card p-6 space-y-3 border-l-4 border-l-amber-400">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400" /> Correlation vs Causation Notice
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            High feature importance signifies that a variable effectively splits the feature space to separate match outcomes in historical records.
            However, feature importance reflects statistical association rather than clinical causation (e.g. having higher squad market value does not magically score goals without tactical execution).
          </p>
        </div>
      </div>

      {/* Feature Dictionary */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Feature Engineering Dictionary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURE_DESCRIPTIONS.map((f, i) => (
            <div key={i} className="glass-card p-5 space-y-2 border border-white/5 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">{f.name}</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-electric/15 text-electric-400">
                  {f.category}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 bg-black/30 p-1.5 rounded">
                Formula: {f.formula}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">{f.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
