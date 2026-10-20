"""
goal_model.py - Poisson-based Scoreline Prediction Model
Separately evaluated from match outcome classifier.
Uses team attack/defense ratings and Poisson distribution to compute scoreline probabilities.
"""
from typing import Dict, List, Tuple
import math

def poisson_pmf(k: int, lamb: float) -> float:
    """Calculate Poisson probability P(X = k; lambda)."""
    if lamb <= 0:
        return 1.0 if k == 0 else 0.0
    return (math.pow(lamb, k) * math.exp(-lamb)) / math.factorial(k)

def compute_expected_goals(
    home_attack: float,
    away_defence: float,
    away_attack: float,
    home_defence: float,
    venue: str = "home",
    home_adv_weight: float = 1.0,
    stage: str = "group"
) -> Tuple[float, float]:
    """
    Computes lambda_home and lambda_away expected goals.
    Incorporates venue advantage and knockout game tightness (knockouts have slightly fewer goals).
    """
    home_adv = 1.22 * home_adv_weight if venue == "home" else (1.0 if venue == "neutral" else 0.85)
    
    # Knockout matches are typically tighter tactically
    stage_factor = 0.92 if stage in ["round_of_16", "quarter_final", "semi_final", "final"] else 1.0
    
    lambda_home = max(0.4, home_attack * away_defence * home_adv * stage_factor)
    lambda_away = max(0.3, away_attack * home_defence * stage_factor)
    
    return round(lambda_home, 3), round(lambda_away, 3)

def generate_scoreline_distribution(
    lambda_home: float,
    lambda_away: float,
    max_goals: int = 5
) -> Tuple[Dict[str, int], List[Dict[str, float]]]:
    """
    Computes the joint probability matrix for scores 0-0 up to max_goals-max_goals.
    Returns (most_likely_score, top_scorelines).
    """
    scorelines = []
    
    for gh in range(max_goals + 1):
        for ga in range(max_goals + 1):
            prob = poisson_pmf(gh, lambda_home) * poisson_pmf(ga, lambda_away)
            scorelines.append({
                "home_goals": gh,
                "away_goals": ga,
                "probability": round(float(prob), 4)
            })
            
    # Sort by descending probability
    scorelines.sort(key=lambda x: x["probability"], reverse=True)
    most_likely = {"home": scorelines[0]["home_goals"], "away": scorelines[0]["away_goals"]}
    
    return most_likely, scorelines[:20]
