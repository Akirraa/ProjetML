import pandas as pd
import numpy as np
import os
import io
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from imblearn.over_sampling import SMOTE

class DataService:
    def __init__(self):
        self.dataset_path = os.path.join("..", "Dataset", "bank-full.csv")
        self.df = None
        self.load_data()

    def load_data(self):
        try:
            self.df = pd.read_csv(self.dataset_path, sep=';')
            print(f"Loaded dataset with {len(self.df)} rows.")
        except Exception as e:
            print(f"Error loading data: {e}")

    def get_stats(self):
        if self.df is None:
            return {}
        
        # Basic stats for dashboard
        stats = {
            "total_audience": int(len(self.df)),
            "conversion_rate": float((self.df['y'] == 'yes').mean() * 100),
            "avg_balance": float(self.df['balance'].mean()),
            "job_distribution": self.df['job'].value_counts().to_dict(),
            "education_distribution": self.df['education'].value_counts().to_dict(),
            "target_distribution": self.df['y'].value_counts().to_dict(),
        }
        return stats

    def get_sample(self, n=50, page=1):
        if self.df is None:
            return {"rows": [], "total": 0, "page": page, "pages": 0}
        total = len(self.df)
        start = (page - 1) * n
        end = start + n
        rows = self.df.iloc[start:end].to_dict(orient='records')
        return {
            "rows": rows,
            "total": total,
            "page": page,
            "pages": max(1, (total + n - 1) // n)
        }

    def clean_dataset(self):
        if self.df is None:
            return {"error": "No dataset loaded"}
        before = len(self.df)
        self.df = self.df.drop_duplicates()
        self.df = self.df.dropna()
        after = len(self.df)
        return {
            "status": "cleaned",
            "rows_before": before,
            "rows_after": after,
            "removed": before - after
        }

    def load_from_bytes(self, content: bytes, sep: str = None):
        """Replace the active dataframe with an uploaded CSV."""
        try:
            text = content.decode('utf-8')
            # Auto-detect separator
            if sep is None:
                sep = ';' if text.count(';') > text.count(',') else ','
            new_df = pd.read_csv(io.StringIO(text), sep=sep)
            self.df = new_df
            print(f"Loaded uploaded CSV: {len(self.df)} rows, {len(self.df.columns)} columns")
            return {"status": "ok", "rows": len(self.df), "columns": list(self.df.columns)}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

    def get_preprocessing_pipeline(self):
        if self.df is None:
            return None
        
        cat_cols = self.df.select_dtypes(include='object').columns.tolist()
        num_cols = self.df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        
        if 'y' in cat_cols:
            cat_cols.remove('y')
        
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), cat_cols)
        ])
        
        return preprocessor

data_service = DataService()
