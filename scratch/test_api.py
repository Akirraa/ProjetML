import requests
import json

try:
    # Test with custom params
    response = requests.get('http://localhost:8000/api/rf-analysis?n_estimators=50&max_depth=5')
    data = response.json()
    print(f"Config used: {data['config']}")
    print(f"RF Accuracy: {data['decision_tree_comparison']['rf_accuracy']}")
except Exception as e:
    print(f"Error: {e}")
