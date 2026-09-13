document.addEventListener("DOMContentLoaded",function(){
const form=document.getElementById("produceForm");
const cropName=document.getElementById("cropName");
const quantity=document.getElementById("quantity");
const qualityGrade=document.getElementById("qualityGrade");
const expectedPrice=document.getElementById("expectedPrice");
const location=document.getElementById("location");
const publishButton=document.getElementById("publishButton");
const status=document.getElementById("status");
if(!form)return;
function showStatus(message,type){
status.textContent=message;
status.className="rounded-lg p-3 text-xs text-center";
if(type==="success")status.classList.add("bg-emerald-500/10","border","border-emerald-500/30","text-emerald-400");
else if(type==="error")status.classList.add("bg-rose-500/10","border","border-rose-500/30","text-rose-400");
else status.classList.add("bg-slate-700","text-slate-300");
}
form.addEventListener("submit",async function(event){
event.preventDefault();
const crop=cropName.value.trim();
const qty=Number(quantity.value);
const price=Number(expectedPrice.value);
const place=location.value.trim();
if(!crop||!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<=0||!place){
showStatus("Please fill all fields correctly.","error");
return;
}
publishButton.disabled=true;
publishButton.textContent="PUBLISHING...";
showStatus("Saving your produce to FarmDirect...","loading");
const payload={
crop_name:crop,
quantity:qty,
quality_grade:qualityGrade.value,
expected_price:price,
location:place
};
try{
const response=await fetch("http://127.0.0.1:8000/api/produce/add",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(payload)
});
let result={};
try{
result=await response.json();
}catch(error){}
if(!response.ok){
const message=Array.isArray(result.detail)?result.detail.map(x=>x.msg).join(", "):(result.detail||result.message||"Could not save produce.");
throw new Error(message);
}
showStatus(result.message||`${crop} saved successfully!`,"success");
form.reset();
setTimeout(function(){
window.location.href="farmer-dashboard.html";
},1200);
}catch(error){
console.error("Add produce error:",error);
showStatus(error.message||"Server error. Make sure the FastAPI server is running.","error");
}finally{
publishButton.disabled=false;
publishButton.textContent="PUBLISH LISTING";
}
});
});