# MLOps Project Task List

This file outlines what is currently missing from your ML Platform based on the "Projet du module Machine Learning Avancée Parties MLOPS" requirements document. None of these tasks have been implemented yet.

- [x] **Partie 1 : Tracking des Expérimentations (Artifacts)**
  - [x] Generate and log a visual Confusion Matrix (`confusion_matrix.png`) to MLflow during `train_model_task`.
  - [x] Generate and log the Classification Report (`classification_report.txt`) to MLflow during `train_model_task`.

- [x] **Partie 2 : Requêtes programmatiques**
  - [x] Create a dedicated script (or function) that uses `MlflowClient` to programmatically search and identify the best run based on `metrics.accuracy DESC` without using the UI.

- [x] **Partie 3 : Model Registry**
  - [x] Implement logic to register the best performing run into the MLflow Model Registry (`mon_modele_production`).
  - [x] Add descriptions and tags (`validated_by='equipe_data'`) to the registered model using `MlflowClient`.
  - [x] Implement stage transition logic: Promote the model to `Staging`.
  - [x] Implement conditional promotion to `Production` stage (only if accuracy >= 0.85).

- [x] **Partie 4 : Serving depuis la Production**
  - [x] Update the FastAPI `/predict` endpoint to load the model directly from the Registry's Production stage (`models:/mon_modele_production/Production`) instead of dynamically loading the latest run.

- [x] **Partie 5 : Automatisation CI/CD Local**
  - [x] Create a `Makefile` at the project root with the targets: `setup`, `train`, `register`, `serve`, `test`, and `pipeline`.
  - [x] Create a Git pre-commit hook (`.git/hooks/pre-commit`) containing the python script to block commits if the best model accuracy falls below `0.80`.

- [x] **Partie 6 : Détection du Data Drift**
  - [x] Install the `evidently` library.
  - [x] Create `src/simulate_drift.py` to artificially drift the production dataset test split.
  - [x] Generate the Evidently HTML report (`drift_report.html`) and log it as an MLflow artifact.
  - [x] Extract numerical drift metrics (`drift_share`, `dataset_drift`) and log them to MLflow.
  - [x] Implement KS-test statistical feature analysis via `scipy.stats`, logging `ks_pvalue` metrics and saving `ks_drift_results.csv`.
  - [x] Implement the automatic retraining trigger: Automatically execute `train.py --retrain` via `subprocess` if the `drift_share` exceeds the 30% critical threshold.

- [x] **Questions de Réflexion (Compte Rendu)**
  - [x] Draft a final document answering questions Q1 through Q16 from the assignment guidelines to secure the final "Réflexion & analyse" grading points.
