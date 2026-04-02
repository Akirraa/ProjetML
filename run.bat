@echo off
echo Starting MLflow Server...
start cmd /k "cd Back && python -m mlflow ui --backend-store-uri mlflow_runs --host 127.0.0.1 --port 5000"

echo Starting Backend API...
start cmd /k "cd Back && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend...
start cmd /k "cd Front && npm run dev"

echo All services started! Close the command windows to stop them.
