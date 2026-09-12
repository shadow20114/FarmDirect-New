document.addEventListener("DOMContentLoaded",function(){
const createPoolBtn=document.getElementById("createPoolBtn");
const cancelPoolBtn=document.getElementById("cancelPoolBtn");
const poolCreator=document.getElementById("poolCreator");
const poolForm=document.getElementById("poolForm");
const poolProducts=document.getElementById("poolProducts");
const poolName=document.getElementById("poolName");
const poolQuantity=document.getElementById("poolQuantity");
const poolAmount=document.getElementById("poolAmount");
const poolStatus=document.getElementById("poolStatus");
const selectedCount=document.getElementById("selectedCount");
const poolSummary=document.getElementById("poolSummary");
const activePools=document.getElementById("activePools");
const poolSources=document.getElementById("poolSources");
let produceItems=[];
function money(value){
return Number(value).toLocaleString("en-IN");
}
async function loadProduce(){
try{
const response=await fetch("http://127.0.0.1:8000/api/produce/list");
if(!response.ok)throw new Error("Could not load produce");
produceItems=await response.json();
renderProducts();
}catch(error){
console.error(error);
poolProducts.innerHTML='<p class="text-xs text-rose-400 text-center py-5">Could not load published produce. Make sure FastAPI is running.</p>';
}
}
function renderProducts(){
if(!produceItems.length){
poolProducts.innerHTML='<p class="text-xs text-slate-400 text-center py-5">No published produce available. Add produce from Farmer Dashboard first.</p>';
return;
}
poolProducts.innerHTML=produceItems.map(item=>`
<label class="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-emerald-500/50">
<input type="checkbox" class="poolProductCheckbox w-4 h-4 accent-emerald-500" value="${item.id}">
<div class="flex-1">
<div class="flex justify-between gap-3"><strong class="text-xs text-slate-100">${item.crop_name}</strong><span class="text-[10px] text-emerald-400">₹${money(item.expected_price)}/Qtl</span></div>
<p class="text-[10px] text-slate-400 mt-1">${item.quantity} Qtl • ${item.location||"Location not specified"}</p>
</div>
</label>`).join("");
document.querySelectorAll(".poolProductCheckbox").forEach(box=>box.addEventListener("change",updatePoolPreview));
updatePoolPreview();
}
function getSelectedProducts(){
const ids=[...document.querySelectorAll(".poolProductCheckbox:checked")].map(box=>Number(box.value));
return produceItems.filter(item=>ids.includes(Number(item.id)));
}
function updatePoolPreview(){
const selected=getSelectedProducts();
selectedCount.textContent=`${selected.length} selected`;
if(!selected.length){
poolSummary.textContent="Select products and enter the pool quantity and amount.";
poolSources.textContent="No products selected.";
return;
}
const available=selected.reduce((total,item)=>total+Number(item.quantity),0);
poolSummary.textContent=`${selected.length} product listing(s) selected with ${available} Qtl total available.`;
poolSources.innerHTML=selected.map(item=>`<div class="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-2"><div class="flex justify-between"><strong>${item.crop_name}</strong><span class="text-emerald-400">${item.quantity} Qtl</span></div><p class="text-slate-400 mt-1">${item.location||"Location not specified"}</p></div>`).join("");
}
createPoolBtn.addEventListener("click",function(){
poolCreator.classList.remove("hidden");
loadProduce();
poolCreator.scrollIntoView({behavior:"smooth"});
});
cancelPoolBtn.addEventListener("click",function(){
poolCreator.classList.add("hidden");
});
poolForm.addEventListener("submit",async function(event){
event.preventDefault();
const selected=getSelectedProducts();
if(!poolName.value.trim()){
poolStatus.textContent="Enter a bulk pool name.";
poolStatus.className="text-xs text-center text-rose-400";
return;
}
if(!selected.length){
poolStatus.textContent="Select at least one product.";
poolStatus.className="text-xs text-center text-rose-400";
return;
}
if(!poolQuantity.value||Number(poolQuantity.value)<=0){
poolStatus.textContent="Enter a valid target bulk quantity.";
poolStatus.className="text-xs text-center text-rose-400";
return;
}
if(!poolAmount.value||Number(poolAmount.value)<=0){
poolStatus.textContent="Enter a valid bulk pool amount.";
poolStatus.className="text-xs text-center text-rose-400";
return;
}
const available=selected.reduce((total,item)=>total+Number(item.quantity),0);
if(Number(poolQuantity.value)>available){
poolStatus.textContent=`Target quantity cannot exceed ${available} Qtl available from selected products.`;
poolStatus.className="text-xs text-center text-rose-400";
return;
}
const payload={
pool_name:poolName.value.trim(),
target_quantity:Number(poolQuantity.value),
target_amount:Number(poolAmount.value),
selected_products:selected.map(item=>({
id:item.id,
crop_name:item.crop_name,
quantity:item.quantity,
expected_price:item.expected_price,
location:item.location||"Not specified"
}))
};
try{
const response=await fetch("http://127.0.0.1:8000/api/fpo/pools",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
const result=await response.json();
if(!response.ok)throw new Error(result.detail||"Pool creation failed");
poolStatus.textContent=result.message||"Bulk pool created successfully!";
poolStatus.className="text-xs text-center text-emerald-400";
poolForm.reset();
document.querySelectorAll(".poolProductCheckbox").forEach(box=>box.checked=false);
updatePoolPreview();
await loadPools();
}catch(error){
console.error("Bulk pool error:",error);
poolStatus.textContent=error.message||"Could not create bulk pool.";
poolStatus.className="text-xs text-center text-rose-400";
}
});
async function loadPools(){
try{
const response=await fetch("http://127.0.0.1:8000/api/fpo/pools");
if(!response.ok)throw new Error("Pool loading failed");
const pools=await response.json();
if(!pools.length){
activePools.innerHTML='<p class="text-xs text-slate-400 py-5 text-center">No bulk pools created yet.</p>';
return;
}
activePools.innerHTML=pools.map(pool=>`
<div class="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs">
<div class="flex flex-col sm:flex-row justify-between gap-2 font-bold text-emerald-400 text-sm mb-1">
<span>${pool.pool_name}</span>
<span>₹${money(pool.target_amount)}</span>
</div>
<p class="text-slate-400 mb-2">Target Quantity: ${pool.target_quantity} Qtl • Status: ${pool.status}</p>
<div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2"><div class="bg-emerald-500 h-full" style="width:100%"></div></div>
<div class="text-[11px] text-slate-400">Products: ${pool.selected_products.map(item=>item.crop_name).join(", ")}</div>
</div>`).join("");
}catch(error){
console.error("Pool loading error:",error);
activePools.innerHTML='<p class="text-xs text-rose-400">Could not load bulk pools.</p>';
}
}
loadProduce();
loadPools();
});