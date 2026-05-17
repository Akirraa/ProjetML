import pandas as pd
import numpy as np
import mlflow
import requests
import os
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

def simulate_and_detect_drift():
    print("=== Démarrage de la détection de Drift ===")

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

    print("Simulation du drift sur l'âge et le solde (balance)...")
    if 'age' in num_cols:
        X_prod['age'] = X_prod['age'] + np.random.normal(15, 5, len(X_prod))
    if 'balance' in num_cols:
        X_prod['balance'] = X_prod['balance'] * 0.5 - 1000

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
            ks_results.append({
                'feature': col,
                'ks_stat': round(stat, 4),
                'p_value': round(pvalue, 4),
                'drifted': drifted
            })
            mlflow.log_metric(f'ks_pvalue_{col}', pvalue)

        n_total = len(num_cols)
        drift_share = n_drifted / n_total if n_total > 0 else 0
        dataset_drift = drift_share > 0.30

        mlflow.log_metric('drift_share', drift_share)
        mlflow.log_metric('drifted_columns', n_drifted)
        mlflow.log_metric('dataset_drifted', int(dataset_drift))
        print(f"Drift share : {drift_share:.2%} | Colonnes driftées : {n_drifted}/{n_total}")

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
        SEUIL_DRIFT = 0.30
        retrain_status = "none"
        if drift_share > SEUIL_DRIFT:
            print(f"CRITIQUE : drift {drift_share:.2%} > seuil {SEUIL_DRIFT:.0%}. Déclenchement du ré-entraînement...")
            mlflow.log_metric('retrain_triggered', 1)
            try:
                response = requests.post("http://127.0.0.1:8000/api/train", json={
                    "model_type": "Random Forest",
                    "params": {"n_estimators": 100},
                    "experiment_name": "Bank_Marketing"
                }, timeout=10)
                if response.status_code == 200:
                    print(f"Ré-entraînement lancé avec succès. Run ID: {response.json().get('run_id')}")
                    retrain_status = "triggered"
                else:
                    print(f"Erreur API: {response.status_code}")
                    retrain_status = "error"
            except Exception as e:
                print(f"Impossible de contacter l'API: {e}")
                retrain_status = "api_error"
        else:
            print(f"OK : drift {drift_share:.2%} — modèle stable")
            mlflow.log_metric('retrain_triggered', 0)

        # Convert all ks_results values to native Python types
        ks_results_clean = [
            {
                'feature': row['feature'],
                'ks_stat': _to_native(row['ks_stat']),
                'p_value': _to_native(row['p_value']),
                'drifted': _to_native(row['drifted'])
            }
            for row in ks_results
        ]

        return {
            "drift_share": _to_native(drift_share),
            "dataset_drift": _to_native(dataset_drift),
            "drifted_columns": _to_native(n_drifted),
            "total_columns": _to_native(n_total),
            "ks_results": ks_results_clean,
            "retrain_status": retrain_status
        }

if __name__ == "__main__":
    simulate_and_detect_drift()
