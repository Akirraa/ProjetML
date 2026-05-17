import mlflow
import mlflow.sklearn
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
import xgboost as xgb
from imblearn.over_sampling import SMOTE
import threading
from .data_service import data_service

class MLService:
    def __init__(self):
        # Set up local MLflow tracking
        mlflow_dir = os.path.join(os.getcwd(), "mlflow_runs")
        if not os.path.exists(mlflow_dir):
            os.makedirs(mlflow_dir)
        mlflow.set_tracking_uri(f"file:///{mlflow_dir}")
        self.current_training_status = {}

    def get_supported_models(self):
        return [
            {
                "id": "rf",
                "name": "Random Forest Classifier",
                "type": "Ensemble",
                "params": ["n_estimators", "max_depth", "min_samples_split"],
                "description": "Decision-tree ensemble for high-accuracy customer behavior modeling."
            },
            {
                "id": "lr",
                "name": "Logistic Regression",
                "type": "Linear",
                "params": ["C", "max_iter", "penalty"],
                "description": "Interpretable linear model for binary deposit subscription probability."
            },
            {
                "id": "svc",
                "name": "Support Vector Machine",
                "type": "Kernel",
                "params": ["C", "kernel", "gamma"],
                "description": "Powerful kernel-based classifier for non-linear boundary detection."
            },
            {
                "id": "knn",
                "name": "K-Nearest Neighbors",
                "type": "Instance",
                "params": ["n_estimators", "weights"],
                "description": "Simple baseline for identifying similar customer clusters."
            },
            {
                "id": "ada",
                "name": "AdaBoost Classifier",
                "type": "Ensemble",
                "params": ["n_estimators", "learning_rate"],
                "description": "Boosting ensemble that adapts by tweaking weights of incorrect predictions."
            },
            {
                "id": "xgb",
                "name": "XGBoost Classifier",
                "type": "Boosting",
                "params": ["n_estimators", "learning_rate", "max_depth"],
                "description": "High-performance gradient boosting framework for tabular data."
            }
        ]

    def train_model_task(self, model_type, params, experiment_name, run_id):
        try:
            self.current_training_status[run_id] = {"status": "loading", "progress": 10}
            df = data_service.df
            if df is None:
                raise Exception("Dataset not loaded")

            self.current_training_status[run_id] = {"status": "preprocessing", "progress": 30}
            # Preprocessing
            X = df.drop('y', axis=1)
            y = (df['y'] == 'yes').astype(int)
            
            preprocessor = data_service.get_preprocessing_pipeline()
            X_processed = preprocessor.fit_transform(X)
            
            # Get feature names after OHE
            try:
                feature_names = preprocessor.get_feature_names_out()
            except:
                feature_names = [f"F{i}" for i in range(X_processed.shape[1])]

            X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)
            
            # SMOTE
            smote = SMOTE(random_state=42)
            X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

            self.current_training_status[run_id] = {"status": "training", "progress": 60}
            
            # Model Selection
            if "Random Forest" in model_type:
                model = RandomForestClassifier(**params)
            elif "AdaBoost" in model_type:
                model = AdaBoostClassifier(**params)
            elif "XGBoost" in model_type:
                model = xgb.XGBClassifier(**params)
            elif "Logistic Regression" in model_type:
                model = LogisticRegression(**params)
            elif "Support Vector Machine" in model_type:
                model = SVC(probability=True, **params)
            elif "K-Nearest Neighbors" in model_type:
                model = KNeighborsClassifier(**params)
            else:
                model = RandomForestClassifier()

            # Ensure the experiment is set before resuming the run (prevents experiment ID mismatch)
            mlflow.set_experiment(experiment_name)
            with mlflow.start_run(run_id=run_id) as run:
                mlflow.log_params(params)
                mlflow.log_param("model_type", model_type)
                
                model.fit(X_train_bal, y_train_bal)
                
                self.current_training_status[run_id] = {"status": "evaluating", "progress": 80}
                
                # Feature Importance logging
                importances = {}
                if hasattr(model, "feature_importances_"):
                    importances = dict(zip(feature_names, model.feature_importances_.tolist()))
                else:
                    from sklearn.inspection import permutation_importance
                    import scipy.sparse as sp
                    
                    X_sample = X_test[:500]
                    if sp.issparse(X_sample):
                        X_sample = X_sample.toarray()
                        
                    # Use a sample to speed up permutation importance
                    perm_result = permutation_importance(model, X_sample, y_test[:500], n_repeats=5, random_state=42)
                    importances = dict(zip(feature_names, perm_result.importances_mean.tolist()))
                
                # Log top 10 as params for easy retrieval
                top_10 = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10]
                for name, val in top_10:
                    mlflow.log_param(f"imp_{name}", val)

                # Evaluation
                y_pred = model.predict(X_test)
                y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
                
                metrics = {
                    "accuracy": accuracy_score(y_test, y_pred),
                    "f1": f1_score(y_test, y_pred),
                    "auc": roc_auc_score(y_test, y_prob) if y_prob is not None else 0,
                    "precision": precision_score(y_test, y_pred, zero_division=0),
                    "recall": recall_score(y_test, y_pred, zero_division=0)
                }
                
                mlflow.log_metrics(metrics)
                mlflow.sklearn.log_model(model, "model")
                
                # Partie 1: Log Advanced Artifacts
                import matplotlib.pyplot as plt
                import matplotlib
                matplotlib.use('Agg') # Headless mode
                from sklearn.metrics import ConfusionMatrixDisplay, classification_report
                import os
                
                # Confusion Matrix
                fig, ax = plt.subplots(figsize=(8, 6))
                ConfusionMatrixDisplay.from_predictions(y_test, y_pred, ax=ax)
                cm_path = f"confusion_matrix_{run_id}.png"
                plt.savefig(cm_path)
                mlflow.log_artifact(cm_path)
                plt.close(fig)
                
                # Classification Report
                report = classification_report(y_test, y_pred)
                cr_path = f"classification_report_{run_id}.txt"
                with open(cr_path, 'w') as f:
                    f.write(report)
                mlflow.log_artifact(cr_path)
                
                if os.path.exists(cm_path): os.remove(cm_path)
                if os.path.exists(cr_path): os.remove(cr_path)
                
                # Partie 3: Model Registry Management
                if metrics["accuracy"] >= 0.85:
                    try:
                        model_uri = f"runs:/{run_id}/model"
                        registered = mlflow.register_model(model_uri=model_uri, name="mon_modele_production")
                        
                        from mlflow.tracking import MlflowClient
                        client = MlflowClient()
                        
                        client.update_registered_model(
                            name="mon_modele_production",
                            description="Modèle de classification — version optimisée"
                        )
                        client.set_model_version_tag(
                            name="mon_modele_production",
                            version=registered.version,
                            key="validated_by",
                            value="equipe_data"
                        )
                        
                        # Transition lifecycle
                        client.transition_model_version_stage(
                            name="mon_modele_production",
                            version=registered.version,
                            stage="Staging",
                            archive_existing_versions=False
                        )
                        client.transition_model_version_stage(
                            name="mon_modele_production",
                            version=registered.version,
                            stage="Production",
                            archive_existing_versions=True
                        )
                        print(f"Model {registered.version} promoted to Production")
                    except Exception as e:
                        print(f"Error registering model: {e}")
                
                self.current_training_status[run_id] = {"status": "completed", "progress": 100, "metrics": metrics}

        except Exception as e:
            print(f"Training failed: {e}")
            self.current_training_status[run_id] = {"status": "failed", "error": str(e)}

    def get_experiment_id(self, name="Bank_Marketing"):
        exp = mlflow.get_experiment_by_name(name)
        if exp is None:
            return mlflow.create_experiment(name)
        return exp.experiment_id

    def get_history(self):
        """Return all runs from MLflow as clean JSON-serializable dicts."""
        try:
            runs = mlflow.search_runs(experiment_names=["Bank_Marketing"])
            if runs.empty:
                return []
            runs = runs.sort_values("start_time", ascending=False)
            results = []
            for _, row in runs.iterrows():
                start_ts = row.get("start_time")
                try:
                    start_str = pd.Timestamp(start_ts).isoformat() if pd.notna(start_ts) else None
                except Exception:
                    start_str = None

                entry = {
                    "run_id":       str(row.get("run_id", "")),
                    "status":       str(row.get("status", "")),
                    "start_time":   start_str,
                    "experiment_id": str(row.get("experiment_id", "")),
                }
                for col in runs.columns:
                    if col.startswith("metrics.") or col.startswith("params."):
                        val = row[col]
                        try:
                            entry[col] = None if (val is None or (isinstance(val, float) and np.isnan(val))) else val
                        except Exception:
                            entry[col] = None
                results.append(entry)
            return results
        except Exception as e:
            print(f"get_history error: {e}")
            return []

    def start_training(self, model_type, params, experiment_name="Bank_Marketing"):
        # Create the run under the correct experiment using MlflowClient
        exp_id = self.get_experiment_id(experiment_name)
        client = mlflow.tracking.MlflowClient()
        created_run = client.create_run(experiment_id=exp_id)
        run_id = created_run.info.run_id

        # Launch training in a background thread
        thread = threading.Thread(
            target=self.train_model_task,
            args=(model_type, params, experiment_name, run_id)
        )
        thread.daemon = True
        thread.start()

        return run_id

ml_service = MLService()
