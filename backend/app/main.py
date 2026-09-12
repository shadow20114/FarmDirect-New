from datetime import datetime
from pathlib import Path
import sqlite3
import urllib.request
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "farmdirect.db"
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8001")
LOGISTICS_SERVICE_URL = os.getenv("LOGISTICS_SERVICE_URL", "http://127.0.0.1:8002")

app = FastAPI(title="FarmDirect Connected Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

class ProduceIn(BaseModel):
    crop_name: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    quality_grade: str = "Grade A (Premium)"
    expected_price: float = Field(gt=0)
    location: str = Field(min_length=1)

class LogisticsIn(BaseModel):
    pickup_1: str = Field(min_length=1)
    pickup_2: str | None = None
    destination: str = Field(min_length=1)
    vehicle_type: str = "10-Tonne Multi-Axle Heavy Truck"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS produce(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        expected_price REAL NOT NULL,
        location TEXT NOT NULL,
        available_date TEXT,
        created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fpo_pools(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_name TEXT NOT NULL,
        target_quantity REAL NOT NULL,
        target_amount REAL NOT NULL,
        status TEXT NOT NULL,
        selected_products TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)
    conn.commit(); conn.close()

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status":"online","database":"connected","ai_service":AI_SERVICE_URL,"logistics_service":LOGISTICS_SERVICE_URL}

@app.get("/health")
def health():
    return {"status":"healthy"}

@app.post("/api/produce/add")
def add_produce(item: ProduceIn):
    now = datetime.utcnow().isoformat()
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO produce(crop_name,quantity,quality_grade,expected_price,location,available_date,created_at) VALUES(?,?,?,?,?,?,?)", (item.crop_name.strip(), item.quantity, item.quality_grade.strip(), item.expected_price, item.location.strip(), datetime.utcnow().date().isoformat(), now))
    conn.commit(); pid = cur.lastrowid; conn.close()
    return {"status":"success","message":f"{item.crop_name.strip()} saved to database!","data":{"id":pid}}

@app.get("/api/produce/list")
def list_produce():
    conn=get_db(); rows=conn.execute("SELECT id,crop_name,quantity,quality_grade,expected_price,location,available_date,created_at FROM produce WHERE quantity>0 ORDER BY id DESC").fetchall(); conn.close()
    return [dict(r) for r in rows]

@app.get("/api/produce/{produce_id}")
def get_produce(produce_id:int):
    conn=get_db(); row=conn.execute("SELECT id,crop_name,quantity,quality_grade,expected_price,location,available_date,created_at FROM produce WHERE id=?",(produce_id,)).fetchone(); conn.close()
    if not row: raise HTTPException(404,"Produce not found")
    return dict(row)

@app.get("/api/ai/price-predict")
def price_predict(crop:str="Wheat", baseline:float=2400.0, demand:int=85, quantity:float=10):
    payload={"crop":crop,"baseline":baseline,"demand":demand,"quantity":quantity}
    try:
        req=urllib.request.Request(AI_SERVICE_URL+"/predict-price", data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=3) as r:
            data=json.loads(r.read().decode())
        return data
    except Exception:
        # Keep the frontend usable even when the optional microservice is offline.
        recommended=round(baseline*(1+((demand-50)/1000)),2)
        retail=round(recommended*1.15,2)
        change=round(((recommended-baseline)/baseline)*100,2) if baseline else 0
        level="HIGH" if demand>=75 else "MEDIUM" if demand>=55 else "LOW"
        return {"crop":crop,"recommended_price":recommended,"mandi_baseline":baseline,"demand_index":demand,"demand_level":level,"retail_rate":retail,"price_change_percentage":change,"source":"backend-fallback"}

@app.post("/api/fpo/pools")
def create_pool(payload:dict):
    for key in ("pool_name","target_quantity","target_amount","selected_products"):
        if key not in payload: raise HTTPException(422,f"Missing field: {key}")
    if not payload["selected_products"]: raise HTTPException(400,"Select at least one product")
    now=datetime.utcnow().isoformat(); conn=get_db(); cur=conn.cursor()
    cur.execute("INSERT INTO fpo_pools(pool_name,target_quantity,target_amount,status,selected_products,created_at) VALUES(?,?,?,?,?,?)",(str(payload["pool_name"]).strip(),float(payload["target_quantity"]),float(payload["target_amount"]),"ACTIVE",json.dumps(payload["selected_products"]),now))
    conn.commit(); pool_id=cur.lastrowid; conn.close()
    return {"message":"Bulk pool created successfully!","pool_id":pool_id}

@app.get("/api/fpo/pools")
def list_pools():
    conn=get_db(); rows=conn.execute("SELECT * FROM fpo_pools ORDER BY id DESC").fetchall(); conn.close(); out=[]
    for r in rows:
        d=dict(r); d["selected_products"]=json.loads(d["selected_products"]); out.append(d)
    return out

@app.post("/api/logistics/optimize")
def optimize_logistics(payload:LogisticsIn):
    body=payload.model_dump()
    try:
        req=urllib.request.Request(LOGISTICS_SERVICE_URL+"/optimize-route", data=json.dumps(body).encode(), headers={"Content-Type":"application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read().decode())
    except Exception:
        # Same route contract, deterministic local fallback.
        places=[payload.pickup_1.strip()]+([payload.pickup_2.strip()] if payload.pickup_2 and payload.pickup_2.strip() else [])+[payload.destination.strip()]
        base=max(25, len(" ".join(places))*1.8)
        return {"distance_km":round(base,1),"duration":"Estimated","freight_cost_per_qtl":round(max(25,base*0.25),2),"savings_percentage":20,"assigned_truck":payload.vehicle_type,"source":"backend-fallback"}
