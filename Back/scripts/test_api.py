import requests
import json

def test_api():
    print("=== Test de l'API de prédiction (Partie 4.1) ===")
    
    # Custom FastAPI serving
    url = "http://127.0.0.1:8000/api/predict"
    
    payload = {
        "age": 30,
        "job": "management",
        "marital": "married",
        "education": "tertiary",
        "default": "no",
        "balance": 1500,
        "housing": "no",
        "loan": "no",
        "contact": "cellular",
        "day": 15,
        "month": "apr",
        "duration": 350,
        "campaign": 1,
        "pdays": -1,
        "previous": 0,
        "poutcome": "unknown"
    }
    
    try:
        print(f"Envoi d'une requête de prédiction à : {url}")
        r = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {r.status_code}")
        
        if r.status_code == 200:
            res = r.json()
            print("Réponse de l'API :")
            print(json.dumps(res, indent=2))
            assert "prediction" in res
            assert "confidence" in res
            print("\nTest réussi avec succès !")
        else:
            print(f"Erreur de l'API : {r.text}")
    except Exception as e:
        print(f"Impossible de contacter l'API : {e}")

if __name__ == "__main__":
    test_api()
