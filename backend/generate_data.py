"""
generate_data.py
================
Generates a realistic UCL dataset (2015-2025, 10 seasons) and trains
all ML models, saving them to ../models/.

Run once before starting the backend:
    python generate_data.py
"""

import os, sys, json, warnings
import numpy as np
import pandas as pd
from collections import defaultdict

warnings.filterwarnings("ignore")

BASE  = os.path.dirname(os.path.abspath(__file__))
DATA  = os.path.join(BASE, "..", "data")
MDIR  = os.path.join(BASE, "..", "models")
os.makedirs(DATA, exist_ok=True)
os.makedirs(MDIR, exist_ok=True)

# ── 36 UCL clubs with real-world approximate stats ──────────────────────────
TEAMS = [
    # name, elo, uefa_coef, squad_val_M, shirt_colour
    ("Real Madrid",         2050, 136, 1200, "#FFFFFF"),
    ("Manchester City",     2020, 148, 1350, "#6CABDD"),
    ("Bayern Munich",       2010, 144, 1050, "#DC052D"),
    ("Liverpool",           1990, 114,  950, "#C8102E"),
    ("Paris Saint-Germain", 1985,  87, 1000, "#003087"),
    ("Barcelona",           1975,  99,  900, "#A50044"),
    ("Chelsea",             1960,  72,  900, "#034694"),
    ("Atletico Madrid",     1950, 111,  600, "#CB3524"),
    ("Inter Milan",         1940,  90,  650, "#0068A8"),
    ("Borussia Dortmund",   1920,  97,  500, "#FDE100"),
    ("RB Leipzig",          1900,  72,  450, "#DD0741"),
    ("Napoli",              1890,  55,  650, "#12A0D7"),
    ("AC Milan",            1880,  68,  500, "#FB090B"),
    ("Benfica",             1870,  79,  350, "#CC0000"),
    ("Porto",               1860,  82,  300, "#004B9B"),
    ("Juventus",            1855,  96,  550, "#000000"),
    ("Tottenham",           1850,  51,  700, "#132257"),
    ("Ajax",                1840,  67,  280, "#CC0000"),
    ("Sevilla",             1835,  72,  280, "#C41231"),
    ("Shakhtar Donetsk",    1820,  63,  200, "#F97B00"),
    ("Lazio",               1815,  30,  300, "#87CEEB"),
    ("Eintracht Frankfurt", 1810,  37,  300, "#E1000F"),
    ("Celtic",              1790,  26,  150, "#16A765"),
    ("Club Brugge",         1780,  35,  180, "#003399"),
    ("Rangers",             1770,  22,  120, "#003399"),
    ("Salzburg",            1780,  40,  160, "#EE1C25"),
    ("Copenhagen",          1760,  28,  130, "#004B99"),
    ("PSV Eindhoven",       1775,  44,  200, "#CC0000"),
    ("Feyenoord",           1770,  42,  220, "#CC0000"),
    ("Bayer Leverkusen",    1895,  60,  550, "#E32221"),
    ("Arsenal",             1965,  72,  900, "#EF0107"),
    ("Aston Villa",         1860,  25,  600, "#670E36"),
    ("Monaco",              1840,  42,  350, "#CE1126"),
    ("Atalanta",            1870,  52,  450, "#1E90FF"),
    ("Sporting CP",         1850,  55,  280, "#006600"),
    ("Young Boys",          1740,  28,  100, "#FFDD00"),
]

TEAM_NAMES  = [t[0] for t in TEAMS]
ELO         = {t[0]: t[1] for t in TEAMS}
UEFA_COEF   = {t[0]: t[2] for t in TEAMS}
SQUAD_VAL   = {t[0]: t[3] for t in TEAMS}
TEAM_COLOUR = {t[0]: t[4] for t in TEAMS}

ELO_MIN = min(ELO.values())
ELO_MAX = max(ELO.values())

def elo_attack(elo):  return 1.0 + 1.2 * (elo - ELO_MIN) / (ELO_MAX - ELO_MIN)
def elo_defence(elo): return 1.4 - 0.9 * (elo - ELO_MIN) / (ELO_MAX - ELO_MIN)

ATTACK  = {t: elo_attack(ELO[t])  for t in TEAM_NAMES}
DEFENCE = {t: elo_defence(ELO[t]) for t in TEAM_NAMES}

HOME_ADV = 0.25

def sim_match(home, away, rng):
    lh = ATTACK[home] * DEFENCE[away] * (1 + HOME_ADV)
    la = ATTACK[away] * DEFENCE[home]
    gh = int(rng.poisson(lh))
    ga = int(rng.poisson(la))
    soth = int(rng.poisson(max(lh * 3.2, 1)))
    sota = int(rng.poisson(max(la * 3.2, 1)))
    elo_d = ELO[home] - ELO[away]
    poss_h = float(np.clip(50 + 0.02*elo_d + rng.normal(0,5), 30, 70))
    rest_h = int(rng.integers(3, 10))
    rest_a = int(rng.integers(3, 10))
    return dict(
        goals_home=gh, goals_away=ga,
        shots_home=soth, shots_away=sota,
        poss_home=round(poss_h,1), poss_away=round(100-poss_h,1),
        rest_days_home=rest_h, rest_days_away=rest_a,
        home_elo=ELO[home], away_elo=ELO[away],
        home_ucoef=UEFA_COEF[home], away_ucoef=UEFA_COEF[away],
        home_sqval=SQUAD_VAL[home], away_sqval=SQUAD_VAL[away],
    )

SEASONS = [f"{y}-{str(y+1)[2:]}" for y in range(2015, 2025)]

def gen_groups(season, rng):
    teams = list(rng.choice(TEAM_NAMES, min(32, len(TEAM_NAMES)), replace=False))
    rows = []
    for g in range(8):
        grp = teams[g*4:(g+1)*4]
        lbl = "ABCDEFGH"[g]
        for i in range(4):
            for j in range(4):
                if i == j: continue
                m = sim_match(grp[i], grp[j], rng)
                rows.append({**m, "season": season, "stage": "group",
                              "group": lbl, "home_team": grp[i], "away_team": grp[j]})
    return rows

def gen_ko(season, teams_in, stage, rng):
    rows = []
    teams = list(teams_in)
    rng.shuffle(teams)
    while len(teams) >= 2:
        h, a = teams.pop(), teams.pop()
        m = sim_match(h, a, rng)
        rows.append({**m, "season": season, "stage": stage, "group": "KO",
                     "home_team": h, "away_team": a})
    return rows

all_rows = []
rng = np.random.default_rng(42)

for season in SEASONS:
    grp = gen_groups(season, rng)
    all_rows.extend(grp)
    # Determine qualifiers
    pts = defaultdict(int)
    for m in grp:
        if m["goals_home"] > m["goals_away"]: pts[m["home_team"]] += 3
        elif m["goals_home"] == m["goals_away"]: pts[m["home_team"]] += 1; pts[m["away_team"]] += 1
        else: pts[m["away_team"]] += 3
    grp_teams = defaultdict(list)
    for m in grp:
        for t in [m["home_team"], m["away_team"]]:
            if t not in grp_teams[m["group"]]: grp_teams[m["group"]].append(t)
    qualifiers = []
    for g, gt in grp_teams.items():
        qualifiers.extend(sorted(gt, key=lambda t: pts[t], reverse=True)[:2])
    rng.shuffle(qualifiers)
    r16 = gen_ko(season, qualifiers, "round_of_16", rng)
    all_rows.extend(r16)
    qf_teams = [r["home_team"] if r["goals_home"]>r["goals_away"] else r["away_team"] for r in r16]
    qf = gen_ko(season, qf_teams, "quarter_final", rng)
    all_rows.extend(qf)
    sf_teams = [r["home_team"] if r["goals_home"]>r["goals_away"] else r["away_team"] for r in qf]
    sf = gen_ko(season, sf_teams, "semi_final", rng)
    all_rows.extend(sf)
    fin_teams = [r["home_team"] if r["goals_home"]>r["goals_away"] else r["away_team"] for r in sf]
    fin = gen_ko(season, fin_teams, "final", rng)
    all_rows.extend(fin)

df = pd.DataFrame(all_rows)
df["result"] = df.apply(
    lambda r: "H" if r.goals_home > r.goals_away else ("D" if r.goals_home == r.goals_away else "A"), axis=1)
df["goal_diff"] = df["goals_home"] - df["goals_away"]
df["elo_diff"] = df["home_elo"] - df["away_elo"]
df["ucoef_diff"] = df["home_ucoef"] - df["away_ucoef"]
df["sqval_diff"] = df["home_sqval"] - df["away_sqval"]

# Rolling form (last 5 for each team per row order)
df = df.reset_index(drop=True)
form_h = defaultdict(list)
form_a = defaultdict(list)

def last5_pts(lst):
    return sum(lst[-5:]) if lst else 7

home_form_col, away_form_col = [], []
for _, row in df.iterrows():
    h, a = row.home_team, row.away_team
    home_form_col.append(last5_pts(form_h[h]))
    away_form_col.append(last5_pts(form_a[a]))
    res = row.result
    form_h[h].append(3 if res=="H" else (1 if res=="D" else 0))
    form_a[a].append(3 if res=="A" else (1 if res=="D" else 0))

df["home_form5"] = home_form_col
df["away_form5"] = away_form_col
df["form_diff"]  = df["home_form5"] - df["away_form5"]
df["rest_diff"]  = df["rest_days_home"] - df["rest_days_away"]

csv_path = os.path.join(DATA, "ucl_matches.csv")
df.to_csv(csv_path, index=False)
print(f"[data] Saved {len(df)} rows -> {csv_path}")

# Save team metadata
meta = {t[0]: {"elo": t[1], "uefa_coef": t[2], "squad_value_M": t[3],
                "colour": t[4], "attack": round(elo_attack(t[1]),4),
                "defence": round(elo_defence(t[1]),4)} for t in TEAMS}
with open(os.path.join(DATA, "team_metadata.json"), "w") as f:
    json.dump(meta, f, indent=2)
print("[data] Saved team_metadata.json")

# ── TRAIN MODELS ─────────────────────────────────────────────────────────────
from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes     import GaussianNB
from sklearn.svm             import SVC
from sklearn.preprocessing   import StandardScaler, LabelEncoder
from sklearn.pipeline        import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics         import (accuracy_score, f1_score, log_loss,
                                     roc_auc_score, precision_score, recall_score,
                                     classification_report, confusion_matrix)
from sklearn.calibration     import CalibratedClassifierCV
import xgboost as xgb
import joblib

FEATURES = ["elo_diff","ucoef_diff","sqval_diff",
            "home_form5","away_form5","form_diff",
            "rest_diff","poss_home","shots_home","shots_away"]

df_model = df[df["stage"].isin(["group","round_of_16","quarter_final","semi_final","final"])].copy()
df_model = df_model.dropna(subset=FEATURES+["result"])

X = df_model[FEATURES]
y = df_model["result"]   # H / D / A

le = LabelEncoder()
y_enc = le.fit_transform(y)

X_tr, X_te, y_tr, y_te = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

scaler = StandardScaler()
X_tr_s = scaler.fit_transform(X_tr)
X_te_s  = scaler.transform(X_te)

MODELS = {
    "logistic_regression": Pipeline([("sc", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, C=1.0, random_state=42))]),
    "naive_bayes": Pipeline([("sc", StandardScaler()), ("clf", GaussianNB())]),
    "random_forest": RandomForestClassifier(n_estimators=300, max_depth=8,
                                             min_samples_leaf=8, random_state=42, n_jobs=-1),
    "xgboost": xgb.XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.05,
                                   subsample=0.8, colsample_bytree=0.8,
                                   use_label_encoder=False, eval_metric="mlogloss",
                                   random_state=42),
    "gradient_boosting": GradientBoostingClassifier(n_estimators=200, max_depth=4,
                                                      learning_rate=0.05, random_state=42),
}

metrics_all = {}
for name, model in MODELS.items():
    print(f"[train] Fitting {name}...")
    model.fit(X_tr_s if "naive_bayes" in name or "logistic" in name else X_tr, y_tr)
    if "naive_bayes" in name or "logistic" in name:
        y_pred = model.predict(X_te_s)
        y_prob = model.predict_proba(X_te_s)
    else:
        y_pred = model.predict(X_te)
        y_prob = model.predict_proba(X_te)

    acc = accuracy_score(y_te, y_pred)
    f1  = f1_score(y_te, y_pred, average="macro")
    ll  = log_loss(y_te, y_prob)
    auc = roc_auc_score(y_te, y_prob, multi_class="ovr", average="macro")
    pre = precision_score(y_te, y_pred, average="macro", zero_division=0)
    rec = recall_score(y_te, y_pred, average="macro", zero_division=0)
    cm  = confusion_matrix(y_te, y_pred).tolist()
    metrics_all[name] = {
        "accuracy": round(acc,4), "f1": round(f1,4), "log_loss": round(ll,4),
        "roc_auc": round(auc,4), "precision": round(pre,4), "recall": round(rec,4),
        "confusion_matrix": cm,
        "class_report": classification_report(y_te, y_pred,
                         target_names=le.classes_, output_dict=True),
    }
    print(f"  Acc={acc:.3f}  F1={f1:.3f}  AUC={auc:.3f}  LL={ll:.3f}")
    joblib.dump(model, os.path.join(MDIR, f"{name}.pkl"))

# Save ensemble as XGBoost (best single model)
joblib.dump(MODELS["xgboost"],            os.path.join(MDIR, "ensemble.pkl"))
joblib.dump(scaler,                        os.path.join(MDIR, "scaler.pkl"))
joblib.dump(le,                            os.path.join(MDIR, "label_encoder.pkl"))
joblib.dump(FEATURES,                      os.path.join(MDIR, "features.pkl"))
with open(os.path.join(MDIR, "metrics.json"), "w") as f:
    json.dump(metrics_all, f, indent=2)
print("[train] All models saved.")

# Feature importance (from XGBoost)
xgb_model = MODELS["xgboost"]
fi = dict(zip(FEATURES, xgb_model.feature_importances_.tolist()))
with open(os.path.join(MDIR, "feature_importance.json"), "w") as f:
    json.dump(fi, f, indent=2)
print("[train] Feature importance saved.")
print("\nDone! Run the backend with: uvicorn main:app --reload")
