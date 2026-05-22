.PHONY: setup train register serve test pipeline

# Configurable parameters for drift simulation
DRIFT_FEATURES ?= age,balance,duration
DRIFT_THRESHOLD ?= 0.30
DRIFT_WARNING ?= 0.15

setup:
	pip install -r requirements.txt
	start cmd /k "cd Back && mlflow ui --backend-store-uri mlflow_runs --host 127.0.0.1 --port 5000"

train:
	python src/train.py

register:
	python src/register_best_model.py

serve:
	start cmd /k "cd Back && set MLFLOW_TRACKING_URI=mlflow_runs && mlflow models serve -m models:/mon_modele_production/Production --port 1234 --no-conda"

# Start FastAPI backend (required for drift-triggered retraining)
api:
	start cmd /k "cd Back && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
drift:
	python Back/scripts/simulate_drift.py --features $(DRIFT_FEATURES) --threshold $(DRIFT_THRESHOLD) --warning $(DRIFT_WARNING)

pipeline: train api drift register serve test
	@echo "=========================================="
	@echo "Pipeline complet execute avec succes!"
	@echo "=========================================="
