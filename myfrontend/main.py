from fastapi import FastAPI,Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect,text
from pydantic import BaseModel,ConfigDict
from typing import Optional,List
import json
import joblib
import pandas as pd
import models
from database import engine,get_db
models.Base.metadata.create_all(bind=engine)
try:
    inspector=inspect(engine)
    produce_columns=[column["name"] for column in inspector.get_columns("produce")]
    if "location" not in produce_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE produce ADD COLUMN location VARCHAR DEFAULT 'Not specified'"))
except Exception as error:
    print("Database migration check:",error)
app=FastAPI(title="FarmDirect Backend Engine")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
try:
    ml_model=joblib.load("price_model.pkl")
except Exception:
    ml_model=None
class ProduceSchema(BaseModel):
    crop_name:str
    quantity:float
    quality_grade:str
    expected_price:float
    location:str
    model_config=ConfigDict(from_attributes=True)
class LogisticsSchema(BaseModel):
    pickup_1:str
    pickup_2:Optional[str]=None
    destination:str
    vehicle_type:str
class BulkPoolSchema(BaseModel):
    pool_name:str
    target_quantity:float
    target_amount:float
    selected_products:List[dict]
@app.get("/")
def root():
    return {"status":"online","database":"connected"}
@app.post("/api/produce/add")
def add_produce(item:ProduceSchema,db:Session=Depends(get_db)):
    db_item=models.ProduceDB(
        crop_name=item.crop_name,
        quantity=item.quantity,
        quality_grade=item.quality_grade,
        expected_price=item.expected_price,
        location=item.location
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"status":"success","message":f"{item.crop_name} saved to database!","data":db_item}
@app.get("/api/produce/list")
def get_all_produce(db:Session=Depends(get_db)):
    return db.query(models.ProduceDB).order_by(models.ProduceDB.id.desc()).all()
@app.delete("/api/produce/{produce_id}")
def delete_produce(produce_id:int,db:Session=Depends(get_db)):
    item=db.query(models.ProduceDB).filter(models.ProduceDB.id==produce_id).first()
    if not item:
        raise HTTPException(status_code=404,detail="Produce listing not found")
    crop_name=item.crop_name
    db.delete(item)
    db.commit()
    return {"status":"success","message":f"{crop_name} removed successfully"}
@app.post("/api/logistics/optimize")
def optimize_route(query:LogisticsSchema,db:Session=Depends(get_db)):
    distance=168.4
    cost=48.0
    if query.pickup_2:
        distance=185.7
        cost=44.0
    logistics_entry=models.LogisticsDB(
        pickup_1=query.pickup_1,
        pickup_2=query.pickup_2,
        destination=query.destination,
        vehicle_type=query.vehicle_type,
        distance_km=distance,
        freight_cost=cost
    )
    db.add(logistics_entry)
    db.commit()
    return {
        "distance_km":distance,
        "duration":"4 Hours 15 Mins" if not query.pickup_2 else "4 Hours 45 Mins",
        "freight_cost_per_qtl":cost,
        "savings_percentage":28 if not query.pickup_2 else 32,
        "assigned_truck":"MH-15-AG-4021"
    }
@app.get("/api/ai/price-predict")
def predict_price(crop:str="Wheat",baseline:float=2400.0,demand:int=85,quantity:float=100):
    baseline=float(baseline)
    quantity=max(1,float(quantity))
    demand=max(45,min(95,int(demand)))
    prediction=None
    if ml_model:
        try:
            input_data=pd.DataFrame([[crop,baseline,demand]],columns=["crop","mandi_baseline","demand_index"])
            prediction=float(ml_model.predict(input_data)[0])
        except Exception:
            prediction=None
    if prediction is None:
        prediction=baseline*(1+((demand-50)/1000))
    if quantity>=500:
        prediction*=0.98
    elif quantity>=200:
        prediction*=0.99
    elif quantity<=20:
        prediction*=1.01
    recommended=round(prediction,2)
    retail_rate=round(recommended*1.15,2)
    price_change=round(((recommended-baseline)/baseline)*100,2) if baseline else 0
    if demand>=85:
        demand_level="HIGH"
    elif demand>=60:
        demand_level="MEDIUM"
    else:
        demand_level="LOW"
    return {
        "crop":crop,
        "recommended_price":recommended,
        "mandi_baseline":round(baseline,2),
        "demand_index":f"{demand}/100",
        "demand_level":demand_level,
        "retail_rate":retail_rate,
        "price_change_percentage":price_change
    }
@app.post("/api/fpo/pools")
def create_bulk_pool(pool:BulkPoolSchema,db:Session=Depends(get_db)):
    if pool.target_quantity<=0:
        raise HTTPException(status_code=400,detail="Target quantity must be greater than zero")
    if pool.target_amount<=0:
        raise HTTPException(status_code=400,detail="Bulk pool amount must be greater than zero")
    if len(pool.selected_products)==0:
        raise HTTPException(status_code=400,detail="Select at least one produce listing")
    db_pool=models.BulkPoolDB(
        pool_name=pool.pool_name,
        target_quantity=pool.target_quantity,
        target_amount=pool.target_amount,
        selected_products=json.dumps(pool.selected_products),
        status="Open"
    )
    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)
    return {
        "status":"success",
        "message":"Bulk pool created successfully!",
        "data":{
            "id":db_pool.id,
            "pool_name":db_pool.pool_name,
            "target_quantity":db_pool.target_quantity,
            "target_amount":db_pool.target_amount,
            "selected_products":pool.selected_products,
            "status":db_pool.status
        }
    }
@app.get("/api/fpo/pools")
def get_bulk_pools(db:Session=Depends(get_db)):
    pools=db.query(models.BulkPoolDB).order_by(models.BulkPoolDB.id.desc()).all()
    result=[]
    for pool in pools:
        try:
            selected=json.loads(pool.selected_products or "[]")
        except Exception:
            selected=[]
        result.append({
            "id":pool.id,
            "pool_name":pool.pool_name,
            "target_quantity":pool.target_quantity,
            "target_amount":pool.target_amount,
            "selected_products":selected,
            "status":pool.status
        })
    return result