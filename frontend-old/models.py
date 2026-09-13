from sqlalchemy import Column,Integer,String,Float,Text
from database import Base
class ProduceDB(Base):
    __tablename__="produce"
    id=Column(Integer,primary_key=True,index=True)
    crop_name=Column(String,index=True)
    quantity=Column(Float)
    quality_grade=Column(String)
    expected_price=Column(Float)
    location=Column(String,default="Not specified")
class LogisticsDB(Base):
    __tablename__="logistics"
    id=Column(Integer,primary_key=True,index=True)
    pickup_1=Column(String)
    pickup_2=Column(String,nullable=True)
    destination=Column(String)
    vehicle_type=Column(String)
    distance_km=Column(Float)
    freight_cost=Column(Float)
class BulkPoolDB(Base):
    __tablename__="bulk_pools"
    id=Column(Integer,primary_key=True,index=True)
    pool_name=Column(String)
    target_quantity=Column(Float)
    target_amount=Column(Float)
    selected_products=Column(Text)
    status=Column(String,default="Open")