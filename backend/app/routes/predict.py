"""
predict.py - Prediction API routes: inference, explainability, and history persistence in SQLite
"""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..database import get_db
from ..models import PredictionModel, TeamModel
from ..schemas import PredictRequest, PredictResponse, PredictionHistoryItem
try:
    from ml.predict import predictor_service
except ImportError:
    from ..ml.predict import predictor_service

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictResponse)
def run_prediction(req: PredictRequest, db: Session = Depends(get_db)):
    """
    Executes machine learning prediction for a match outcome.
    Ensures probability sum = 100%, generates Poisson scoreline,
    computes explainability, and persists the prediction to SQLite.
    """
    if req.home_team == req.away_team:
        raise HTTPException(
            status_code=400,
            detail="Cannot predict match between identical teams. Please select two distinct clubs."
        )

    # Check teams exist
    t1 = db.query(TeamModel).filter(TeamModel.name == req.home_team).first()
    t2 = db.query(TeamModel).filter(TeamModel.name == req.away_team).first()
    if not t1 or not t2:
        missing = req.home_team if not t1 else req.away_team
        raise HTTPException(
            status_code=404,
            detail=f"Team '{missing}' not found in official UEFA dataset."
        )

    try:
        pred_dict = predictor_service.predict(
            home_team=req.home_team,
            away_team=req.away_team,
            stage=req.stage,
            venue=req.venue,
            model_name=req.model,
            form_window=req.form_window,
            home_adv_weight=req.home_adv_weight,
            injury_home=req.injury_home,
            injury_away=req.injury_away
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Persist prediction to SQLite
    try:
        new_pred = PredictionModel(
            home_team=req.home_team,
            away_team=req.away_team,
            stage=req.stage,
            venue=req.venue,
            model_used=req.model,
            prob_home_win=pred_dict["probabilities"]["H"],
            prob_draw=pred_dict["probabilities"]["D"],
            prob_away_win=pred_dict["probabilities"]["A"],
            predicted_outcome=pred_dict["predicted_outcome"],
            predicted_score_home=pred_dict["predicted_score"]["home"],
            predicted_score_away=pred_dict["predicted_score"]["away"],
            confidence_score=pred_dict["confidence_score"],
            confidence_level=pred_dict["confidence_level"],
            top_features_json=json.dumps(pred_dict["top_features"])
        )
        db.add(new_pred)
        db.commit()
        db.refresh(new_pred)
        pred_dict["saved_prediction_id"] = new_pred.id
    except Exception as e:
        print(f"[API] Warning saving prediction to database: {e}")
        pred_dict["saved_prediction_id"] = None

    return pred_dict

@router.get("/predictions/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    team: Optional[str] = Query(None, description="Filter by team"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves saved user predictions stored in SQLite."""
    query = db.query(PredictionModel)

    if team:
        query = query.filter(or_(PredictionModel.home_team == team, PredictionModel.away_team == team))

    records = query.order_by(desc(PredictionModel.timestamp)).limit(limit).all()

    return [
        PredictionHistoryItem(
            id=r.id,
            timestamp=r.timestamp,
            home_team=r.home_team,
            away_team=r.away_team,
            stage=r.stage,
            venue=r.venue,
            model_used=r.model_used,
            prob_home_win=r.prob_home_win,
            prob_draw=r.prob_draw,
            prob_away_win=r.prob_away_win,
            predicted_outcome=r.predicted_outcome,
            predicted_score_home=r.predicted_score_home,
            predicted_score_away=r.predicted_score_away,
            confidence_level=r.confidence_level
        )
        for r in records
    ]

@router.delete("/predictions/history/{pred_id}")
def delete_prediction(pred_id: int, db: Session = Depends(get_db)):
    """Deletes a specific saved prediction from the database."""
    item = db.query(PredictionModel).filter(PredictionModel.id == pred_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    db.delete(item)
    db.commit()
    return {"status": "success", "message": f"Deleted prediction #{pred_id}"}

@router.delete("/predictions/history")
def clear_all_predictions(db: Session = Depends(get_db)):
    """Clears all saved prediction records."""
    count = db.query(PredictionModel).delete()
    db.commit()
    return {"status": "success", "message": f"Cleared {count} saved predictions."}
