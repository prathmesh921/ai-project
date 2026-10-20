"""
main.py - FastAPI backend for UCL Predictor
"""
import os, json, warnings
from typing import Optional
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

warnings.filterwarnings("ignore")

BASE   = os.path.dirname(os.path.abspath(__file__))
MDIR   = os.path.join(BASE, "..", "models")
DATA   = os.path.join(BASE, "..", "data")

app = FastAPI(title="UCL Predictor API", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ── Load artefacts ────────────────────────────────────────────────────────────
def load_artefacts():
    models, scaler, le, features = {}, None, None, None
    meta, df_matches, metrics_data, fi_data = {}, None, {}, {}
    try:
        features = joblib.load(os.path.join(MDIR, "features.pkl"))
        scaler   = joblib.load(os.path.join(MDIR, "scaler.pkl"))
        le       = joblib.load(os.path.join(MDIR, "label_encoder.pkl"))
        for name in ["logistic_regression","naive_bayes","random_forest",
                     "xgboost","gradient_boosting","ensemble"]:
            p = os.path.join(MDIR, f"{name}.pkl")
            if os.path.exists(p):
                models[name] = joblib.load(p)
        with open(os.path.join(DATA, "team_metadata.json")) as f:
            meta = json.load(f)
        with open(os.path.join(MDIR, "metrics.json")) as f:
            metrics_data = json.load(f)
        with open(os.path.join(MDIR, "feature_importance.json")) as f:
            fi_data = json.load(f)
        df_matches = pd.read_csv(os.path.join(DATA, "ucl_matches.csv"))
        print("[API] Artefacts loaded successfully.")
    except Exception as e:
        print(f"[API] Warning: could not load artefacts: {e}")
    return models, scaler, le, features, meta, df_matches, metrics_data, fi_data

MODELS, SCALER, LE, FEATURES, META, DF, METRICS, FI = load_artefacts()

TEAM_NAMES = list(META.keys()) if META else []

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_team_form(team: str, n: int = 5) -> list:
    if DF is None: return []
    mask = (DF["home_team"] == team) | (DF["away_team"] == team)
    matches = DF[mask].tail(n * 3).tail(n * 2)
    results = []
    for _, row in matches.iterrows():
        if row["home_team"] == team:
            r = row["result"]
            results.append("W" if r == "H" else ("D" if r == "D" else "L"))
        else:
            r = row["result"]
            results.append("W" if r == "A" else ("D" if r == "D" else "L"))
    return results[-n:]

def get_h2h(home: str, away: str) -> dict:
    if DF is None: return {"home_wins": 0, "away_wins": 0, "draws": 0, "matches": []}
    mask = ((DF["home_team"] == home) & (DF["away_team"] == away)) | \
           ((DF["home_team"] == away) & (DF["away_team"] == home))
    h2h_df = DF[mask].tail(10)
    hw = int(((h2h_df["home_team"] == home) & (h2h_df["result"] == "H")).sum() +
             ((h2h_df["away_team"] == home) & (h2h_df["result"] == "A")).sum())
    aw = int(((h2h_df["home_team"] == away) & (h2h_df["result"] == "H")).sum() +
             ((h2h_df["away_team"] == away) & (h2h_df["result"] == "A")).sum())
    dr = len(h2h_df) - hw - aw
    recent = []
    for _, row in h2h_df.tail(5).iterrows():
        recent.append({
            "home": row["home_team"], "away": row["away_team"],
            "score": f"{int(row['goals_home'])}-{int(row['goals_away'])}",
            "season": row["season"]
        })
    return {"home_wins": hw, "away_wins": aw, "draws": dr, "matches": recent}

def build_features(home: str, away: str, venue: str = "home",
                   form_window: int = 5, home_adv_weight: float = 1.0,
                   injury_home: bool = False, injury_away: bool = False) -> np.ndarray:
    hm = META.get(home, {})
    am = META.get(away, {})
    elo_d  = hm.get("elo", 1900) - am.get("elo", 1900)
    if venue == "neutral": elo_d *= 0.8
    elif venue == "away":  elo_d = -abs(elo_d)
    uc_d   = hm.get("uefa_coef", 60) - am.get("uefa_coef", 60)
    sv_d   = hm.get("squad_value_M", 400) - am.get("squad_value_M", 400)
    if injury_home: sv_d -= 50
    if injury_away: sv_d += 50

    h_form = sum([3 if r=="W" else (1 if r=="D" else 0) for r in get_team_form(home, form_window)])
    a_form = sum([3 if r=="W" else (1 if r=="D" else 0) for r in get_team_form(away, form_window)])
    form_d = h_form - a_form
    home_adv_bonus = 25 * home_adv_weight if venue == "home" else 0
    rest_d = 0
    poss_h = 50 + 0.02 * elo_d
    shots_h = max(3, 3 + 0.003 * elo_d)
    shots_a = max(3, 3 - 0.003 * elo_d)

    return np.array([[elo_d + home_adv_bonus, uc_d, sv_d,
                      h_form, a_form, form_d, rest_d, poss_h, shots_h, shots_a]])

def predict_with_model(model_name: str, X: np.ndarray) -> dict:
    model = MODELS.get(model_name) or MODELS.get("xgboost")
    if model is None:
        # Elo fallback
        elo_d = float(X[0][0])
        p_h = 1 / (1 + 10**(-elo_d/400))
        return {"H": round(p_h, 3), "D": 0.25, "A": round(1-p_h-0.25, 3)}

    use_scaled = model_name in ["logistic_regression", "naive_bayes"]
    X_in = SCALER.transform(X) if (use_scaled and SCALER) else X
    try:
        proba = model.predict_proba(X_in)[0]
        classes = LE.classes_ if LE else ["A", "D", "H"]
        return {c: round(float(p), 4) for c, p in zip(classes, proba)}
    except Exception as e:
        return {"H": 0.40, "D": 0.25, "A": 0.35}

def scoreline_heatmap(p_home_win: float, avg_h: float = 1.3, avg_a: float = 1.1) -> list:
    from scipy.stats import poisson
    rows = []
    for gh in range(6):
        for ga in range(6):
            p = poisson.pmf(gh, avg_h) * poisson.pmf(ga, avg_a)
            rows.append({"home_goals": gh, "away_goals": ga, "probability": round(float(p), 5)})
    return sorted(rows, key=lambda x: -x["probability"])

# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    home_team: str
    away_team: str
    stage: str = "group"
    venue: str = "home"
    model: str = "xgboost"
    form_window: int = 5
    home_adv_weight: float = 1.0
    injury_home: bool = False
    injury_away: bool = False

class SimRequest(BaseModel):
    teams: list
    n_sim: int = 1000

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "UCL Predictor API v2.0 running"}

@app.get("/teams")
def get_teams():
    return {"teams": TEAM_NAMES,
            "metadata": {t: {"elo": d["elo"], "squad_value_M": d["squad_value_M"],
                              "colour": d.get("colour","#003087")}
                          for t, d in META.items()}}

@app.post("/predict")
def predict(req: PredictRequest):
    if req.home_team not in META or req.away_team not in META:
        raise HTTPException(404, "Team not found")
    X = build_features(req.home_team, req.away_team, req.venue,
                       req.form_window, req.home_adv_weight,
                       req.injury_home, req.injury_away)
    probs = predict_with_model(req.model, X)

    hm, am = META[req.home_team], META[req.away_team]
    avg_h = hm["attack"] * am["defence"] * (1.25 if req.venue=="home" else 1.0)
    avg_a = am["attack"] * hm["defence"]
    scorelines = scoreline_heatmap(probs.get("H", 0.4), avg_h, avg_a)
    most_likely = scorelines[0]

    h2h   = get_h2h(req.home_team, req.away_team)
    form_h = get_team_form(req.home_team, req.form_window)
    form_a = get_team_form(req.away_team, req.form_window)

    # Feature importance explanation
    fi_sorted = sorted(FI.items(), key=lambda x: -x[1]) if FI else []
    explanation = []
    fi_labels = {
        "elo_diff":     "Elo rating difference — stronger team has higher Elo",
        "ucoef_diff":   "UEFA coefficient gap — recent European performance",
        "sqval_diff":   "Squad market value difference — squad depth & quality",
        "home_form5":   "Home team recent form (last 5 matches)",
        "away_form5":   "Away team recent form (last 5 matches)",
        "form_diff":    "Form difference — who has more momentum",
        "rest_diff":    "Rest days difference — fatigue / congestion factor",
        "poss_home":    "Expected home possession % — tactical dominance",
        "shots_home":   "Expected home shots on target",
        "shots_away":   "Expected away shots on target",
    }
    for feat, imp in fi_sorted[:5]:
        feat_val = float(X[0][FEATURES.index(feat)]) if feat in FEATURES else 0
        direction = "favours home" if feat_val > 0 else "favours away"
        explanation.append({
            "feature": feat,
            "label": fi_labels.get(feat, feat),
            "importance": round(imp, 4),
            "value": round(feat_val, 2),
            "direction": direction,
        })

    # Elo-based bookmaker comparison
    elo_d = hm["elo"] - am["elo"] + (50 if req.venue=="home" else 0)
    bk_h  = round(1/(1+10**(-elo_d/400)), 3)
    bk_d  = round(0.25*np.exp(-0.0004*elo_d**2), 3)
    bk_a  = round(max(0, 1-bk_h-bk_d), 3)

    # Knockout progression probability (simple: if home_win_prob > 0.5 → likely advance)
    ko_progression = round((probs.get("H",0.4) + 0.5*probs.get("D",0.25)), 3)

    return {
        "home_team":     req.home_team,
        "away_team":     req.away_team,
        "probabilities": probs,
        "most_likely_score": {"home": most_likely["home_goals"],
                               "away": most_likely["away_goals"]},
        "scoreline_heatmap": scorelines[:25],
        "h2h": h2h,
        "home_form": form_h,
        "away_form": form_a,
        "home_meta": {"elo": hm["elo"], "squad_value_M": hm["squad_value_M"],
                       "colour": hm.get("colour","#003087")},
        "away_meta": {"elo": am["elo"], "squad_value_M": am["squad_value_M"],
                       "colour": am.get("colour","#C8102E")},
        "explanation": explanation,
        "bookmaker_comparison": {"H": bk_h, "D": bk_d, "A": bk_a},
        "ko_progression_prob": ko_progression,
        "model_used": req.model,
    }

@app.post("/simulate")
def simulate(req: SimRequest):
    """Monte Carlo simulation of knockout bracket."""
    teams = [t for t in req.teams if t in META]
    if len(teams) < 2:
        raise HTTPException(400, "Need at least 2 valid teams")
    n = req.n_sim
    rng = np.random.default_rng(42)
    counts = {t: {"qf": 0, "sf": 0, "final": 0, "winner": 0} for t in teams}

    def sim_tie(a, b):
        X_ab = build_features(a, b)
        pr = predict_with_model("xgboost", X_ab)
        roll = rng.random()
        if roll < pr.get("H", 0.4): return a
        elif roll < pr.get("H", 0.4) + pr.get("D", 0.25): return rng.choice([a, b])
        return b

    def run_bracket(bracket_teams):
        teams_left = list(bracket_teams)
        rng.shuffle(teams_left)
        rounds = ["qf", "sf", "final", "winner"]
        ri = 0
        while len(teams_left) > 1 and ri < 4:
            next_round = []
            for i in range(0, len(teams_left)-1, 2):
                w = sim_tie(teams_left[i], teams_left[i+1])
                next_round.append(w)
                if ri < len(rounds):
                    counts[teams_left[i]][rounds[ri]] += 1
                    counts[teams_left[i+1]][rounds[ri]] += 1
            if ri == 3 and next_round:
                counts[next_round[0]]["winner"] += 1
            teams_left = next_round
            ri += 1
        if teams_left:
            counts[teams_left[0]]["winner"] += 1

    for _ in range(n):
        run_bracket(teams)

    result = {}
    for t, c in counts.items():
        result[t] = {k: round(v/n, 4) for k, v in c.items()}
    return {"teams": teams, "simulations": n, "probabilities": result}

@app.get("/model-metrics")
def model_metrics():
    return {"metrics": METRICS, "feature_importance": FI,
            "features": FEATURES}

@app.get("/eda/summary")
def eda_summary():
    if DF is None: return {"error": "Data not loaded"}
    total = len(DF)
    seasons = sorted(DF["season"].unique().tolist())
    home_wins = int((DF["result"] == "H").sum())
    draws     = int((DF["result"] == "D").sum())
    away_wins = int((DF["result"] == "A").sum())
    avg_goals = round(float((DF["goals_home"] + DF["goals_away"]).mean()), 2)
    return {
        "total_matches": total,
        "seasons": seasons,
        "class_distribution": {"H": home_wins, "D": draws, "A": away_wins},
        "avg_goals_per_match": avg_goals,
        "teams_count": DF["home_team"].nunique(),
    }

@app.get("/eda/home-advantage")
def eda_home_adv():
    if DF is None: return []
    grouped = DF.groupby("season").apply(
        lambda g: round(float((g["result"]=="H").sum()/len(g)), 3)
    ).reset_index()
    grouped.columns = ["season", "home_win_rate"]
    return grouped.to_dict(orient="records")

@app.get("/eda/goals-by-stage")
def eda_goals_stage():
    if DF is None: return []
    g = DF.groupby("stage").apply(
        lambda x: round(float((x["goals_home"]+x["goals_away"]).mean()), 2)
    ).reset_index()
    g.columns = ["stage", "avg_goals"]
    return g.to_dict(orient="records")

@app.get("/eda/form-impact")
def eda_form():
    if DF is None: return []
    bins = pd.cut(DF["form_diff"], bins=[-15,-8,-3,3,8,15], labels=["much worse","worse","even","better","much better"])
    g = DF.groupby(bins)["result"].apply(
        lambda x: round(float((x=="H").sum()/len(x)), 3) if len(x)>0 else 0
    ).reset_index()
    g.columns = ["form_bucket", "home_win_rate"]
    g["form_bucket"] = g["form_bucket"].astype(str)
    return g.to_dict(orient="records")

@app.get("/eda/matches")
def eda_matches(page: int=1, page_size: int=20, season: str=None,
                stage: str=None, team: str=None):
    if DF is None: return {"data": [], "total": 0}
    df2 = DF.copy()
    if season: df2 = df2[df2["season"] == season]
    if stage:  df2 = df2[df2["stage"] == stage]
    if team:   df2 = df2[(df2["home_team"]==team)|(df2["away_team"]==team)]
    total = len(df2)
    start = (page-1)*page_size
    chunk = df2.iloc[start:start+page_size][[
        "season","stage","home_team","away_team",
        "goals_home","goals_away","result","elo_diff","home_form5","away_form5"
    ]]
    return {"data": chunk.to_dict(orient="records"), "total": total,
            "page": page, "page_size": page_size}
