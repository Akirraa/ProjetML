# ML Platform Backend API

An asynchronous programming interface built with FastAPI, dedicated to data preprocessing, machine learning pipeline execution, and real-time inference.

## Core Features
- **Automated Data Preparation**: Implementation of transformation pipelines (StandardScaler, One-Hot Encoding) combined with SMOTE (Imbalanced-Learn) to correct class imbalances.
- **MLOps Tracking with MLflow**: Traceability of hyperparameters, performance metrics (Accuracy, F1, AUC), and serialization of Scikit-Learn models within the local `mlflow_runs` directory.
- **Asynchronous Training**: Delegation of complex learning routines (Random Forest, Logistic Regression, SVM, KNN) via background threads, preventing blocking of active REST requests.
- **Explainability Analysis**: Utilization of native feature importance properties or dynamic adaptation via permutation algorithms to identify and extract decisive classification factors.

## Technical Environment
- **API**: FastAPI, Uvicorn
- **Data & Processing**: Python 3.x, Scikit-Learn, Pandas, Imbalanced-Learn
- **MLOps**: MLflow

## Isolated Execution
To start the API independently of the global orchestrator:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

To initialize the MLflow tracking interface:
```bash
mlflow ui --backend-store-uri file:///$(pwd)/mlflow_runs --host 127.0.0.1 --port 5000
```
