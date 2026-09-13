document.addEventListener("DOMContentLoaded",function(){
const pickup1=document.getElementById("pickup1");
const pickup2=document.getElementById("pickup2");
const destination=document.getElementById("destination");
const vehicleType=document.getElementById("vehicleType");
const calculateButton=document.getElementById("calculateRouteBtn");
const routeDistance=document.getElementById("routeDistance");
const routeDuration=document.getElementById("routeDuration");
const freightCost=document.getElementById("freightCost");
const savingsText=document.getElementById("savingsText");
const logisticsStatus=document.getElementById("logisticsStatus");
const routeSummary=document.getElementById("routeSummary");
const routeMap=document.getElementById("routeMap");
if(!pickup1||!destination||!calculateButton||!routeDistance||!routeDuration||!freightCost){
console.error("FarmDirect Logistics: required elements not found.");
return;
}
const locationCoordinates={
"nashik":[19.9975,73.7898],
"nashik maharashtra":[19.9975,73.7898],
"igatpuri":[19.6952,73.5627],
"igatpuri maharashtra":[19.6952,73.5627],
"vashi":[19.0771,72.9986],
"vashi navi mumbai":[19.0771,72.9986],
"navi mumbai":[19.0330,73.0297],
"mumbai":[19.0760,72.8777],
"pune":[18.5204,73.8567],
"hyderabad":[17.3850,78.4867],
"secunderabad":[17.4399,78.4983],
"moosapet":[17.4719,78.4296],
"miyapur":[17.4968,78.3570],
"warangal":[17.9689,79.5941],
"karimnagar":[18.4386,79.1288],
"vijayawada":[16.5062,80.6480],
"visakhapatnam":[17.6868,83.2185],
"bangalore":[12.9716,77.5946],
"bengaluru":[12.9716,77.5946],
"chennai":[13.0827,80.2707],
"delhi":[28.6139,77.2090],
"new delhi":[28.6139,77.2090],
"ahmedabad":[23.0225,72.5714],
"surat":[21.1702,72.8311],
"jaipur":[26.9124,75.7873],
"lucknow":[26.8467,80.9462],
"nagpur":[21.1458,79.0882],
"indore":[22.7196,75.8577],
"bhopal":[23.2599,77.4126],
"patna":[25.5941,85.1376],
"nanded":[19.1383,77.3210],
"solapur":[17.6599,75.9064],
"thane":[19.2183,72.9781],
"kolhapur":[16.7050,74.2433],
"satara":[17.6805,74.0183]
};
let map=null;
let markers=[];
let routeLine=null;
if(typeof L!=="undefined"&&routeMap){
map=L.map("routeMap").setView([19.5,76.5],6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
maxZoom:19,
attribution:"© OpenStreetMap contributors"
}).addTo(map);
}
function findCoordinates(place,index){
const text=String(place||"").trim().toLowerCase().replace(/\s+/g," ");
if(locationCoordinates[text])return locationCoordinates[text];
for(const key in locationCoordinates){
if(text.includes(key)||key.includes(text))return locationCoordinates[key];
}
const fallback=[
[20.0,74.0],
[20.8,75.5],
[19.0,73.0]
];
return fallback[Math.min(index,fallback.length-1)];
}
function clearMap(){
if(!map)return;
markers.forEach(function(marker){
map.removeLayer(marker);
});
markers=[];
if(routeLine){
map.removeLayer(routeLine);
routeLine=null;
}
}
function drawRouteMap(){
const places=[];
const first=pickup1.value.trim();
const second=pickup2?pickup2.value.trim():"";
const finalPlace=destination.value.trim();
if(first)places.push({label:"Pickup 1",name:first});
if(second)places.push({label:"Pickup 2",name:second});
if(finalPlace)places.push({label:"Destination",name:finalPlace});
if(routeSummary){
if(places.length===0){
routeSummary.textContent="Enter route details and calculate the optimized route.";
}else{
routeSummary.innerHTML=places.map(function(place,index){
let dot="bg-amber-400";
if(index===0)dot="bg-emerald-400";
if(index===places.length-1)dot="bg-blue-400";
return '<div class="flex items-start gap-2 mb-2"><span class="w-2 h-2 rounded-full '+dot+' mt-1"></span><span>'+place.label+': <strong>'+place.name+"</strong></span></div>";
}).join("");
}
}
if(!map||places.length<2)return;
clearMap();
const points=[];
places.forEach(function(place,index){
const coordinates=findCoordinates(place.name,index);
points.push(coordinates);
const marker=L.marker(coordinates).addTo(map);
marker.bindPopup("<strong>"+place.label+"</strong><br>"+place.name);
markers.push(marker);
});
routeLine=L.polyline(points,{weight:5,opacity:0.9}).addTo(map);
map.fitBounds(routeLine.getBounds(),{padding:[30,30]});
}
function calculateFallback(){
const first=findCoordinates(pickup1.value,0);
const second=pickup2&&pickup2.value.trim()?findCoordinates(pickup2.value,1):null;
const finalPlace=findCoordinates(destination.value,second?2:1);
function distance(a,b){
const R=6371;
const dLat=(b[0]-a[0])*Math.PI/180;
const dLon=(b[1]-a[1])*Math.PI/180;
const x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
let distanceKm=distance(first,finalPlace);
if(second)distanceKm=distance(first,second)+distance(second,finalPlace);
distanceKm=Math.round(distanceKm*1.15*10)/10;
const hours=distanceKm/45;
const h=Math.floor(hours);
const mins=Math.round((hours-h)*60);
return{
distance_km:distanceKm,
duration:h+" Hours "+mins+" Mins",
freight_cost_per_qtl:Math.max(25,Math.round(distanceKm*0.25)),
savings_percentage:20
};
}
async function calculateRoute(){
const first=pickup1.value.trim();
const second=pickup2?pickup2.value.trim():"";
const finalPlace=destination.value.trim();
if(!first||!finalPlace){
logisticsStatus.textContent="Please enter Pickup Point 1 and Destination.";
logisticsStatus.className="text-xs text-center text-rose-400";
return;
}
calculateButton.disabled=true;
calculateButton.textContent="CALCULATING...";
logisticsStatus.textContent="Calculating optimized transport...";
logisticsStatus.className="text-xs text-center text-slate-400";
routeDistance.textContent="Calculating...";
routeDuration.textContent="Calculating...";
freightCost.textContent="Calculating...";
try{
const response=await fetch("http://127.0.0.1:8000/api/logistics/optimize",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
pickup_1:first,
pickup_2:second||null,
destination:finalPlace,
vehicle_type:vehicleType?vehicleType.value:"10-Tonne Multi-Axle Heavy Truck"
})
});
if(!response.ok){
let errorMessage="Backend route calculation failed.";
try{
const errorData=await response.json();
if(errorData.detail)errorMessage=errorData.detail;
}catch(e){}
throw new Error(errorMessage);
}
const data=await response.json();
const distance=Number(data.distance_km);
const cost=Number(data.freight_cost_per_qtl);
if(!Number.isFinite(distance)||!Number.isFinite(cost))throw new Error("Invalid route data received from backend.");
routeDistance.textContent=distance.toLocaleString("en-IN")+" km";
routeDuration.textContent=data.duration||"Estimated";
freightCost.textContent="₹"+cost.toLocaleString("en-IN")+" / Qtl";
if(savingsText)savingsText.textContent="Saved "+Number(data.savings_percentage||0)+"% through optimized transport";
logisticsStatus.textContent="Route calculated successfully.";
logisticsStatus.className="text-xs text-center text-emerald-400";
drawRouteMap();
}catch(error){
console.error("FarmDirect Logistics backend error:",error);
const fallback=calculateFallback();
routeDistance.textContent=fallback.distance_km.toLocaleString("en-IN")+" km";
routeDuration.textContent=fallback.duration;
freightCost.textContent="₹"+fallback.freight_cost_per_qtl.toLocaleString("en-IN")+" / Qtl";
if(savingsText)savingsText.textContent="Estimated optimized transport cost";
logisticsStatus.textContent="Backend unavailable. Showing estimated route.";
logisticsStatus.className="text-xs text-center text-amber-400";
drawRouteMap();
}finally{
calculateButton.disabled=false;
calculateButton.textContent="CALCULATE OPTIMAL ROUTE";
}
}
calculateButton.addEventListener("click",calculateRoute);
drawRouteMap();
});