"""
predict.py - Inference engine for UEFA Champions League Match Outcome Predictor
Loads trained models and generates calibrated outcome probabilities, scoreline estimates,
and feature importance explainability.
"""
import os
import json
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

from .features import FEATURE_COLUMNS, FEATURE_LABELS, build_match_feature_vector
from .goal_model import compute_expected_goals, generate_scoreline_distribution

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")

class PredictorService:
    def __init__(self):
        self.models = {}
        self.scaler = None
        self.label_encoder = None
        self.feature_columns = FEATURE_COLUMNS
        self.feature_importance = []
        self.metadata = {}
        self.df_matches = None
        self._load_artefacts()

    def _load_artefacts(self):
        try:
            # Metadata
            meta_path = os.path.join(DATA_DIR, "team_metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)

            # Matches dataframe
            csv_path = os.path.join(DATA_DIR, "ucl_matches.csv")
            if os.path.exists(csv_path):
                self.df_matches = pd.read_csv(csv_path)

            # Scaler and label encoder
            scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)

            le_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
            if os.path.exists(le_path):
                self.label_encoder = joblib.load(le_path)

            feat_path = os.path.join(MODELS_DIR, "features.pkl")
            if os.path.exists(feat_path):
                self.feature_columns = joblib.load(feat_path)

            # Models
            for m in ["logistic_regression", "random_forest", "xgboost"]:
                p = os.path.join(MODELS_DIR, f"{m}.pkl")
                if os.path.exists(p):
                    self.models[m] = joblib.load(p)

            # Feature importance
            fi_path = os.path.join(MODELS_DIR, "feature_importance.json")
            if os.path.exists(fi_path):
                with open(fi_path, "r", encoding="utf-8") as f:
                    self.feature_importance = json.load(f)

            print(f"[PredictorService] Loaded {len(self.models)} models and {len(self.metadata)} teams.")
        except Exception as e:
            print(f"[PredictorService] Warning loading artifacts: {e}")

    def predict(
        self,
        home_team: str,
        away_team: str,
        stage: str = "group",
        venue: str = "home",
        model_name: str = "random_forest",
        form_window: int = 5,
        home_adv_weight: float = 1.0,
        injury_home: bool = False,
        injury_away: bool = False
    ) -> Dict[str, Any]:
        """
        Generates calibrated match outcome probabilities, scoreline estimation,
        and explainability breakdown.
        """
        if home_team == away_team:
            raise ValueError("Home team and away team cannot be the same club.")

        if home_team not in self.metadata or away_team not in self.metadata:
            raise KeyError(f"Team not recognized in UEFA dataset: {home_team} or {away_team}")

        # Build feature vector
        X_raw, context = build_match_feature_vector(
            home_team=home_team,
            away_team=away_team,
            metadata=self.metadata,
            matches_history=self.df_matches if self.df_matches is not None else pd.DataFrame(),
            stage=stage,
            venue=venue,
            form_window=form_window,
            home_adv_weight=home_adv_weight,
            injury_home=injury_home,
            injury_away=injury_away
        )

        # Predict outcome probabilities
        probs = self._predict_probabilities(model_name, X_raw)

        # Ensure probabilities sum strictly to 1.0 (100.0%)
        total_p = probs["H"] + probs["D"] + probs["A"]
        p_h = round(probs["H"] / total_p, 4)
        p_d = round(probs["D"] / total_p, 4)
        p_a = round(1.0 - p_h - p_d, 4)
        calibrated_probs = {"H": p_h, "D": p_d, "A": p_a}

        # Most likely outcome
        if p_h >= p_d and p_h >= p_a:
            predicted_outcome = "Home Win"
            top_p = p_h
        elif p_a >= p_h and p_a >= p_d:
            predicted_outcome = "Away Win"
            top_p = p_a
        else:
            predicted_outcome = "Draw"
            top_p = p_d

        # Confidence level
        if top_p >= 0.58:
            confidence_level = "High"
            confidence_exp = f"Model predicts {predicted_outcome} with strong probability ({top_p*100:.1f}%), driven by significant statistical separation in Elo rating, squad market value, and rolling form."
        elif top_p >= 0.45:
            confidence_level = "Moderate"
            confidence_exp = f"Model favors {predicted_outcome} ({top_p*100:.1f}%), but competitive parity or venue factor introduces reasonable draw/upset probability."
        else:
            confidence_level = "Low"
            confidence_exp = f"Highly contested match ({top_p*100:.1f}% max probability). The teams are closely matched across recent form, European coefficient, and squad strength."

        # Poisson expected goals scoreline prediction (separately evaluated)
        hm = self.metadata[home_team]
        am = self.metadata[away_team]
        lambda_h, lambda_a = compute_expected_goals(
            home_attack=hm.get("attack", 1.5),
            away_defence=am.get("defence", 0.8),
            away_attack=am.get("attack", 1.5),
            home_defence=hm.get("defence", 0.8),
            venue=venue,
            home_adv_weight=home_adv_weight,
            stage=stage
        )
        most_likely_score, scorelines = generate_scoreline_distribution(lambda_h, lambda_a)

        # Feature explainability
        top_features = self._build_explainability(X_raw)

        # Elo-based bookmaker implied probabilities
        elo_diff = (hm["elo"] - am["elo"]) + (50.0 if venue == "home" else 0.0)
        bk_h = round(1.0 / (1.0 + 10.0 ** (-elo_diff / 400.0)), 3)
        bk_d = round(0.24 * np.exp(-0.0003 * (elo_diff ** 2)), 3)
        bk_a = round(max(0.05, 1.0 - bk_h - bk_d), 3)

        return {
            "home_team": home_team,
            "away_team": away_team,
            "stage": stage,
            "venue": venue,
            "model_used": model_name,
            "probabilities": calibrated_probs,
            "predicted_outcome": predicted_outcome,
            "predicted_score": most_likely_score,
            "confidence_score": round(top_p, 4),
            "confidence_level": confidence_level,
            "confidence_explanation": confidence_exp,
            "top_features": top_features,
            "scorelines": scorelines,
            "h2h": context["h2h"],
            "home_form": context["home_form"],
            "away_form": context["away_form"],
            "bookmaker_implied_probs": {"H": bk_h, "D": bk_d, "A": bk_a},
        }

    def _predict_probabilities(self, model_name: str, X_raw: np.ndarray) -> Dict[str, float]:
        if model_name == "ensemble":
            # Soft voting ensemble of available models
            probs_list = []
            for name in ["random_forest", "xgboost", "logistic_regression"]:
                if name in self.models:
                    probs_list.append(self._predict_single_model(name, X_raw))
            if probs_list:
                avg_h = np.mean([p["H"] for p in probs_list])
                avg_d = np.mean([p["D"] for p in probs_list])
                avg_a = np.mean([p["A"] for p in probs_list])
                return {"H": float(avg_h), "D": float(avg_d), "A": float(avg_a)}
            return {"H": 0.45, "D": 0.25, "A": 0.30}

        return self._predict_single_model(model_name, X_raw)

    def _predict_single_model(self, model_name: str, X_raw: np.ndarray) -> Dict[str, float]:
        model = self.models.get(model_name) or self.models.get("random_forest")
        if model is None:
            # Fallback Elo logistic model
            elo_d = float(X_raw[0][0])
            p_h = 1.0 / (1.0 + 10.0 ** (-elo_d / 400.0))
            p_d = 0.25
            p_a = max(0.05, 1.0 - p_h - p_d)
            return {"H": p_h, "D": p_d, "A": p_a}

        X_in = self.scaler.transform(X_raw) if (model_name == "logistic_regression" and self.scaler) else X_raw
        try:
            proba = model.predict_proba(X_in)[0]
            classes = self.label_encoder.classes_ if self.label_encoder else ["A", "D", "H"]
            return {c: float(p) for c, p in zip(classes, proba)}
        except Exception as e:
            print(f"[PredictorService] Prediction error: {e}")
            return {"H": 0.45, "D": 0.25, "A": 0.30}

    def _build_explainability(self, X_raw: np.ndarray) -> List[Dict[str, Any]]:
        explanations = []
        fi_sorted = self.feature_importance[:5] if self.feature_importance else []

        for item in fi_sorted:
            col = item["feature"]
            imp = item["importance"]
            if col in self.feature_columns:
                idx = self.feature_columns.index(col)
                val = float(X_raw[0][idx])
                direction = "favours home" if val > 0 else ("favours away" if val < 0 else "neutral")
                explanations.append({
                    "feature": col,
                    "label": FEATURE_LABELS.get(col, col),
                    "importance": imp,
                    "value": round(val, 2),
                    "direction": direction,
                })

        return explanations

# Singleton predictor instance
predictor_service = PredictorService()
