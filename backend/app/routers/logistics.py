import json,urllib.request,urllib.error
from fastapi import APIRouter,HTTPException
from pydantic import BaseModel,Field
from ..database import get_db
router=APIRouter(prefix="/api/logistics",tags=["Logistics"])
BASE_URL="http://127.0.0.1:8002"
class RouteIn(BaseModel):
    pickup_1:str=Field(min_length=1)
    pickup_2:str|None=None
    destination:str=Field(min_length=1)
    vehicle_type:str="10-Tonne Multi-Axle Heavy Truck"
class CostIn(BaseModel):
    distance_km:float=Field(gt=0)
    quantity_qtl:float=Field(gt=0)
    vehicle_type:str="10-Tonne Multi-Axle Heavy Truck"
class AllocationIn(BaseModel):
    total_cost:float=Field(gt=0)
    contributors:list
@router.post("/optimize")
def optimize(x:RouteIn):
    return call_service("/optimize-route",x.model_dump(),{"distance_km":100.0,"duration":"2 Hours 15 Mins","freight_cost_per_qtl":50.0,"savings_percentage":20,"assigned_truck":x.vehicle_type,"stops":[x.pickup_1]+([x.pickup_2] if x.pickup_2 else [])+[x.destination],"source":"backend-fallback"})
@router.post("/optimize-route")
def optimize_route(x:RouteIn):
    return optimize(x)
@router.post("/calculate-cost")
def calculate_cost(x:CostIn):
    return call_service("/calculate-cost",x.model_dump(),{"distance_km":round(x.distance_km,1),"quantity_qtl":x.quantity_qtl,"total_cost":round(max(500,x.distance_km*18),2),"fuel_cost":round(max(300,x.distance_km*.45),2),"driver_cost":round(max(250,x.distance_km*3),2),"toll_cost":round(max(100,x.distance_km*1.5),2),"additional_cost":100.0,"source":"backend-fallback"})
@router.post("/allocate-cost")
def allocate_cost(x:AllocationIn):
    data=call_service("/allocate-cost",x.model_dump(),None)
    if data:return data
    total_qty=sum(float(i.get("quantity",0) or 0) for i in x.contributors)
    if total_qty<=0: raise HTTPException(400,"Contributor quantities must be greater than zero")
    result=[]
    for i in x.contributors:
        qty=float(i.get("quantity",0) or 0);pct=qty/total_qty*100;result.append({"farmer_id":i.get("farmer_id"),"farmer_name":i.get("farmer_name","Farmer"),"quantity_qtl":qty,"share_percentage":round(pct,2),"allocated_cost":round(x.total_cost*pct/100,2)})
    return {"total_cost":x.total_cost,"allocations":result,"source":"backend-fallback"}
@router.get("/routes/{order_id}")
def route_by_order(order_id:int):
    conn=get_db();r=conn.execute("SELECT * FROM routes WHERE order_id=?",(str(order_id),)).fetchone();conn.close()
    if not r: raise HTTPException(404,"Route not found for this order")
    item=dict(r)
    try:item["route"]=json.loads(item.pop("route_json"))
    except Exception:item["route"]={}
    return item
def call_service(path,payload,fallback):
    try:
        req=urllib.request.Request(BASE_URL+path,data=json.dumps(payload).encode(),headers={"Content-Type":"application/json"},method="POST")
        with urllib.request.urlopen(req,timeout=5) as r:return json.loads(r.read().decode())
    except Exception:
        if fallback is not None:return fallback
        return None
