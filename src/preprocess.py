import os
import sys
import pandas as pd

# Fix python path to allow importing from Back
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, "Back"))

try:
    from app.services.data_service import data_service
    
    def get_preprocessing_pipeline():
        return data_service.get_preprocessing_pipeline()
        
    if __name__ == "__main__":
        print("Preprocess wrapper: Loaded preprocessing pipeline from FastAPI app services.")
        df = data_service.df
        if df is not None:
            pipeline = get_preprocessing_pipeline()
            X = df.drop('y', axis=1)
            X_processed = pipeline.fit_transform(X)
            print(f"Preprocessed shape: {X_processed.shape}")
        else:
            print("No dataset loaded.")
except Exception as e:
    print(f"Preprocess wrapper error: {e}")
