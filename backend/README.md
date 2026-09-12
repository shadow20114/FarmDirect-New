# FarmDirect Connected Backend
Matches the supplied frontend contract exactly.

Run from this backend folder:
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

Frontend endpoints supported:
POST /api/produce/add
GET  /api/produce/list
GET  /api/produce/{id}
GET  /api/ai/price-predict
POST /api/fpo/pools
GET  /api/fpo/pools
POST /api/logistics/optimize

The AI and logistics services are optional connected microservices. The backend has deterministic fallbacks so the frontend remains usable if a microservice is temporarily offline.
