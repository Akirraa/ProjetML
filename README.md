# Bank Marketing ML Platform

A machine learning platform for orchestrating, modeling, and analyzing bank deposit subscriptions.

## Global Architecture
The project is divided into three integrated components:
1. **Frontend**: A React/Vite application providing an analytical dashboard for metrics tracking, dataset exploration, and real-time customer classification.
2. **Backend API**: A REST API service built with Python and FastAPI, handling asynchronous model training (Random Forest, SVM, Logistic Regression, KNN), data preprocessing, SMOTE balancing, and inference.
3. **MLOps**: MLflow infrastructure integrated for hyperparameter versioning, feature importance calculation, and local storage of training artifacts.

## Core Features
- **Real-Time Classification Engine**: Unit prediction evaluating potential customer subscriptions utilizing the latest trained model stored in the MLflow registry.
- **Universal Feature Importance Extraction**: Implementation of permutation importance ensuring prediction explainability, even for mathematically opaque models (e.g., KNN, non-linear SVM).
- **Centralized Orchestration**: The `run.bat` script enables the simultaneous launch of the React server, Uvicorn API backend, and MLflow tracking interface in a single command.

## Execution Instructions
On Windows, execute the `run.bat` script located at the project root to start all services synchronously.
