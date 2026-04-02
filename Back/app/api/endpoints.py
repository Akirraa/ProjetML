from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Query
from ..services.data_service import data_service
from ..services.ml_service import ml_service
from ..schemas.models import TrainRequest, TrainingStatusResponse, PredictRequest
from typing import List, Dict, Any
import mlflow
import pandas as pd

router = APIRouter()

@router.get("/stats")
async def get_stats():
    return data_service.get_stats()

@router.get("/data/sample")
async def get_sample(n: int = 50, page: int = 1):
    return data_service.get_sample(n, page)

@router.post("/data/clean")
async def clean_dataset():
    return data_service.clean_dataset()

@router.post("/data/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    content = await file.read()
    result = data_service.load_from_bytes(content)
    if result.get("status") == "error":
        raise HTTPException(status_code=422, detail=result["detail"])
    return result

@router.get("/models")
async def get_models():
    return ml_service.get_supported_models()

@router.post("/train")
async def train_model(request: TrainRequest):
    run_id = ml_service.start_training(request.model_type, request.params, request.experiment_name)
    return {"run_id": run_id}

@router.get("/train/status/{run_id}")
async def get_training_status(run_id: str):
    status = ml_service.current_training_status.get(run_id)
    if not status:
        # Check mlflow if not in memory (for persistent history)
        try:
            run = mlflow.get_run(run_id)
            return {
                "status": "completed" if run.info.status == "FINISHED" else "failed",
                "progress": 100 if run.info.status == "FINISHED" else 0,
                "metrics": run.data.metrics
            }
        except:
            raise HTTPException(status_code=404, detail="Run not found")
    return status

@router.get("/history")
async def get_history():
    return ml_service.get_history()

@router.post("/predict")
async def predict(request: PredictRequest):
    try:
        # 1. Fetch latest "FINISHED" run from Bank_Marketing experiment
        runs = ml_service.get_history()
        if not runs:
            return {"prediction": "no", "confidence": 0.5, "note": "No trained model found. Using default."}
            
        latest_run = next((r for r in runs if r['status'] == 'FINISHED'), None)
        if not latest_run:
            raise Exception("No completed training runs available")
            
        run_id = latest_run['run_id']
        model_uri = f"runs:/{run_id}/model"
        model = mlflow.sklearn.load_model(model_uri)
        
        # 2. Prepare input data (16 features)
        input_df = pd.DataFrame([request.dict()])
        
        # 3. Preprocess and Predict
        # We need to use the same preprocessor as in training. 
        # In a real app we'd save the preprocessor artifact to MLflow too.
        # For this demo, let's use the data_service one (assuming it's consistent)
        preprocessor = data_service.get_preprocessing_pipeline()
        X_train = data_service.df.drop('y', axis=1) if 'y' in data_service.df.columns else data_service.df
        preprocessor.fit(X_train)
        X_processed = preprocessor.transform(input_df)
        prediction = model.predict(X_processed)[0]
        confidence = model.predict_proba(X_processed)[0].max() if hasattr(model, "predict_proba") else 1.0
        
        # 4. Get feature importances from run params (we logged top 10)
        importances = []
        for k, v in latest_run.items():
            if k.startswith('params.imp_') and v is not None:
                importances.append({"label": k.replace('params.imp_', ''), "impact": f"+{float(v)*100:.1f}%", "type": "positive"})
        
        return {
            "prediction": "yes" if prediction == 1 else "no",
            "confidence": float(confidence),
            "run_id": run_id,
            "impactFactors": sorted(importances, key=lambda x: x['impact'], reverse=True)[:3]
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback to smart dummy if model fails to load
        return {"prediction": "no", "confidence": 0.5, "error": str(e)}
