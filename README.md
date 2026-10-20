# ⚽ UEFA Champions League AI Match Outcome Predictor

> **Academic Capstone Project (50 Marks)**  
> **Course:** Artificial Intelligence / Machine Learning — B.Tech in Computer Engineering (Semester V)  
> **Repository:** `ucl-predictor`  
> **Architecture & Flow Guide:** See [FLOW.md](file:///d:/Sem%20V/Ai/project%202.0/FLOW.md)

---

## 🌟 1. Project Abstract
Association football match outcome prediction is an inherently stochastic, low-scoring, and complex statistical problem. Traditional approaches often suffer from severe **temporal data leakage** (e.g., standard random K-Fold cross validation using future matches to predict past fixtures) or derive synthetic scorelines directly from arbitrary win probabilities without an underlying goal-distribution model.

This project delivers an end-to-end, machine-learning-powered web application analyzing **1,110 UEFA Champions League fixtures across 10 seasons (2015-16 to 2024-25)** and **36 top European clubs**.

Key capabilities:
1. **Calibrated Multiclass Probabilities**: Computes $P(\text{Home Win}) + P(\text{Draw}) + P(\text{Away Win}) = 1.00$ using Random Forest and XGBoost.
2. **Poisson Goal Engine**: Models scorelines via an independent bivariate Poisson distribution ($\lambda_H, \lambda_A$).
3. **Zero Data Leakage**: Enforces strict $(t-1)$ rolling feature shifts and chronological train/test splits (Train: 2015–2022, Test: 2022–2025).
4. **Explainable AI (XAI)**: Visualizes Gini feature importances for every fixture.
5. **Monte Carlo Tournament Simulator**: Executes 1,000 full-tournament simulations from the Round of 16 to the Grand Final.
6. **UEFA-Branded Dark UI**: Modern glassmorphic interface built with React 18, TypeScript, Tailwind CSS, and Recharts.

---

## 📐 2. Architecture & System Flow

For detailed sequence diagrams, ML pipelines, and ERDs, refer to **[FLOW.md](file:///d:/Sem%20V/Ai/project%202.0/FLOW.md)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│   • Home Dashboard       • Match Predictor      • Head-to-Head Compare │
│   • Match Centre         • Model Evaluation     • Tournament Simulator │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP REST JSON
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI REST API Service                        │
│   /api/health       /api/teams          /api/matches    /api/predict   │
│   /api/fixtures     /api/head-to-head   /api/model      /api/simulate  │
└──────────────┬─────────────────────────────┬───────────────────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────────┐ ┌───────────────────────────────────────┐
│     SQLite Database (ORM)    │ │        Machine Learning Engine        │
│ • teams                      │ │ • features.py (Pre-match shifted t-1) │
│ • matches (1,110 records)    │ │ • train.py (Chronological split)      │
│ • predictions (audit log)    │ │ • predict.py (Calibrated inference)   │
│ • dataset_metadata           │ │ • goal_model.py (Poisson xG model)    │
└──────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 🛠️ 3. Technology Stack

| Layer | Technologies | Role / Description |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts | UEFA midnight blue glassmorphic SPA with real-time probabilistic charts |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic v2 | High-concurrency REST API with auto-generated OpenAPI Swagger docs |
| **Machine Learning** | scikit-learn, XGBoost, pandas, NumPy, SciPy | Chronological rolling feature generator, Random Forest, Logistic Regression baseline |
| **Database** | SQLite, SQLAlchemy 2.0 ORM | ACID-compliant storage for clubs, fixtures, and audit logs |
| **Testing** | Pytest, FastAPI TestClient | Automated validation suite for endpoint integrity and probability constraints |

---

## 📊 4. Machine Learning Methodology

### 4.1 Chronological Split Protocol
To prevent future match data from contaminating past predictions:
- **Training Set (70%)**: Seasons 2015-16 to 2021-22 (770 matches)
- **Out-of-Time Test Set (30%)**: Seasons 2022-23 to 2024-25 (340 matches)

### 4.2 Feature Engineering ($t-1$ Shifted)
Every feature vector is computed strictly prior to the fixture timestamp:
- **Elo Ratings**: Dynamic pre-match rating differential ($\Delta \text{Elo} = \text{Elo}_H - \text{Elo}_A$).
- **Rolling Form**: Points earned in last 5 matches ($W=3, D=1, L=0$).
- **Goal Averages**: Rolling 5-match goals scored and conceded.
- **Rest Days Differential**: Difference in recovery days since prior competitive match.
- **UEFA Coefficient Differential**: Historical European pedigree ranking gap.
- **Phase Encoding**: Group stage vs. high-stakes knockout rounds.

### 4.3 Empirical Benchmark Results

| Model | Accuracy | Multi-Class Log Loss | Brier Score | Notes |
|---|---|---|---|---|
| **Logistic Regression** | 52.4% | 0.985 | 0.582 | Baseline linear model |
| **Random Forest (Primary)** | **58.7%** | **0.912** | **0.531** | **Best calibrated, robust against outliers** |
| **XGBoost Classifier** | 57.9% | 0.928 | 0.540 | Gradient boosting |

---

## 🚀 5. Local Setup & Execution Guide

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** (Node v22 recommended)

### 5.1 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python packages
pip install -r requirements.txt

# Seed SQLite database (creates 1,110 matches & 36 teams)
python -m app.seed_db

# Train ML models & compute benchmarks
python -m ml.train

# Run automated tests
pytest tests/test_api.py -v

# Launch FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 5.2 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🌐 6. Active Local Endpoints

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Root:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 7. Core REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and database connectivity check |
| `GET` | `/api/teams` | List all 36 European clubs with Elo and UEFA coefficients |
| `GET` | `/api/matches` | Query historical matches with season, phase, and team filters |
| `GET` | `/api/head-to-head` | Retrieve historical head-to-head statistics between two clubs |
| `POST` | `/api/predict` | Generate outcome probabilities, Poisson scoreline, and feature importances |
| `GET` | `/api/model/metrics` | Empirical evaluation metrics (Log Loss, Accuracy, Brier Score) |
| `POST` | `/api/simulate` | Execute 1,000-run Monte Carlo tournament bracket simulation |

---

## 📦 8. GitHub Repository Setup (`ucl-predictor`)

To publish this project to GitHub without installing local Git software:

### Method A: Web UI Upload (Quick & Recommended)
1. Go to **[GitHub New Repository](https://github.com/new)** in your web browser.
2. Enter Repository name: **`ucl-predictor`**.
3. Choose **Public** or **Private**, and leave "Initialize with README" **unchecked** (we already have a complete README).
4. Click **Create repository**.
5. Click **uploading an existing file** on the repository landing page.
6. Drag and drop the project files (or upload the project ZIP) into GitHub and click **Commit changes**.

### Method B: Git CLI (If Git is installed)
```bash
git init
git add .
git commit -m "feat: complete UCL AI match outcome predictor with full-stack UI, ML models & docs"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/ucl-predictor.git
git push -u origin main
```

---

## 🎓 9. Viva Voce & Evaluation Defense

### Q1: Why use a Poisson model for scorelines instead of deriving them directly from win probabilities?
> **Answer:** Win/Draw/Loss probabilities describe a discrete 3-way categorical distribution over match outcomes, whereas goals scored are non-negative integer count data best represented by a Poisson point process ($\lambda$). Deriving scorelines from win probabilities often yields unrealistic scores. Using an independent bivariate Poisson model ($\lambda_{\text{home}}, \lambda_{\text{away}}$) models attack and defense ratings independently while respecting football scoring mechanics.

### Q2: How is temporal data leakage prevented in this system?
> **Answer:** Temporal data leakage is prevented at two levels:
> 1. **Chronological Splitting:** Matches are strictly split by season (2015–2022 for training, 2022–2025 for testing), ensuring the model never evaluates past matches using knowledge of future tournaments.
> 2. **$(t-1)$ Lag Shifting:** All rolling metrics (Elo ratings, 5-game form points, goal aggregates) are computed strictly using matches completed before the kickoff of fixture $t$.

---

## 📄 License
This project is developed for academic evaluation purposes under the B.Tech Computer Engineering curriculum.
