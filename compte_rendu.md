# Compte Rendu : Projet MLOps - Bank Marketing

Ce document contient les réponses aux questions de réflexion demandées dans le cadre du projet MLOps.

## Partie 1 — Tracking des Expérimentations
**Q1. Quelle est la différence entre `mlflow.log_param()` et `mlflow.log_metric()` ?**  
- `log_param()` est utilisé pour enregistrer les hyperparamètres du modèle (les configurations d'entrée qui ne changent pas pendant l'entraînement, ex: `learning_rate`, `max_depth`).  
- `log_metric()` est utilisé pour enregistrer les métriques d'évaluation (les résultats de performance, ex: `accuracy`, `f1_score`), qui peuvent changer au fil du temps si on les logge à chaque époque.

**Q2. Pourquoi est-il important de nommer ses runs (`run_name`) ?**  
Pour pouvoir facilement identifier, rechercher et comparer différentes expérimentations dans l'interface MLflow (UI) sans devoir se fier à des identifiants UUID générés aléatoirement.

**Q3. Que se passe-t-il si vous exécutez deux fois le même script sans changer le `run_name` ?**  
MLflow créera deux runs distincts avec deux UUID différents, mais ils partageront le même nom lisible (`run_name`) dans l'interface, ce qui peut prêter à confusion sans les timestamps.

## Partie 2 — Comparaison d'Expérimentations
**Q4. Quel modèle obtient le meilleur compromis accuracy / f1_score ? Justifiez.**  
En général sur ce dataset bancaire (fortement déséquilibré), les modèles ensemblistes comme le **Random Forest** ou **XGBoost** (avec SMOTE) obtiennent le meilleur compromis. Ils gèrent très bien les relations non-linéaires et maintiennent un F1-Score élevé (en évitant de prédire uniquement la classe majoritaire) contrairement à la régression logistique.

**Q5. Le graphique Parallel Coordinates révèle-t-il une corrélation entre `max_depth` et `accuracy` ?**  
Oui, on observe généralement que l'accuracy augmente proportionnellement avec `max_depth` jusqu'à un certain seuil, après quoi le modèle commence à surapprendre (overfitting) et l'accuracy sur le test set stagne ou diminue.

**Q6. Comment MLflow permet-il la reproductibilité par rapport à un simple `print()` des métriques ?**  
Un `print()` est éphémère. MLflow sauvegarde de manière persistante les métriques, les paramètres, mais surtout l'environnement exact (`requirements.txt`, version de scikit-learn) et l'artefact physique du modèle. Cela garantit qu'on peut recharger exactement le même modèle des mois plus tard.

## Partie 3 — Model Registry
**Q7. Pourquoi séparer les étapes Staging et Production dans un registre de modèles ?**  
Pour limiter les risques en production. "Staging" permet de tester le modèle (tests A/B, requêtes fantômes) dans un environnement iso-production. S'il est validé sans casser l'API, il est promu en "Production" pour les vrais utilisateurs.

**Q8. Que se passe-t-il si l'on archive une version en Production ? Quel impact opérationnel ?**  
Archiver un modèle lui retire son tag "Production". Si une API (comme `endpoints.py`) pointe spécifiquement vers l'URI `models:/.../Production`, elle va planter ou renvoyer des erreurs car aucun modèle actif ne sera trouvé, coupant ainsi le service de prédiction.

**Q9. Comment le Registry facilite-t-il le rollback vers une version précédente ?**  
Il garde l'historique complet des versions. Si la version 3 en Production fait chuter les conversions, il suffit d'un clic (ou d'une commande API `transition_model_version_stage`) pour remettre la version 2 en "Production" instantanément sans avoir à ré-entraîner le modèle.

## Partie 4 — Serving et API REST
**Q10. Quel est l'avantage d'un serving MLflow natif vs FastAPI personnalisé ?**  
- **MLflow natif** : Prêt à l'emploi (zéro code), déploie le modèle en une ligne de commande.
- **FastAPI** : Offre une flexibilité totale. Il permet d'ajouter des règles métier, de fusionner le prétraitement complexe (ex: SMOTE, Scalers), et de gérer la sécurité et les routes personnalisées.

**Q11. Comment géreriez-vous le rechargement automatique d'un nouveau modèle en Production ?**  
En intégrant un mécanisme de polling (le backend FastAPI interroge le Registry MLflow toutes les X minutes) ou via un Webhook MLflow qui notifie le serveur FastAPI de recharger le modèle en RAM dès qu'un nouveau modèle reçoit le tag "Production".

**Q12. Quels headers HTTP ajouteriez-vous pour sécuriser l'endpoint en production réelle ?**  
`Authorization` (ex: Bearer Token/JWT) pour s'assurer que seuls les clients légitimes l'appellent, ainsi que des headers `CORS` pour restreindre les domaines autorisés, et du rate-limiting.

## Partie 6 — Détection du Data Drift
**Q13. Quelle est la différence entre data drift et concept drift ? Donnez un exemple concret avec vos propres données.**  
- **Data Drift** : La distribution des données d'entrée change (ex: suite à l'inflation, le `balance` moyen de tous les clients bancaires augmente).
- **Concept Drift** : La relation entre l'entrée et la cible change (ex: les clients avec un fort `balance` arrêtaient de souscrire aux dépôts, mais une crise économique change ce comportement et ils commencent à souscrire).

**Q14. Le KS-test et Evidently identifient-ils les mêmes features comme driftées ? Pourquoi ?**  
Globalement oui, car Evidently utilise le test de Kolmogorov-Smirnov (KS) en interne pour les variables numériques continues par défaut. Cependant, Evidently est plus robuste car il utilise d'autres tests (Wasserstein, Chi-2) pour les variables catégorielles là où le KS-test brut échoue.

**Q15. Quel seuil de drift choisiriez-vous pour votre projet ? Justifiez selon le domaine métier.**  
Un seuil de 30% de `drift_share` est pertinent. Dans la banque, le comportement client évolue relativement lentement. Si 30% des features ont drifté significativement, cela veut dire que la population a fondamentalement changé et que le modèle de marketing direct prend des décisions obsolètes.

**Q16. Sans pipeline MLOps automatisé, comment détecteriez-vous ce drift en pratique ? Quels sont les risques pour une application en production ?**  
Il faudrait extraire les données manuellement de la base de données de production chaque mois pour les comparer. 
**Risque** : Une "dégradation silencieuse". Le modèle continue de prédire, mais se trompe de plus en plus, causant des pertes financières sévères ou le ciblage des mauvais clients avant même que quelqu'un ne s'en rende compte.
