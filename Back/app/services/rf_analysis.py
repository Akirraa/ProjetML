import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from .data_service import data_service

class RFAnalysisService:
    def run_full_analysis(self, base_n_estimators=100, base_max_depth=None):
        df = data_service.df
        if df is None:
            raise Exception("Dataset not loaded")

        # 1. Take a 20% sample to speed up execution for interactive dashboard
        # Ensuring we have enough data but not too much that it lags
        df_sample = df.sample(frac=0.2, random_state=42).reset_index(drop=True)
        
        X = df_sample.drop('y', axis=1)
        y = (df_sample['y'] == 'yes').astype(int)
        
        preprocessor = data_service.get_preprocessing_pipeline()
        # We need to fit a new preprocessor on the sample to ensure consistent feature counts
        X_processed = preprocessor.fit_transform(X)
        
        try:
            feature_names = preprocessor.get_feature_names_out()
        except:
            feature_names = [f"F{i}" for i in range(X_processed.shape[1])]
            
        indices = np.arange(len(y))
        idx_train, idx_test = train_test_split(indices, test_size=0.2, random_state=42)
        
        X_train = X_processed[idx_train]
        X_test = X_processed[idx_test]
        y_train = y.iloc[idx_train]
        y_test = y.iloc[idx_test]
        
        # 1. Feature Importance
        rf_base = RandomForestClassifier(n_estimators=base_n_estimators, max_depth=base_max_depth, random_state=42, n_jobs=-1)
        rf_base.fit(X_train, y_train)
        
        importances = rf_base.feature_importances_
        feature_importance_list = [
            {"feature": name, "importance": float(imp)} 
            for name, imp in zip(feature_names, importances)
        ]
        feature_importance_list = sorted(feature_importance_list, key=lambda x: x['importance'], reverse=True)
        top_3 = feature_importance_list[:3]
        
        # 2. Stabilité (Stability)
        stability_results = []
        random_states = [10, 42, 100, 777, 2024]
        for rs in random_states:
            rf_stab = RandomForestClassifier(random_state=rs, n_jobs=-1)
            rf_stab.fit(X_train, y_train)
            acc = accuracy_score(y_test, rf_stab.predict(X_test))
            stability_results.append({"random_state": rs, "accuracy": float(acc)})
            
        variance_stability = np.var([res["accuracy"] for res in stability_results])
            
        # 3. Analyse des erreurs (Detailed)
        y_pred = rf_base.predict(X_test)
        errors_mask = (y_test.values != y_pred)
        correct_mask = (y_test.values == y_pred)
        
        X_test_orig_df = X.iloc[idx_test]
        
        # Basic error list
        error_list = []
        err_idx = np.where(errors_mask)[0]
        for idx in err_idx[:5]:
            row_data = {}
            for k, v in X_test_orig_df.iloc[idx].to_dict().items():
                if isinstance(v, (np.int64, np.float64, np.int32)):
                    row_data[k] = v.item()
                else:
                    row_data[k] = v
            
            error_list.append({
                "features": row_data,
                "true_label": "yes" if y_test.iloc[idx] == 1 else "no",
                "predicted_label": "yes" if y_pred[idx] == 1 else "no"
            })
        
        # Error Patterns: Comparing mean of numeric features for Errors vs Correct
        num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        error_patterns = []
        for col in num_cols:
            if col in X_test_orig_df.columns:
                mean_err = float(X_test_orig_df[errors_mask][col].mean())
                mean_corr = float(X_test_orig_df[correct_mask][col].mean())
                error_patterns.append({
                    "feature": col,
                    "error_mean": mean_err,
                    "correct_mean": mean_corr,
                    "diff_percent": float((mean_err - mean_corr) / mean_corr * 100) if mean_corr != 0 else 0
                })

        # 4. Bias / Variance (Hyperparameter Grid - Extensive)
        bias_variance_results = []
        n_estimators_sweep = [5, 10, 20, 50, 100, 150]
        max_depth_sweep = [2, 3, 5, 8, 10, 15, 20, None]
        
        for n_est in n_estimators_sweep:
            for m_depth in max_depth_sweep:
                rf_grid = RandomForestClassifier(n_estimators=n_est, max_depth=m_depth, random_state=42, n_jobs=-1)
                rf_grid.fit(X_train, y_train)
                
                train_acc = accuracy_score(y_train, rf_grid.predict(X_train))
                test_acc = accuracy_score(y_test, rf_grid.predict(X_test))
                
                bias = 1 - train_acc
                variance = train_acc - test_acc
                
                bias_variance_results.append({
                    "n_estimators": n_est,
                    "max_depth": str(m_depth) if m_depth is not None else "None",
                    "train_accuracy": float(train_acc),
                    "test_accuracy": float(test_acc),
                    "bias": float(bias),
                    "variance": float(variance)
                })
                
        # 5. Comparaison avec Arbre de décision
        dt = DecisionTreeClassifier(max_depth=base_max_depth, random_state=42)
        dt.fit(X_train, y_train)
        dt_test_acc = accuracy_score(y_test, dt.predict(X_test))
        
        return {
            "config": {
                "n_estimators": base_n_estimators,
                "max_depth": str(base_max_depth) if base_max_depth is not None else "None"
            },
            "feature_importance": {
                "all": feature_importance_list[:10], # Send top 10 for chart
                "top_3": top_3
            },
            "stability": {
                "results": stability_results,
                "variance": float(variance_stability)
            },
            "errors": error_list,
            "error_patterns": error_patterns,
            "bias_variance": bias_variance_results,
            "decision_tree_comparison": {
                "rf_accuracy": float(accuracy_score(y_test, rf_base.predict(X_test))),
                "dt_accuracy": float(dt_test_acc)
            }
        }

rf_analysis_service = RFAnalysisService()
