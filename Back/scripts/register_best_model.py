import os
import sys
import mlflow
from mlflow.tracking import MlflowClient

# Fix python path to allow importing from app
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

def register_best_model():
    print("=== Enregistrement du meilleur modèle (Partie 3.1) ===")
    
    # 1. Setup MLflow Tracking
    mlflow_dir = os.path.join(base_dir, "mlflow_runs")
    mlflow.set_tracking_uri(f"file:{mlflow_dir}")
    
    client = MlflowClient()
    experiment_name = "Bank_Marketing"
    experiment = client.get_experiment_by_name(experiment_name)
    
    if not experiment:
        print(f"L'expérience '{experiment_name}' n'a pas été trouvée.")
        return
        
    # 2. Search for the best run based on accuracy
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=['metrics.accuracy DESC'],
        max_results=1
    )
    
    if not runs:
        print("Aucun run terminé trouvé.")
        return
        
    best_run = runs[0]
    best_run_id = best_run.info.run_id
    best_acc = best_run.data.metrics.get('accuracy', 0)
    
    print(f"Meilleur run identifié : {best_run_id} avec une accuracy de {best_acc:.4f}")
    
    # 3. Register the best model
    model_uri = f"runs:/{best_run_id}/model"
    registered = mlflow.register_model(
        model_uri=model_uri,
        name='mon_modele_production'
    )
    print(f"Version enregistrée : {registered.version}")
    
    # 4. Add description and tags
    client.update_registered_model(
        name='mon_modele_production',
        description='Modèle de classification — version optimisée'
    )
    client.set_model_version_tag(
        name='mon_modele_production',
        version=registered.version,
        key='validated_by',
        value='equipe_data'
    )
    print("Description et tags ajoutés au registre.")
    
    # 5. Transition lifecycle (Staging first, then Production if acc >= 0.85)
    client.transition_model_version_stage(
        name='mon_modele_production',
        version=registered.version,
        stage='Staging',
        archive_existing_versions=False
    )
    print(f"Modèle v{registered.version} promu en Staging.")
    
    SEUIL_PRODUCTION = 0.85
    if best_acc >= SEUIL_PRODUCTION:
        client.transition_model_version_stage(
            name='mon_modele_production',
            version=registered.version,
            stage='Production',
            archive_existing_versions=True
        )
        print(f"Modèle v{registered.version} promu en Production (accuracy {best_acc:.4f} >= {SEUIL_PRODUCTION:.2f}).")
    else:
        print(f"Modèle non promu en Production : accuracy {best_acc:.4f} < seuil {SEUIL_PRODUCTION:.2f}")

if __name__ == "__main__":
    register_best_model()
