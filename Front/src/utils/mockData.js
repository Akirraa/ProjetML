// Mock Dataset representing customer marketing data
export const mockDataset = [
    { id: 1, Age: 34, Income: 58000, Education: 'Master', Marital_Status: 'Married', Purchase_Frequency: 12, Last_Purchase_Days: 14, Campaign_Response: 1 },
    { id: 2, Age: 22, Income: 32000, Education: 'Bachelor', Marital_Status: 'Single', Purchase_Frequency: 4, Last_Purchase_Days: 45, Campaign_Response: 0 },
    { id: 3, Age: 45, Income: 95000, Education: 'PhD', Marital_Status: 'Married', Purchase_Frequency: 28, Last_Purchase_Days: 3, Campaign_Response: 1 },
    { id: 4, Age: 51, Income: 72000, Education: 'Master', Marital_Status: 'Divorced', Purchase_Frequency: 15, Last_Purchase_Days: 22, Campaign_Response: 0 },
    { id: 5, Age: 28, Income: 44000, Education: 'Bachelor', Marital_Status: 'Single', Purchase_Frequency: 8, Last_Purchase_Days: 31, Campaign_Response: 0 },
    { id: 6, Age: 39, Income: 61000, Education: 'Master', Marital_Status: 'Married', Purchase_Frequency: 19, Last_Purchase_Days: 10, Campaign_Response: 1 },
    { id: 7, Age: 62, Income: 110000, Education: 'PhD', Marital_Status: 'Married', Purchase_Frequency: 42, Last_Purchase_Days: 5, Campaign_Response: 1 },
    { id: 8, Age: 25, Income: 28000, Education: 'High School', Marital_Status: 'Single', Purchase_Frequency: 2, Last_Purchase_Days: 60, Campaign_Response: 0 },
    { id: 9, Age: 48, Income: 83000, Education: 'Bachelor', Marital_Status: 'Married', Purchase_Frequency: 21, Last_Purchase_Days: 12, Campaign_Response: 1 },
    { id: 10, Age: 31, Income: 52000, Education: 'Master', Marital_Status: 'Single', Purchase_Frequency: 11, Last_Purchase_Days: 18, Campaign_Response: 0 },
    // Adding more rows for better visualization
    { id: 11, Age: 55, Income: 89000, Education: 'PhD', Marital_Status: 'Married', Purchase_Frequency: 35, Last_Purchase_Days: 8, Campaign_Response: 1 },
    { id: 12, Age: 24, Income: 35000, Education: 'Bachelor', Marital_Status: 'Single', Purchase_Frequency: 6, Last_Purchase_Days: 35, Campaign_Response: 0 },
    { id: 13, Age: 42, Income: 67000, Education: 'Master', Marital_Status: 'Married', Purchase_Frequency: 17, Last_Purchase_Days: 15, Campaign_Response: 1 },
    { id: 14, Age: 37, Income: 55000, Education: 'Bachelor', Marital_Status: 'Divorced', Purchase_Frequency: 10, Last_Purchase_Days: 25, Campaign_Response: 0 },
    { id: 15, Age: 29, Income: 48000, Education: 'Master', Marital_Status: 'Single', Purchase_Frequency: 13, Last_Purchase_Days: 20, Campaign_Response: 1 },
];

export const mockModels = [
    {
        id: 'rf',
        name: 'Random Forest Classifier',
        description: 'Ensemble learning method using multiple decision trees for robust classification.',
        type: 'Ensemble',
        params: ['n_estimators', 'max_depth', 'min_samples_split'],
        metrics: { accuracy: 0.89, precision: 0.87, recall: 0.85, f1: 0.86, auc: 0.92 }
    },
    {
        id: 'xgb',
        name: 'XGBoost',
        description: 'Optimized gradient boosting library designed to be highly efficient and portable.',
        type: 'Boosting',
        params: ['learning_rate', 'max_depth', 'subsample', 'colsample_bytree'],
        metrics: { accuracy: 0.92, precision: 0.91, recall: 0.89, f1: 0.90, auc: 0.95 }
    },
    {
        id: 'lr',
        name: 'Logistic Regression',
        description: 'Simple yet effective linear model for binary classification tasks.',
        type: 'Linear',
        params: ['penalty', 'C', 'solver'],
        metrics: { accuracy: 0.84, precision: 0.82, recall: 0.79, f1: 0.80, auc: 0.87 }
    },
    {
        id: 'svm',
        name: 'Support Vector Machine',
        description: 'Constructs hyperplanes in high-dimensional space for classification.',
        type: 'Kernel-based',
        params: ['kernel', 'C', 'gamma'],
        metrics: { accuracy: 0.87, precision: 0.85, recall: 0.83, f1: 0.84, auc: 0.90 }
    }
];

export const rocData = [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.1, tpr: 0.4 },
    { fpr: 0.2, tpr: 0.65 },
    { fpr: 0.3, tpr: 0.82 },
    { fpr: 0.4, tpr: 0.88 },
    { fpr: 0.5, tpr: 0.92 },
    { fpr: 0.6, tpr: 0.95 },
    { fpr: 0.7, tpr: 0.97 },
    { fpr: 0.8, tpr: 0.99 },
    { fpr: 0.9, tpr: 1.0 },
    { fpr: 1.0, tpr: 1.0 },
];

export const prData = [
    { recall: 0.0, precision: 1.0 },
    { recall: 0.2, precision: 0.95 },
    { recall: 0.4, precision: 0.92 },
    { recall: 0.6, precision: 0.88 },
    { recall: 0.8, precision: 0.82 },
    { recall: 0.9, precision: 0.75 },
    { recall: 1.0, precision: 0.6 },
];

export const confusionMatrixData = [
    { label: 'True Positive', value: 342, color: '#10b981' },
    { label: 'True Negative', value: 521, color: '#10b981' },
    { label: 'False Positive', value: 45, color: '#f43f5e' },
    { label: 'False Negative', value: 32, color: '#f43f5e' },
];

export const mockExperiments = [
    { id: 'EXP-001', date: '2024-03-01', model: 'Random Forest', accuracy: 0.88, status: 'Completed' },
    { id: 'EXP-002', date: '2024-03-02', model: 'XGBoost', accuracy: 0.91, status: 'Completed' },
    { id: 'EXP-003', date: '2024-03-03', model: 'Logistic Regression', accuracy: 0.83, status: 'Completed' },
    { id: 'EXP-004', date: '2024-03-04', model: 'XGBoost', accuracy: 0.92, status: 'Completed' },
    { id: 'EXP-005', date: '2024-03-05', model: 'SVM', accuracy: 0.86, status: 'Failed' },
];
