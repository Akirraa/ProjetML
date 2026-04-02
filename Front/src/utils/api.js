const API_BASE_URL = 'http://localhost:8000/api';

export const fetchStats = async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

export const fetchSample = async (n = 50, page = 1) => {
    const response = await fetch(`${API_BASE_URL}/data/sample?n=${n}&page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch data sample');
    return response.json();
};

export const cleanDataset = async () => {
    const response = await fetch(`${API_BASE_URL}/data/clean`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to clean dataset');
    return response.json();
};

export const uploadCsv = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/data/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
};

export const getModels = async () => {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) throw new Error('Failed to fetch model list');
    return response.json();
};

export const startTraining = async (modelType, params) => {
    const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType, params }),
    });
    if (!response.ok) throw new Error('Failed to start training');
    return response.json();
};

export const getTrainingStatus = async (runId) => {
    const response = await fetch(`${API_BASE_URL}/train/status/${runId}`);
    if (!response.ok) throw new Error('Failed to fetch training status');
    return response.json();
};

export const fetchHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
};

export const predictCustomer = async (data) => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Inference failed');
    return response.json();
};
