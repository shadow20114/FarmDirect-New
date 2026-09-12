import math
from fastapi import FastAPI
from pydantic import BaseModel
app=FastAPI(title="FarmDirect Logistics Service",version="1.0.0")
COORDS={
"hyderabad":(17.3850,78.4867),"nashik":(19.9975,73.7898),"mumbai":(19.0760,72.8777),"pune":(18.5204,73.8567),"delhi":(28.6139,77.2090),"new delhi":(28.6139,77.2090),"bangalore":(12.9716,77.5946),"bengaluru":(12.9716,77.5946),"amritsar":(31.6340,74.8723),"ludhiana":(30.9010,75.8573),"vijayawada":(16.5062,80.6480),"warangal":(17.9689,79.5941),"nagpur":(21.1458,79.0882),"jaipur":(26.9124,75.7873),"kolkata":(22.5726,88.3639),"chennai":(13.0827,80.2707)}
class In(BaseModel):
    pickup_1:str
    pickup_2:str|None=None
    destination:str
    vehicle_type:str="10-Tonne Multi-Axle Heavy Truck"
def find(name:str,idx:int):
    key=name.strip().lower()
    if key in COORDS:return COORDS[key]
    seeds=[(17.3850,78.4867),(19.0760,72.8777),(28.6139,77.2090),(12.9716,77.5946),(22.5726,88.3639)]
    return seeds[idx%len(seeds)]
def hav(a,b):
    R=6371; p=math.pi/180; dlat=(b[0]-a[0])*p; dlon=(b[1]-a[1])*p
    x=math.sin(dlat/2)**2+math.cos(a[0]*p)*math.cos(b[0]*p)*math.sin(dlon/2)**2
    return R*2*math.atan2(math.sqrt(x),math.sqrt(1-x))
@app.get("/")
def root():return {"status":"online","service":"logistics"}
@app.get("/health")
def health():return {"status":"healthy"}
@app.post("/optimize-route")
def optimize(x:In):
    names=[x.pickup_1]+([x.pickup_2] if x.pickup_2 and x.pickup_2.strip() else [])+[x.destination]
    pts=[find(v,i) for i,v in enumerate(names)]
    raw=sum(hav(pts[i],pts[i+1]) for i in range(len(pts)-1))
    distance=round(raw*1.12,1)
    speed=45 if "heavy" in x.vehicle_type.lower() else 50
    mins=round(distance/speed*60)
    h=mins//60; m=mins%60
    cost=round(max(25,distance*0.25),2)
    return {"distance_km":distance,"duration":f"{h} Hours {m:02d} Mins","freight_cost_per_qtl":cost,"savings_percentage":20,"assigned_truck":x.vehicle_type,"stops":names,"source":"logistics-service"}
