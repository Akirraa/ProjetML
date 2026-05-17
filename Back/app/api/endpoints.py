from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Query
from ..services.data_service import data_service
from ..services.ml_service import ml_service
from ..services.rf_analysis import rf_analysis_service
from ..schemas.models import TrainRequest, TrainingStatusResponse, PredictRequest
from typing import List, Dict, Any
import mlflow
import pandas as pd
from mlflow.tracking import MlflowClient
import sys
import os


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
        from mlflow.tracking import MlflowClient
        client = MlflowClient()
        
        try:
            # Fetch the latest production model version
            prod_versions = client.get_latest_versions("mon_modele_production", stages=["Production"])
            if not prod_versions:
                raise Exception("No model currently in Production stage")
            
            prod_version = prod_versions[0]
            run_id = prod_version.run_id
            
            # Load the model directly from the Registry (Partie 4 requirement)
            model_uri = "models:/mon_modele_production/Production"
            model = mlflow.sklearn.load_model(model_uri)
            
            # Get the run details to extract feature importances
            prod_run = client.get_run(run_id)
            run_params = prod_run.data.params
            
        except Exception as e:
            return {"prediction": "no", "confidence": 0.5, "error": f"Production model not found: {str(e)}"}
        
        # 2. Prepare input data (16 features)
        input_df = pd.DataFrame([request.dict()])
        
        # 3. Preprocess and Predict
        preprocessor = data_service.get_preprocessing_pipeline()
        X_train = data_service.df.drop('y', axis=1) if 'y' in data_service.df.columns else data_service.df
        preprocessor.fit(X_train)
        X_processed = preprocessor.transform(input_df)
        prediction = model.predict(X_processed)[0]
        confidence = model.predict_proba(X_processed)[0].max() if hasattr(model, "predict_proba") else 1.0
        
        # 4. Get feature importances from run params (we logged top 10)
        importances = []
        for k, v in run_params.items():
            if k.startswith('imp_') and v is not None:
                importances.append({"label": k.replace('imp_', ''), "impact": f"+{float(v)*100:.1f}%", "type": "positive"})
        
        return {
            "prediction": "yes" if prediction == 1 else "no",
            "confidence": float(confidence),
            "run_id": run_id,
            "impactFactors": sorted(importances, key=lambda x: x['impact'], reverse=True)[:3]
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"prediction": "no", "confidence": 0.5, "error": str(e)}

@router.get("/rf-analysis")
async def get_rf_analysis(n_estimators: int = 100, max_depth: str = "None"):
    try:
        # Parse max_depth
        parsed_depth = None if max_depth == "None" else int(max_depth)
        return rf_analysis_service.run_full_analysis(base_n_estimators=n_estimators, base_max_depth=parsed_depth)
    except Exception as e:
        print(f"RF Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/registry/status")
async def get_registry_status():
    try:
        client = MlflowClient()
        prod_versions = client.get_latest_versions("mon_modele_production", stages=["Production"])
        if not prod_versions:
            return {"status": "error", "message": "No model in Production"}
            
        prod_version = prod_versions[0]
        run = client.get_run(prod_version.run_id)
        
        return {
            "status": "success",
            "version": prod_version.version,
            "run_id": prod_version.run_id,
            "description": prod_version.description,
            "metrics": run.data.metrics,
            "params": run.data.params
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/registry/promote-best")
async def promote_best_model():
    try:
        client = MlflowClient()
        experiment = client.get_experiment_by_name('Bank_Marketing')
        if not experiment:
            return {"status": "error", "message": "No experiment found"}
        
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=['metrics.accuracy DESC'],
            max_results=1
        )
        if not runs:
            return {"status": "error", "message": "No runs found"}
            
        best_run = runs[0]
        run_id = best_run.info.run_id
        
        model_uri = f"runs:/{run_id}/model"
        registered = mlflow.register_model(model_uri=model_uri, name="mon_modele_production")
        
        client.transition_model_version_stage(
            name="mon_modele_production",
            version=registered.version,
            stage="Production",
            archive_existing_versions=True
        )
        return {"status": "success", "message": f"Run {run_id} promoted to Production", "version": registered.version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drift/simulate")
async def simulate_drift_endpoint():
    try:
        import importlib.util, os
        script_path = os.path.join(
            os.path.dirname(__file__),   # app/api
            "..", "..",                   # -> Back/
            "scripts", "simulate_drift.py"
        )
        script_path = os.path.abspath(script_path)
        spec = importlib.util.spec_from_file_location("simulate_drift", script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        result = module.simulate_and_detect_drift()
        return {"status": "success", "message": "Drift simulation completed", "details": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
