.PHONY: setup train register serve test pipeline

setup:
	pip install -r Back/requirements.txt
	start cmd /k "cd Back && mlflow ui --backend-store-uri mlflow_runs --host 127.0.0.1 --port 5000"

train:
	python Back/scripts/train_multiple_configs.py

register:
	python Back/scripts/register_best_model.py

serve:
	start cmd /k "cd Back && mlflow models serve -m models:/mon_modele_production/Production --port 1234 --no-conda"

test:
	python Back/scripts/test_api.py

pipeline: train register serve test
	@echo "=========================================="
	@echo "Pipeline complet execute avec succes!"
	@echo "=========================================="
