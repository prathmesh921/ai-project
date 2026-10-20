"""
train.py - Machine Learning Model Training & Rigorous Evaluation Pipeline
UEFA Champions League Match Outcome Predictor
"""
import os
import json
import warnings
from typing import Dict, Any, List
import numpy as np
import pandas as pd
import joblib

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    log_loss, confusion_matrix, classification_report
)

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from .features import FEATURE_COLUMNS, extract_pre_match_stats, extract_h2h_stats
except (ImportError, ValueError):
    from features import FEATURE_COLUMNS, extract_pre_match_stats, extract_h2h_stats

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def build_chronological_features(df_matches: pd.DataFrame, metadata: Dict[str, Any]) -> pd.DataFrame:
    """
    Computes features for each match using ONLY prior matches in chronological sequence.
    This guarantees zero temporal data leakage.
    """
    rows = []
    
    # Iterate chronologically through the matches
    for idx, row in df_matches.iterrows():
        # Previous matches only
        prior_matches = df_matches.iloc[:idx]

        home_team = row["home_team"]
        away_team = row["away_team"]
        stage = row.get("stage", "group")
        
        hm = metadata.get(home_team, {})
        am = metadata.get(away_team, {})

        h_elo = row.get("home_elo", hm.get("elo", 1850))
        a_elo = row.get("away_elo", am.get("elo", 1850))
        elo_diff = (h_elo - a_elo) + 50.0  # Standard home venue advantage

        ucoef_diff = float(row.get("home_ucoef", hm.get("uefa_coef", 50.0)) - 
                           row.get("away_ucoef", am.get("uefa_coef", 50.0)))
        
        sqval_diff = float(row.get("home_sqval", hm.get("squad_value_M", 300.0)) - 
                           row.get("away_sqval", am.get("squad_value_M", 300.0)))

        h_pts, h_gf, h_ga, _ = extract_pre_match_stats(home_team, prior_matches, window=5)
        a_pts, a_gf, a_ga, _ = extract_pre_match_stats(away_team, prior_matches, window=5)
        form_diff = h_pts - a_pts

        rest_h = int(row.get("rest_days_home", 6))
        rest_a = int(row.get("rest_days_away", 6))
        rest_days_diff = rest_h - rest_a

        is_knockout = 1 if stage in ["round_of_16", "quarter_final", "semi_final", "final", "KO"] else 0

        hw, aw, dr, _ = extract_h2h_stats(home_team, away_team, prior_matches)

        result = row["result"]  # 'H', 'D', 'A'
        season = row["season"]

        rows.append({
            "season": season,
            "home_team": home_team,
            "away_team": away_team,
            "result": result,
            "elo_diff": elo_diff,
            "ucoef_diff": ucoef_diff,
            "sqval_diff": sqval_diff,
            "home_form_pts": h_pts,
            "away_form_pts": a_pts,
            "form_diff": form_diff,
            "home_avg_gf": h_gf,
            "away_avg_gf": a_gf,
            "home_avg_ga": h_ga,
            "away_avg_ga": a_ga,
            "rest_days_diff": rest_days_diff,
            "is_knockout": is_knockout,
            "h2h_home_wins": hw,
            "h2h_away_wins": aw,
            "h2h_draws": dr,
        })

    return pd.DataFrame(rows)

def train_and_evaluate():
    print("[ML] Starting UCL Machine Learning pipeline...")

    # Load dataset
    csv_path = os.path.join(DATA_DIR, "ucl_matches.csv")
    meta_path = os.path.join(DATA_DIR, "team_metadata.json")

    if not os.path.exists(csv_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("Dataset files not found in data/ directory.")

    df_raw = pd.read_csv(csv_path)
    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    print(f"[ML] Raw matches loaded: {len(df_raw)} records across {df_raw['season'].nunique()} seasons.")

    # Build chronological feature dataframe
    print("[ML] Computing strict chronological rolling features...")
    df_feat = build_chronological_features(df_raw, metadata)

    # Chronological Train/Test Split
    # Train: 2015-16 to 2021-22 (7 seasons)
    # Test:  2022-23 to 2024-25 (3 seasons)
    train_seasons = ['2015-16', '2016-17', '2017-18', '2018-19', '2019-20', '2020-21', '2021-22']
    test_seasons = ['2022-23', '2023-24', '2024-25']

    train_df = df_feat[df_feat["season"].isin(train_seasons)]
    test_df = df_feat[df_feat["season"].isin(test_seasons)]

    print(f"[ML] Chronological Split: Train set = {len(train_df)} matches, Test set = {len(test_df)} matches.")

    X_train_raw = train_df[FEATURE_COLUMNS].values
    y_train_raw = train_df["result"].values

    X_test_raw = test_df[FEATURE_COLUMNS].values
    y_test_raw = test_df["result"].values

    # Encode target labels ('A', 'D', 'H' -> 0, 1, 2)
    le = LabelEncoder()
    le.fit(["A", "D", "H"])
    y_train = le.transform(y_train_raw)
    y_test = le.transform(y_test_raw)

    # Fit scaler on TRAINING SET ONLY to prevent data leakage
    scaler = StandardScaler()
    scaler.fit(X_train_raw)
    X_train_scaled = scaler.transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    models = {}
    metrics_report = {}

    # 1. Baseline: Logistic Regression
    print("[ML] Training Baseline Logistic Regression...")
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)
    models["logistic_regression"] = lr

    # 2. Random Forest Classifier
    print("[ML] Training Random Forest Classifier...")
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=8,
        min_samples_leaf=4,
        random_state=42,
        class_weight="balanced_subsample"
    )
    rf.fit(X_train_raw, y_train)
    models["random_forest"] = rf

    # 3. XGBoost Classifier
    if HAS_XGB:
        print("[ML] Training XGBoost Classifier...")
        xgb_model = xgb.XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            n_estimators=120,
            max_depth=4,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="mlogloss"
        )
        xgb_model.fit(X_train_raw, y_train)
        models["xgboost"] = xgb_model

    # Evaluate each model on the TEST SET
    print("[ML] Evaluating models on chronological test set...")
    for name, model in models.items():
        X_test = X_test_scaled if name == "logistic_regression" else X_test_raw
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        loss = float(log_loss(y_test, y_proba))
        cm = confusion_matrix(y_test, y_pred).tolist()
        clf_rep = classification_report(y_test, y_pred, target_names=["A", "D", "H"], output_dict=True, zero_division=0)

        metrics_report[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "log_loss": round(loss, 4),
            "confusion_matrix": cm,
            "class_report": clf_rep,
        }
        print(f"   -> {name}: Accuracy={acc:.4f}, Macro-F1={f1:.4f}, Log-Loss={loss:.4f}")

    # Feature importances from Random Forest
    importances = rf.feature_importances_
    std = np.std([tree.feature_importances_ for tree in rf.estimators_], axis=0)
    fi_list = []
    for col, imp, s in zip(FEATURE_COLUMNS, importances, std):
        fi_list.append({
            "feature": col,
            "importance": round(float(imp), 4),
            "std": round(float(s), 4)
        })
    fi_list.sort(key=lambda x: x["importance"], reverse=True)

    # Class distribution in test set
    test_counts = pd.Series(y_test_raw).value_counts().to_dict()

    # Save artifacts
    print("[ML] Saving models and metrics artifacts...")
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    joblib.dump(FEATURE_COLUMNS, os.path.join(MODELS_DIR, "features.pkl"))

    for name, model in models.items():
        joblib.dump(model, os.path.join(MODELS_DIR, f"{name}.pkl"))

    with open(os.path.join(MODELS_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_report, f, indent=2)

    with open(os.path.join(MODELS_DIR, "feature_importance.json"), "w", encoding="utf-8") as f:
        json.dump(fi_list, f, indent=2)

    eval_metadata = {
        "test_period": "2022-23 to 2024-25 (3 seasons)",
        "train_period": "2015-16 to 2021-22 (7 seasons)",
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "class_distribution_test": test_counts,
        "feature_count": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "split_method": "Chronological Season Split (Zero Temporal Data Leakage)",
    }
    with open(os.path.join(MODELS_DIR, "evaluation_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(eval_metadata, f, indent=2)

    print("[ML] Pipeline complete. All artifacts saved successfully.")
    return metrics_report

if __name__ == "__main__":
    train_and_evaluate()
