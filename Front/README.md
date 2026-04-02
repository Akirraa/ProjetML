# PredictML Client Interface

PredictML is a React-based analytical dashboard specifically designed for customer classification and marketing campaign management.

## Models and Dashboards
- **Contextual Dashboard**: Tracking of key performance indicators and quantitative analysis of conversion volumes.
- **Data Explorer**: Granular visualization of customer demographics and target behavior analysis.
- **Model Orchestration**: Selection of learning algorithms (including Random Forest, SVM) and timely hyperparameter configuration.
- **Comparative Analysis**: Technical benchmarking of algorithm performances (e.g., confusion matrices, ROC).
- **Strategic Classification**: Downstream integration of predictive capabilities for individual profiles via the "Predict Customer" module, supplemented by technical identification of decisive factors (Dominant Factors).

## Network Layer and Backend Integration
Communications rely on asynchronous requests directed to a FastAPI backend. The `src/utils/api.js` module orchestrates HTTP requests, enabling real-time inference evaluation, remote machine learning execution, and querying of the local MLflow registry for reliability tracking.

## Technical Details
- **Core Framework**: React 19+
- **Development Server**: Vite 7+
- **Styling**: Tailwind CSS v4, indexed module
- **Graphical Representation**: Recharts components

## Deployment Instructions

From the `Front` project directory:

1. Proceed with the software installation:
   ```bash
   npm install
   ```

2. Execute the development server:
   ```bash
   npm run dev
   ```

The application is deployed by default at `http://localhost:5173/`.
