from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class TrainRequest(BaseModel):
    model_type: str
    params: Dict[str, Any]
    experiment_name: Optional[str] = "Bank_Marketing"

class PredictRequest(BaseModel):
    age: int
    job: str
    marital: str
    education: str
    default: str
    balance: int
    housing: str
    loan: str
    contact: str
    day: int
    month: str
    duration: int
    campaign: int
    pdays: int
    previous: int
    poutcome: str

class TrainingStatusResponse(BaseModel):
    status: str
    progress: int
    metrics: Optional[Dict[str, float]] = None
    error: Optional[str] = None
