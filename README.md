# Industrialized Bank Marketing MLOps Platform

## Project Goal
The goal of this project is to industrialize an end-to-end machine learning workflow for bank deposit subscription forecasting. The platform moves beyond simple modeling to establish a complete MLOps infrastructure featuring automated experiment tracking, model governance, continuous integration validations, statistical drift monitoring, and an explainable prediction dashboard.

---

## Technical Stack
- Backend Framework: Python, FastAPI
- Frontend Interface: React, TailwindCSS, Lucide Icons, Framer Motion
- Core Machine Learning: Scikit-Learn, Pandas, NumPy, Imbalanced-Learn (SMOTE)
- MLOps Infrastructure: MLflow (Tracking, Model Registry, Model Serving)
- Monitoring and Analytics: SciPy Stats (Kolmogorov-Smirnov), Evidently (Legacy Metrics and HTML Reporting)
- Automation: GNU Make (Makefile), Git Pre-commit Hooks

---

## Project Structure and Parts

### 1. Experiment Tracking
All model training iterations are tracked using MLflow:
- Parameters logged: Hyperparameters such as `n_estimators`, `max_depth`, and core algorithms.
- Metrics logged: Performance statistics including Accuracy, F1-Score, Precision, Recall, and Area Under the ROC Curve (AUC).
- Artifacts logged: A saved classification report in TXT format and a confusion matrix in PNG format are written directly to the active run folder for audit trail purposes.

### 2. Multi-Model Comparison
Sequential loop training executes automatically to seed the MLflow tracking UI:
- Baseline Configuration: Random Forest Classifier (n_estimators=50, max_depth=3).
- Deep Configuration: Random Forest Classifier (n_estimators=200, max_depth=10).
- Alternative Configuration: Logistic Regression (C=1.0, max_iter=1000).
- Programmatic Selection: Python scripts leverage the MlflowClient API to search, filter, and extract the best run directly without visiting the graphical interface.

### 3. Model Registry and Lifecycle Governance
A promotion pipeline manages registered models:
- Model Registration: The best-performing model is registered in the Model Registry under the name `mon_modele_production`.
- Staging Transition: Models are initially promoted to the Staging environment where metadata and tags are appended.
- Production Validation: An accuracy gate check evaluates models; if the Accuracy exceeds 85%, the version is promoted to Production, and existing production models are archived to prevent serving conflicts.

### 4. Custom REST Serving and Explainable Inference
The inference subsystem is fully unified:
- Registry Loading: The FastAPI `/api/predict` route dynamically queries the Model Registry, pulls the active Production model, and instantiates it in memory.
- Preprocessing Pipeline: Raw JSON inputs are fed through an identical preprocessing transformer to maintain feature integrity.
- Explanations (XAI): Inference returns prediction decisions, confidence probabilities, and the positive or negative contribution weight of the top 3 features.

### 5. Local Automation and CI/CD
Local developer operations are automated:
- Makefile Orchestrator: Combines environment preparation, background training, model registration, API serving, and testing under unified make commands.
- Pre-Commit Gate: A Git pre-commit hook automatically executes during commit attempts. It queries the active experiment history and blocks commits if the latest model's accuracy falls below the 80% threshold.

### 6. Statistical Data Drift Monitoring
To combat silent model degradation, a monitoring framework simulates and detects covariate shifts:
- Drift Simulation: Artificially alters numerical features to simulate real-world changes.
- Stat Tests (KS-Test): The Kolmogorov-Smirnov test evaluates continuous features feature-by-feature. A dataframe containing p-values is exported to `ks_drift_results.csv` and logged to MLflow.
- Evidently Reports: Interactive HTML reports summarizing overall data quality and drift distributions are dynamically saved and tracked in MLflow.
- Retraining Loop: If the percentage of drifted columns exceeds 30%, the system fires a request to retrain and promote a fresh model version.

---

## Page Components

### 1. Dashboard
Displays overall audience numbers, conversion rates, and distributions of occupations, education levels, and targets.

### 2. Dataset Explorer
Supports uploading and cleaning datasets, removing duplicates, managing missing values, and browsing data samples with server-side pagination.

### 3. Model Training
Features parameterized hyperparameter inputs to configure and trigger backend training runs asynchronously.

### 4. Model Comparison
Compares metrics and parameter differences across multiple historical runs side-by-side.

### 5. Experiment History
Lists all active MLflow runs and provides links to view details and metrics.

### 6. MLOps Panel
Manages data drift simulation, reviews Evidently reports, views active registry metadata, and triggers manual model promotion.

### 7. Predict Customer (XAI)
Allows profiling a customer to obtain a real-time subscription classification. The UI dynamically presents active registry metrics, details feature weights through visual bars, and outputs written decision reasoning.

---

## Getting Started

### Prerequisites
Ensure Python 3.9+ and Node.js are installed on your system.

### Automated Setup and Launch
Run the batch controller script from the root directory to automatically launch the FastAPI server, the React dev server, and the MLflow dashboard:
```bash
run.bat
```

### Manual Makefile Commands
Utilize GNU Make to control components directly:
- Set up dependencies: `make setup`
- Train configurations: `make train`
- Register best run: `make register`
- Serve model: `make serve`
- Run API tests: `make test`
