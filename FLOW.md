# System Architecture & Data Flow — UEFA Champions League AI Match Outcome Predictor

This document details the end-to-end system architecture, machine learning pipeline, data flow, inference mechanisms, and tournament simulation flow for the **UEFA Champions League AI Match Outcome Predictor**.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client Layer ["Client Layer (Frontend)"]
        UI["React 18 + TypeScript + Vite SPA"]
        Dashboard["Match Dashboard"]
        PredictorView["Match Predictor Engine"]
        H2HView["Head-to-Head Comparator"]
        ModelMetricsView["Model Benchmark & Explainability"]
        SimView["Monte Carlo Tournament Simulator"]
    end

    subgraph APILayer ["API Layer (FastAPI REST Service)"]
        FastAPI["Uvicorn / FastAPI Backend (:8000)"]
        RouterHealth["/api/health"]
        RouterTeams["/api/teams & /api/teams/{id}"]
        RouterMatches["/api/matches"]
        RouterH2H["/api/head-to-head"]
        RouterPredict["/api/predict"]
        RouterModels["/api/model/metrics & /api/model/features"]
        RouterSimulate["/api/simulate"]
    end

    subgraph MLLayer ["Machine Learning & Statistical Core"]
        FeatureEngine["Rolling Feature Engineer (t-1 Shift)"]
        RFModel["Random Forest Classifier (Primary Outcome)"]
        XGBModel["XGBoost Classifier (Benchmarked)"]
        LRModel["Logistic Regression (Baseline)"]
        PoissonModel["Bivariate Poisson Goal Distribution"]
        MonteCarlo["Monte Carlo Simulator (1,000 Runs)"]
    end

    subgraph DataLayer ["Persistence Layer"]
        DB[(SQLite: ucl_predictor.db)]
        TableTeams["Teams (36 European Clubs)"]
        TableMatches["Matches (1,110 Fixtures, 10 Seasons)"]
        TablePredictions["Predictions (Audit Log)"]
        TableMeta["Dataset Metadata"]
    end

    UI -->|HTTP / JSON REST API| FastAPI
    Dashboard -.-> RouterTeams & RouterMatches
    PredictorView -.-> RouterPredict
    H2HView -.-> RouterH2H
    ModelMetricsView -.-> RouterModels
    SimView -.-> RouterSimulate

    FastAPI --> MLLayer
    FastAPI --> DataLayer
    MLLayer --> DataLayer
```

---

## 2. End-to-End Machine Learning Pipeline

```mermaid
flowchart TD
    RawData["Raw Historical Match Data (2015-16 to 2024-25, 1,110 Matches)"]
    
    subgraph Preprocessing ["Data Preprocessing & Feature Engineering"]
        Sort["Chronological Ordering by Match Date"]
        LagShift["Apply Strict (t-1) Lag Shift (Zero Future Leakage)"]
        EloCalc["Dynamic Elo Rating Calculation"]
        FormCalc["5-Match Rolling Form Points (W=3, D=1, L=0)"]
        GoalStats["Rolling Attack & Defense Goal Averages"]
        RestDays["Rest Days Differential Calculation"]
        PhaseEnc["Phase Encoding (Group Stage vs Knockouts)"]
    end

    subgraph Splitting ["Chronological Split Protocol"]
        TrainSet["Training Set: 2015-16 through 2021-22 (~70%)"]
        TestSet["Out-of-Time Test Set: 2022-23 through 2024-25 (~30%)"]
    end

    subgraph Training ["Model Training & Calibration"]
        TrainLR["Train Logistic Regression Baseline"]
        TrainRF["Train Random Forest Classifier (Optimized Gini)"]
        TrainXGB["Train XGBoost Gradient Boosting"]
        PoissonFit["Estimate Poisson Goal Lambda (Home & Away)"]
    end

    subgraph Evaluation ["Evaluation & Explainability"]
        Metrics["Log Loss, Brier Score, ROC-AUC, Multiclass Accuracy"]
        FeatureImportance["Gini Feature Importance Extraction"]
        ExportModels["Serialize Models & Artifacts (.joblib)"]
    end

    RawData --> Sort --> LagShift --> EloCalc --> FormCalc --> GoalStats --> RestDays --> PhaseEnc
    PhaseEnc --> TrainSet & TestSet
    TrainSet --> TrainLR & TrainRF & TrainXGB & PoissonFit
    TestSet --> Metrics
    TrainRF --> FeatureImportance
    FeatureImportance --> ExportModels
    PoissonFit --> ExportModels
```

---

## 3. Real-Time Prediction Request & Inference Flow

When a user selects two clubs in the frontend Match Predictor, the following request-response lifecycle executes:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as React 18 SPA
    participant API as FastAPI Router (/api/predict)
    participant DB as SQLite Database
    participant FE as Feature Engineer
    participant RF as Random Forest Model
    participant Poisson as Poisson Goal Engine

    User->>Frontend: Select Home Team, Away Team & Stage
    Frontend->>API: POST /api/predict {home_team, away_team, phase, neutral_venue}
    API->>DB: Query team profiles (Elo, UEFA rank, stadium)
    API->>DB: Query historical fixtures for both clubs up to match date
    API->>FE: Compute pre-match feature vector using (t-1) rolling stats
    FE-->>API: Return feature vector [Elo_diff, Form_diff, Rest_diff, Uefa_diff, Phase]
    
    par Predict Outcome Probabilities
        API->>RF: predict_proba(feature_vector)
        RF-->>API: [P(Home Win), P(Draw), P(Away Win)] where sum = 1.00
        API->>RF: extract local feature contributions (Feature Importances)
        RF-->>API: Top influential features
    and Compute Expected Scoreline
        API->>Poisson: compute_expected_goals(home_attack, away_defense, home_advantage)
        Poisson-->>API: Expected scoreline (e.g., 2 - 1) & Score probability matrix
    end

    API->>DB: Record prediction audit record into 'predictions' table
    API-->>Frontend: JSON response: probabilities, predicted score, feature importances, H2H
    Frontend-->>User: Interactive UEFA Dark Mode Visualization (Charts, Gauge, Scoreline)
```

---

## 4. Monte Carlo Tournament Simulation Flow

The application features a 1,000-run Monte Carlo tournament simulation engine capable of modeling dynamic knockout brackets:

```mermaid
flowchart LR
    InitTeams["Select 16 Knockout Clubs"] --> BracketGen["Generate Round of 16 Matchups"]
    
    subgraph MonteCarloEngine ["1,000 Iteration Stochastic Loop"]
        direction TB
        LoopStart["For Iteration 1 to 1000"]
        SimR16["Simulate R16 (Home/Away Aggregate + Away Goals/Pens)"]
        SimQF["Simulate Quarter-Finals (2 Legs)"]
        SimSF["Simulate Semi-Finals (2 Legs)"]
        SimFinal["Simulate Grand Final (Neutral Venue Single Match)"]
        RecordChamp["Record Champion, Finalist, Semi-Finalists"]
        LoopStart --> SimR16 --> SimQF --> SimSF --> SimFinal --> RecordChamp
    end

    InitTeams --> LoopStart
    RecordChamp --> Aggregate["Aggregate Frequency Distribution"]
    Aggregate --> Output["Champion Probabilities & Bracket Progression Matrix"]
```

---

## 5. Database Schema & Entity-Relationship Flow

```mermaid
erDiagram
    TEAMS ||--o{ MATCHES : "hosts as home"
    TEAMS ||--o{ MATCHES : "travels as away"
    TEAMS ||--o{ PREDICTIONS : "predicted home"
    TEAMS ||--o{ PREDICTIONS : "predicted away"

    TEAMS {
        int id PK
        string name
        string country
        string stadium
        int capacity
        int uefa_ranking
        int elo_rating
        float uefa_coefficient
    }

    MATCHES {
        int id PK
        string match_date
        string season
        string phase
        int home_team_id FK
        int away_team_id FK
        int home_goals
        int away_goals
        string outcome
        int home_shots
        int away_shots
        float home_xg
        float away_xg
        int attendance
    }

    PREDICTIONS {
        int id PK
        string timestamp
        int home_team_id FK
        int away_team_id FK
        string phase
        float prob_home_win
        float prob_draw
        float prob_away_win
        int predicted_home_goals
        int predicted_away_goals
        string primary_model
    }

    DATASET_METADATA {
        int id PK
        string key
        string value
        string last_updated
    }
```

---

## 6. Directory Structure & Execution Boundaries

```
project 2.0/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point & CORS configuration
│   │   ├── database.py          # SQLAlchemy connection & session management
│   │   ├── seed_db.py           # Database seeding (1,110 matches & 36 teams)
│   │   ├── models/              # SQLAlchemy ORM entity definitions
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   └── routes/              # Modular REST endpoint controllers
│   ├── ml/
│   │   ├── features.py          # Strict (t-1) rolling feature generator
│   │   ├── train.py             # Chronological split training routine
│   │   ├── predict.py           # Prediction inference engine
│   │   └── goal_model.py        # Independent Poisson scoreline distribution
│   ├── tests/
│   │   └── test_api.py          # Pytest validation suite
│   ├── requirements.txt         # Python dependencies
│   └── ucl_predictor.db        # Persisted SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UEFA glassmorphic UI components
│   │   ├── pages/               # Views: Dashboard, Predictor, Compare, Simulate, etc.
│   │   ├── services/            # Axios / Fetch client calling FastAPI
│   │   ├── types/               # TypeScript interfaces matching backend schemas
│   │   └── App.tsx              # Application layout & navigation
│   ├── package.json             # React 18, Vite, Tailwind CSS dependencies
│   ├── tailwind.config.js       # UEFA Midnight & Electric Blue color tokens
│   └── vite.config.ts           # Vite development server configuration
│
├── FLOW.md                      # Architecture, Pipeline & Execution flow diagrams
└── README.md                    # Project documentation, methodology & commands
```
