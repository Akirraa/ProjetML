from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import endpoints

app = FastAPI(title="Bank Marketing ML Backend")

# Enable CORS for the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Bank Marketing ML API is running"}
