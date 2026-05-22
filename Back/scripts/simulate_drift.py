import pandas as pd
import numpy as np
import mlflow
import requests
import os
import json
import datetime
from sklearn.model_selection import train_test_split
from scipy import stats

def _to_native(val):
    """Convert numpy scalar/bool to native Python type for JSON serialization."""
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, (np.bool_,)):
        return bool(val)
    return val

def simulate_and_detect_drift(features_to_drift=None, drift_threshold=0.30, warning_threshold=0.15):
    print("=== Démarrage de la détection de Drift ===")
    
    if features_to_drift is None:
        features_to_drift = ['age', 'balance', 'duration']

    # Setup MLflow with absolute path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    mlflow_dir = os.path.join(base_dir, "Back", "mlflow_runs")
    tracking_uri = f"file:{mlflow_dir}"
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment("monitoring_drift")

    # End any stale active run (can happen when called from within FastAPI)
    mlflow.end_run()

    # 1. Load Data with absolute path
    data_path = os.path.join(base_dir, "Dataset", "bank-full.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset non trouvé au chemin: {data_path}")

    df = pd.read_csv(data_path, sep=';')
    X = df.drop('y', axis=1)
    y = df['y']

    X_train, X_test, _, _ = train_test_split(X, y, test_size=0.2, random_state=42)

    # 2. Simulate Drift on Production (Test) Data
    X_prod = X_test.copy()
    num_cols = X_prod.select_dtypes(include=np.number).columns.tolist()

    print(f"Features sélectionnées pour le drift : {features_to_drift}")
    for col in features_to_drift:
        if col in num_cols:
            if col == 'age':
                print("Simulating normal drift on 'age' (mean shift)...")
                X_prod['age'] = X_prod['age'] + np.random.normal(1.0, 0.5, len(X_prod))
            elif col == 'balance':
                print("Simulating scale/shift drift on 'balance'...")
                X_prod['balance'] = X_prod['balance'] * 0.95 + 100
            elif col == 'duration':
                print("Simulating multiplier drift on 'duration'...")
                X_prod['duration'] = X_prod['duration'] * 1.1 + 10
            else:
                print(f"Simulating generic drift on '{col}'...")
                X_prod[col] = X_prod[col] * 1.1 + np.random.normal(0, 0.1, len(X_prod))

    with mlflow.start_run(run_name='drift_check_v1') as run:

        # 3. KS-Test per numeric column (main drift engine)
        print("Calcul des tests KS...")
        ks_results = []
        n_drifted = 0
        for col in num_cols:
            stat, pvalue = stats.ks_2samp(X_train[col], X_prod[col])
            drifted = pvalue < 0.05
            if drifted:
                n_drifted += 1
            
            ref_mean = float(X_train[col].mean())
            prod_mean = float(X_prod[col].mean())
            
            ks_results.append({
                'feature': col,
                'ks_stat': round(stat, 4),
                'p_value': float(pvalue),
                'drifted': drifted,
                'ref_mean': round(ref_mean, 2),
                'prod_mean': round(prod_mean, 2)
            })
            mlflow.log_metric(f'ks_pvalue_{col}', pvalue)

        n_total = len(num_cols)
        drift_share = n_drifted / n_total if n_total > 0 else 0
        dataset_drift = drift_share > drift_threshold

        mlflow.log_metric('drift_share', drift_share)
        mlflow.log_metric('drifted_columns', n_drifted)
        mlflow.log_metric('dataset_drifted', int(dataset_drift))
        print(f"Drift share : {drift_share:.2%} | Colonnes driftées : {n_drifted}/{n_total} (Seuil critique: {drift_threshold:.0%})")

        # 3.5. Save KS-test results to CSV and log as artifact
        try:
            df_drift = pd.DataFrame(ks_results)
            csv_path = "ks_drift_results.csv"
            df_drift.to_csv(csv_path, index=False)
            mlflow.log_artifact(csv_path)
            if os.path.exists(csv_path):
                os.remove(csv_path)
            print("CSV des tests KS généré et loggé dans MLflow.")
        except Exception as e:
            print(f"Failed to log KS CSV: {e}")

        # 4. Evidently HTML report (using evidently.legacy namespace in 0.7.x)
        try:
            from evidently.legacy.report import Report
            from evidently.legacy.metric_preset import DataDriftPreset
            report = Report(metrics=[DataDriftPreset()])
            # Run on all columns
            report.run(reference_data=X_train, current_data=X_prod)
            html_path = "drift_report.html"
            report.save_html(html_path)
            mlflow.log_artifact(html_path)
            if os.path.exists(html_path):
                os.remove(html_path)
            print("Rapport Evidently généré et loggé dans MLflow.")
        except Exception as e:
            print(f"Evidently HTML report failed: {e}")

        # 5. Automatic Retraining Trigger
        retrain_status = "none"
        if drift_share > drift_threshold:
            print(f"CRITIQUE : drift {drift_share:.2%} > seuil {drift_threshold:.0%}. Déclenchement du ré-entraînement...")
            mlflow.log_metric('retrain_triggered', 1)
            # Attempt to trigger retraining via API with retry
            import time, requests
            def _post_with_retry(url, json_body, retries=5, backoff=3):
                for attempt in range(1, retries + 1):
                    try:
                        response = requests.post(url, json=json_body, timeout=10)
                        return response
                    except Exception as e:
                        if attempt == retries:
                            raise
                        wait = backoff ** (attempt - 1)  # exponential backoff (3^0, 3^1, ...)
                        print(f"Retry {attempt}/{retries} after {wait}s due to {e}")
                        time.sleep(wait)
            try:
                response = _post_with_retry(
                    "http://127.0.0.1:8000/api/train",
                    json_body={
                        "model_type": "XGBoost",
                        "params": {"n_estimators": 150, "learning_rate": 0.1, "max_depth": 4, "reg_alpha": 1.0, "reg_lambda": 1.0},
                        "experiment_name": "Bank_Marketing"
                    }
                )
                if response.status_code == 200:
                    print(f"Re-entrainement lance avec succes. Run ID: {response.json().get('run_id')}")
                    retrain_status = "triggered"
                    # Log response JSON for audit
                    try:
                        log_path = os.path.join(os.path.dirname(__file__), "retraining_log.json")
                        entry = {
                            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                            "run_id": response.json().get('run_id'),
                            "payload": {
                                "model_type": "XGBoost",
                                "params": {"n_estimators": 150, "learning_rate": 0.1, "max_depth": 4, "reg_alpha": 1.0, "reg_lambda": 1.0}
                            },
                            "response": response.json()
                        }
                        # Append to JSON array (create if not exists)
                        if os.path.exists(log_path):
                            with open(log_path, 'r+', encoding='utf-8') as f:
                                try:
                                    data = json.load(f)
                                except json.JSONDecodeError:
                                    data = []
                                data.append(entry)
                                f.seek(0)
                                json.dump(data, f, indent=2)
                                f.truncate()
                        else:
                            with open(log_path, 'w', encoding='utf-8') as f:
                                json.dump([entry], f, indent=2)
                    except Exception as log_err:
                        print(f"Failed to write retraining log: {log_err}")
                else:
                    print(f"Erreur API: {response.status_code}")
                    retrain_status = "error"
            except Exception as e:
                print(f"Impossible de contacter l'API: {e}")
                retrain_status = "api_error"
        elif drift_share > warning_threshold:
            print(f"AVERTISSEMENT : drift {drift_share:.2%} > seuil d'alerte {warning_threshold:.0%}. Pas de ré-entraînement.")
            mlflow.log_metric('retrain_triggered', 0)
        else:
            print(f"OK : drift {drift_share:.2%} — modèle stable")
            mlflow.log_metric('retrain_triggered', 0)

        # Convert all ks_results values to native Python types
        ks_results_clean = [
            {
                'feature': row['feature'],
                'ks_stat': _to_native(row['ks_stat']),
                'p_value': _to_native(row['p_value']),
                'drifted': _to_native(row['drifted']),
                'ref_mean': _to_native(row['ref_mean']),
                'prod_mean': _to_native(row['prod_mean'])
            }
            for row in ks_results
        ]

        # Display more details in terminal
        print("\n=== Détails des tests de Kolmogorov-Smirnov ===")
        print(f"{'Feature':<15} | {'KS Stat':<8} | {'P-Value':<8} | {'Drifted':<8} | {'Ref Mean':<10} | {'Prod Mean':<10}")
        print("-" * 75)
        for row in ks_results_clean:
            drift_str = "YES" if row['drifted'] else "NO"
            print(f"{row['feature']:<15} | {row['ks_stat']:<8.4f} | {row['p_value']:<8.4f} | {drift_str:<8} | {row['ref_mean']:<10.2f} | {row['prod_mean']:<10.2f}")
        print("================================================\n")

        return {
            "drift_share": _to_native(drift_share),
            "dataset_drift": _to_native(dataset_drift),
            "drifted_columns": _to_native(n_drifted),
            "total_columns": _to_native(n_total),
            "ks_results": ks_results_clean,
            "retrain_status": retrain_status
        }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simuler et détecter le Data Drift.")
    parser.add_argument("--features", type=str, default="age,balance,duration", help="Features à drifter séparées par des virgules")
    parser.add_argument("--threshold", type=float, default=0.30, help="Seuil de drift pour ré-entraînement (ex: 0.30)")
    parser.add_argument("--warning", type=float, default=0.15, help="Seuil d'alerte sans ré-entraînement (ex: 0.15)")
    args = parser.parse_args()
    
    selected_features = [f.strip() for f in args.features.split(",") if f.strip()]
    simulate_and_detect_drift(features_to_drift=selected_features, drift_threshold=args.threshold, warning_threshold=args.warning)
