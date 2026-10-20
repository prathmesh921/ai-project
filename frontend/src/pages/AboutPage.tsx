import React, { useState } from 'react';
import { BookOpen, GraduationCap, Code2, Database, Cpu, HelpCircle, ChevronDown, ChevronUp, CheckCircle, Shield } from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    q: '1. What is the core problem statement and objective of this project?',
    a: 'The objective is to predict association football match outcomes (Home Win, Draw, Away Win) in the UEFA Champions League using empirical machine learning classifiers and historical match performance metrics, while eliminating temporal data leakage and providing explainable feature attributions.',
  },
  {
    q: '2. Why did you choose a 3-class classification approach instead of regression?',
    a: 'Football matches have three mutually exclusive categorical outcomes: Home Win (H), Draw (D), and Away Win (A). Multiclass classification directly predicts probability distribution P(H), P(D), P(A) summing to 1.0. Exact goal regression suffers from high variance and fails to capture tactical draw states.',
  },
  {
    q: '3. What is temporal data leakage and how did you prevent it?',
    a: 'Temporal data leakage occurs when future match information is accidentally fed into model training or feature generation (e.g. using random K-Fold cross validation or unshifted rolling averages). We solved this in two ways: (1) All rolling statistics (goals, form, rest days) are shifted by t-1, using only matches strictly prior to kickoff. (2) We used a chronological train/test split: Seasons 2015-16 to 2021-22 for training, and 2022-23 to 2024-25 for testing.',
  },
  {
    q: '4. Why is predicting a Draw (D) historically difficult in football analytics?',
    a: 'Draws represent an equilibrium state resulting from low scoring frequency (most football matches finish with 0-3 total goals). Teams with asymmetric strengths often settle for tactical draws depending on aggregate knockout math. In machine learning, draw recall is typically under 15% across all published sports literature.',
  },
  {
    q: '5. Which machine learning algorithms are implemented and why?',
    a: 'We implemented: (1) Logistic Regression as a linear baseline, fitted with L2 regularization. (2) Random Forest Classifier as our primary non-linear ensemble, using 150 bagged decision trees with Gini impurity splitting. (3) XGBoost (Extreme Gradient Boosting) for sequential gradient error minimization.',
  },
  {
    q: '6. What does the test set accuracy of ~55% represent? Is it good?',
    a: 'Yes, 54-56% is standard for 3-way football outcome prediction. Random guessing yields 33.3%. Professional bookmakers and betting syndicates operate in the 52-57% accuracy range because football is an inherently low-scoring game subject to significant randomness (deflections, referee decisions, red cards).',
  },
  {
    q: '7. How does your scoreline prediction model work?',
    a: 'As required by best engineering practices, scoreline prediction is an independent Poisson expected goals model, not derived purely from outcome probabilities. We compute lambda_home and lambda_away based on attack and defense parameters, and generate the joint Poisson probability matrix: P(X=x, Y=y) = Poisson(x; lambda_h) * Poisson(y; lambda_a).',
  },
  {
    q: '8. What are the most influential features identified by Random Forest?',
    a: 'The top features by Gini importance are: (1) Elo rating differential (measures long-term relative playing strength), (2) Squad market value gap (Transfermarkt financial proxy for depth), (3) UEFA 5-year coefficient (continental pedigree), and (4) Rolling 5-match form points.',
  },
  {
    q: '9. How does SQLite and SQLAlchemy ORM integrate with FastAPI?',
    a: 'FastAPI dependency injection (get_db) yields an isolated SQLAlchemy Session per HTTP request, automatically closing connections in the finally block. SQLite provides zero-configuration, ACID-compliant local relational persistence for matches, clubs, and prediction audit logs.',
  },
  {
    q: '10. What is the difference between feature importance and causation?',
    a: 'Feature importance measures how effectively a feature reduces entropy across decision tree splits in historical records. This indicates statistical correlation, not causation (e.g. having high squad value correlates with winning, but does not cause goals without tactical execution).',
  },
  {
    q: '11. How does the Monte Carlo tournament simulator work?',
    a: 'It runs 1,000 randomized knockout tournament iterations. In each match, the calibrated model generates win probabilities, a pseudo-random number generator simulates the tie with penalty shootout resolution on draws, and progression tallies (QF, SF, Final, Winner) are normalized into empirical probabilities.',
  },
  {
    q: '12. What validation and error handling are implemented?',
    a: 'Pydantic schemas validate all incoming API payloads (type checks, distinct team validation, range constraints). If a user selects the same club twice or an unrecognized team, HTTP 400/404/422 errors with human-readable error messages are returned.',
  },
];

export default function AboutPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="container py-8 space-y-10 max-w-4xl">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/15 text-electric-400 text-xs font-bold uppercase tracking-wider">
          <GraduationCap size={15} /> Academic Submission & Viva Voce Documentation
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Project Architecture & Viva Preparation</h1>
        <p className="text-slate-400 text-sm">
          B.Tech Computer Engineering (Semester V) Academic Project (50 Marks)
        </p>
      </div>

      {/* System Architecture Overview */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Code2 size={20} className="text-electric" /> System Architecture & Technology Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-electric-400 font-bold text-sm">
              <Code2 size={16} /> Frontend Layer
            </div>
            <p className="text-xs text-slate-300">
              React 18 with Vite, TypeScript, Tailwind CSS, Lucide React icons, and Recharts for interactive analytics.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Cpu size={16} /> Backend & ML
            </div>
            <p className="text-xs text-slate-300">
              FastAPI REST APIs, Pydantic v2 validation, scikit-learn (Random Forest & Logistic Regression), XGBoost, and Poisson xG models.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Database size={16} /> Database & Storage
            </div>
            <p className="text-xs text-slate-300">
              SQLite relational database with SQLAlchemy 2.0 ORM, storing 1,110 matches, 36 clubs, and user prediction history.
            </p>
          </div>
        </div>
      </div>

      {/* Project Modules & Workflow */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} className="text-electric" /> Engineering Modules
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-white/5">
            <strong className="text-white block mb-0.5">1. Ingestion & Preprocessing Pipeline (features.py)</strong>
            Parses raw matches, normalizes dates, computes rolling 5-match form points, goals scored/conceded, and rest days with strict t-1 temporal shift.
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <strong className="text-white block mb-0.5">2. Machine Learning Training & Evaluation (train.py)</strong>
            Executes chronological train/test split (777 training matches, 333 test matches). Trains Logistic Regression, Random Forest, and XGBoost, calculating genuine accuracy, F1, log loss, and confusion matrix.
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <strong className="text-white block mb-0.5">3. Inference & Poisson Scoreline Engine (predict.py & goal_model.py)</strong>
            Generates calibrated probabilities summing strictly to 100%, independently calculates Poisson score distribution, and extracts feature importances.
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <strong className="text-white block mb-0.5">4. FastAPI REST Endpoints & SQLite Persistence (app/)</strong>
            Exposes /api/predict, /api/teams, /api/matches, /api/head-to-head, /api/model/metrics, and persists prediction audit logs in SQLite.
          </div>
        </div>
      </div>

      {/* Comprehensive Viva Voce Questions & Answers Accordion */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle size={20} className="text-amber-400" /> Viva Voce Defense Guide (12 Key Questions)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Carefully prepared questions and answers covering machine learning theory, data leakage, football analytics, and software architecture for college evaluation.
          </p>
        </div>

        <div className="space-y-3">
          {VIVA_QUESTIONS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-white/5 transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp size={16} className="text-electric shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-navy-900/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
