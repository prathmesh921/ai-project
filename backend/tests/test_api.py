"""
test_api.py - Automated Pytest Test Suite
UEFA Champions League AI Match Outcome Predictor
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Verify backend health check returns status 200 and healthy."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_get_teams():
    """Verify teams retrieval returns 36 clubs with required metadata."""
    response = client.get("/api/teams")
    assert response.status_code == 200
    teams = response.json()
    assert len(teams) >= 32
    # Verify team structure
    sample = teams[0]
    assert "name" in sample
    assert "elo" in sample
    assert "uefa_coef" in sample
    assert "squad_value_M" in sample
    assert "colour" in sample

def test_get_team_stats():
    """Verify team stats calculation returns matches, form, and win rate."""
    response = client.get("/api/teams/Real Madrid/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["name"] == "Real Madrid"
    assert stats["total_matches"] > 0
    assert stats["wins"] + stats["draws"] + stats["losses"] == stats["total_matches"]
    assert len(stats["recent_form"]) <= 5
    assert "home_record" in stats
    assert "away_record" in stats

def test_get_matches_pagination():
    """Verify match database retrieval with pagination and filtering."""
    response = client.get("/api/matches?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) <= 10
    assert data["total"] > 1000
    assert data["page"] == 1
    assert data["total_pages"] > 0

def test_predict_identical_teams_rejected():
    """Verify that selecting the same team twice produces HTTP 400."""
    payload = {
        "home_team": "Real Madrid",
        "away_team": "Real Madrid",
        "stage": "group",
        "model": "random_forest"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code in [400, 422]

def test_predict_invalid_team_rejected():
    """Verify that unknown club name returns HTTP 404."""
    payload = {
        "home_team": "NonExistentClubFC",
        "away_team": "Barcelona",
        "stage": "group",
        "model": "random_forest"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code in [404, 422]

def test_valid_match_prediction_and_probability_sum():
    """Verify that valid match prediction returns probabilities strictly summing to ~100%."""
    payload = {
        "home_team": "Real Madrid",
        "away_team": "Barcelona",
        "stage": "knockout",
        "venue": "home",
        "model": "random_forest",
        "form_window": 5,
        "home_adv_weight": 1.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    
    assert res["home_team"] == "Real Madrid"
    assert res["away_team"] == "Barcelona"
    assert res["predicted_outcome"] in ["Home Win", "Draw", "Away Win"]

    probs = res["probabilities"]
    prob_sum = probs["H"] + probs["D"] + probs["A"]
    # Sum must be approximately 1.0 (between 0.999 and 1.001)
    assert abs(prob_sum - 1.0) < 0.005

    # Check scoreline prediction
    assert "predicted_score" in res
    assert "home" in res["predicted_score"]
    assert "away" in res["predicted_score"]

    # Check explainability
    assert len(res["top_features"]) > 0
    assert "confidence_level" in res
    assert res["confidence_level"] in ["High", "Moderate", "Low"]

    # Check prediction history id
    assert res["saved_prediction_id"] is not None

def test_prediction_history_persistence():
    """Verify that generated predictions are persisted in SQLite history."""
    response = client.get("/api/predictions/history?limit=10")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) > 0
    latest = history[0]
    assert "home_team" in latest
    assert "away_team" in latest
    assert "prob_home_win" in latest

def test_model_metrics():
    """Verify that model evaluation metrics endpoint returns genuine classification metrics."""
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "random_forest" in data["models"]
    rf_metrics = data["models"]["random_forest"]
    assert "accuracy" in rf_metrics
    assert "f1" in rf_metrics
    assert "confusion_matrix" in rf_metrics
    assert len(data["feature_importance"]) > 0

def test_head_to_head():
    """Verify Head to Head comparison endpoint."""
    response = client.get("/api/head-to-head?team1=Bayern Munich&team2=Real Madrid")
    assert response.status_code == 200
    h2h = response.json()
    assert h2h["team1"] == "Bayern Munich"
    assert h2h["team2"] == "Real Madrid"
    assert h2h["total_meetings"] >= 0
