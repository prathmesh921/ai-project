"""
simulate.py - Monte Carlo simulation of UCL Knockout Tournament
Simulates 1,000 tournaments using trained ML model outcome probabilities.
"""
from typing import List
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ml.predict import predictor_service
except ImportError:
    from ..ml.predict import predictor_service

router = APIRouter(tags=["Simulator"])

class SimRequest(BaseModel):
    teams: List[str] = Field(..., min_length=2, max_length=32)
    n_simulations: int = Field(default=1000, ge=100, le=5000)

@router.post("/simulate")
def simulate_tournament(req: SimRequest):
    """Runs a Monte Carlo simulation of the knockout tournament using ML outcome probabilities."""
    valid_teams = [t for t in req.teams if t in predictor_service.metadata]
    if len(valid_teams) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid UEFA clubs must be selected.")

    # Pad or trim to power of 2 (2, 4, 8, or 16)
    n_teams = len(valid_teams)
    if n_teams not in [2, 4, 8, 16]:
        # Truncate to nearest lower power of 2
        target = 16 if n_teams >= 16 else (8 if n_teams >= 8 else (4 if n_teams >= 4 else 2))
        valid_teams = valid_teams[:target]

    n_sim = req.n_simulations
    rng = np.random.default_rng(42)
    # Track progression counts
    counts = {t: {"qf": 0, "sf": 0, "final": 0, "winner": 0} for t in valid_teams}

    # Pre-compute pairwise probabilities to ensure instant Monte Carlo runs
    pairwise_cache = {}
    for i in range(len(valid_teams)):
        for j in range(len(valid_teams)):
            if i != j:
                t1, t2 = valid_teams[i], valid_teams[j]
                res = predictor_service.predict(t1, t2, stage="knockout", venue="neutral")
                p_h = res["probabilities"]["H"]
                p_d = res["probabilities"]["D"]
                pairwise_cache[(t1, t2)] = p_h + 0.5 * p_d

    def sim_match_winner(t1: str, t2: str) -> str:
        p_adv = pairwise_cache.get((t1, t2), 0.5)
        return t1 if rng.random() < p_adv else t2

    for _ in range(n_sim):
        current_round = list(valid_teams)
        rng.shuffle(current_round)

        # Round tracking
        # If starting with 16: R16 -> QF -> SF -> Final -> Winner
        # If starting with 8: QF -> SF -> Final -> Winner
        while len(current_round) > 1:
            stage_name = None
            if len(current_round) == 8:
                stage_name = "qf"
            elif len(current_round) == 4:
                stage_name = "sf"
            elif len(current_round) == 2:
                stage_name = "final"

            next_round = []
            for i in range(0, len(current_round), 2):
                if i + 1 < len(current_round):
                    w = sim_match_winner(current_round[i], current_round[i+1])
                    next_round.append(w)
                    if stage_name:
                        counts[current_round[i]][stage_name] += 1
                        counts[current_round[i+1]][stage_name] += 1
                else:
                    next_round.append(current_round[i])
            current_round = next_round

        # Winner
        if current_round:
            counts[current_round[0]]["winner"] += 1

    probabilities = {}
    for t, c in counts.items():
        probabilities[t] = {
            "qf": round(c["qf"] / n_sim, 4),
            "sf": round(c["sf"] / n_sim, 4),
            "final": round(c["final"] / n_sim, 4),
            "winner": round(c["winner"] / n_sim, 4),
        }

    return {
        "teams": valid_teams,
        "n_simulations": n_sim,
        "probabilities": probabilities
    }
