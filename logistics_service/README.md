# FarmDirect Logistics Service
Standalone route microservice matching the frontend route payload through the main backend.

Run:
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8002

Endpoint:
POST /optimize-route
