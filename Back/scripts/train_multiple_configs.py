import os
import sys
import mlflow
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from imblearn.over_sampling import SMOTE

# Fix python path to allow importing from app
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from app.services.data_service import data_service

def run_automated_experimentations():
    print("=== Démarrage de l'automatisation des runs (Partie 2.1) ===")
    
    # 1. Setup MLflow Tracking
    mlflow_dir = os.path.join(base_dir, "mlflow_runs")
    mlflow.set_tracking_uri(f"file:{mlflow_dir}")
    mlflow.set_experiment("Bank_Marketing")
    
    # 2. Get preprocessed data
    df = data_service.df
    if df is None:
        print("Erreur: Le dataset n'a pas pu être chargé par le data_service.")
        return
        
    X = df.drop('y', axis=1)
    y = (df['y'] == 'yes').astype(int)
    
    preprocessor = data_service.get_preprocessing_pipeline()
    X_processed = preprocessor.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)
    
    # SMOTE to handle class imbalance
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
    
    # 3. Define the configurations (Baseline, deep model, alternative algorithm)
    configs = [
        {
            'name': 'rf_baseline_d3',
            'model_type': 'Random Forest Classifier',
            'params': {'n_estimators': 50, 'max_depth': 3, 'random_state': 42}
        },
        {
            'name': 'rf_deep_d10',
            'model_type': 'Random Forest Classifier',
            'params': {'n_estimators': 200, 'max_depth': 10, 'random_state': 42}
        },
        {
            'name': 'logistic_regression_alt',
            'model_type': 'Logistic Regression',
            'params': {'C': 1.0, 'max_iter': 1000, 'random_state': 42}
        }
    ]
    
    # 4. Run the configurations sequentially
    for cfg in configs:
        run_name = cfg['name']
        print(f"\nEntraînement du modèle : {run_name} ({cfg['model_type']})...")
        
        with mlflow.start_run(run_name=run_name) as run:
            # Log params
            mlflow.log_params(cfg['params'])
            mlflow.log_param("model_type", cfg['model_type'])
            
            # Select model
            if cfg['model_type'] == 'Random Forest Classifier':
                model = RandomForestClassifier(**cfg['params'])
            else:
                model = LogisticRegression(**cfg['params'])
                
            # Train
            model.fit(X_train_bal, y_train_bal)
            
            # Predict
            y_pred = model.predict(X_test)
            
            # Metrics
            metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "f1": f1_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred, zero_division=0),
                "recall": recall_score(y_test, y_pred, zero_division=0)
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Log model
            mlflow.sklearn.log_model(model, "model")
            
            print(f" -> Terminé avec succès. Accuracy : {metrics['accuracy']:.4f} | F1-Score : {metrics['f1']:.4f}")
            
    print("\n=== Toutes les expérimentations ont été loggées dans MLflow UI ! ===")

if __name__ == "__main__":
    run_automated_experimentations()
