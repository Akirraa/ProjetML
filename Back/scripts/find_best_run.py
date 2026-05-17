import mlflow
from mlflow.tracking import MlflowClient

def find_best_model():
    client = MlflowClient()
    
    # 1. Get the experiment ID
    experiment_name = "Bank_Marketing"
    experiment = client.get_experiment_by_name(experiment_name)
    
    if not experiment:
        print(f"L'expérience '{experiment_name}' n'a pas été trouvée.")
        return
        
    # 2. Search for the best run based on accuracy
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=['metrics.accuracy DESC'],
        max_results=5
    )
    
    if not runs:
        print("Aucun run terminé trouvé.")
        return
        
    # 3. Print the best run details
    best_run = runs[0]
    print("=" * 40)
    print(f"Meilleur run ID : {best_run.info.run_id}")
    print(f"Accuracy : {best_run.data.metrics.get('accuracy', 0):.4f}")
    print(f"F1-Score : {best_run.data.metrics.get('f1', 0):.4f}")
    
    # Print clean hyperparameters (filtering out internal ones like 'imp_')
    print("Paramètres utilisés :")
    for key, value in best_run.data.params.items():
        if not key.startswith('imp_') and not key.startswith('params.'):
            print(f" - {key}: {value}")
    print("=" * 40)

if __name__ == "__main__":
    mlflow.set_tracking_uri("file:../mlflow_runs") # Adjust path relative to script location
    find_best_model()
