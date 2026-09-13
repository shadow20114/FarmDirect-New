document.addEventListener("DOMContentLoaded",function(){
const farmerForm=document.getElementById("farmerForm");
const cropName=document.getElementById("farmerCropName");
const quantity=document.getElementById("farmerQuantity");
const price=document.getElementById("farmerPrice");
const location=document.getElementById("farmerLocation");
const submitBtn=document.getElementById("farmerSubmitBtn");
const status=document.getElementById("farmerStatus");
const listings=document.getElementById("farmerListings");
const offersList=document.getElementById("farmerOffersList");
const OFFER_VERSION="3";
if(localStorage.getItem("farmDirectOffersVersion")!==OFFER_VERSION){
localStorage.removeItem("farmDirectOffers");
localStorage.setItem("farmDirectOffersVersion",OFFER_VERSION);
}
function getOffers(){
return JSON.parse(localStorage.getItem("farmDirectOffers")||"[]");
}
function saveOffers(offers){
localStorage.setItem("farmDirectOffers",JSON.stringify(offers));
}
function getBestOffer(produceId){
const offers=getOffers().filter(offer=>String(offer.listingKey)===String(produceId)&&offer.status!=="Rejected");
if(offers.length===0)return null;
return offers.sort((a,b)=>Number(b.offerPrice)-Number(a.offerPrice))[0];
}
function renderOffers(){
const offers=getOffers();
if(!offersList)return;
if(offers.length===0){
offersList.innerHTML='<div class="py-8 text-center text-slate-400 text-xs">No buyer offers yet.</div>';
return;
}
offersList.innerHTML=offers.map(offer=>{
const statusClass=offer.status==="Pending"?"bg-yellow-500/10 text-yellow-400 border-yellow-500/30":offer.status==="Accepted"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/30":"bg-rose-500/10 text-rose-400 border-rose-500/30";
return `<div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
<div class="flex justify-between items-start gap-3 mb-4">
<div><h3 class="font-bold text-slate-100">${offer.crop_name}</h3><p class="text-xs text-slate-400 mt-1">📍 ${offer.location||"Not specified"}</p></div>
<span class="text-[10px] font-bold px-2 py-1 rounded border ${statusClass}">${offer.status}</span>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
<div class="bg-slate-800 rounded-lg p-3"><span class="text-slate-400 block mb-1">Buyer</span><strong>${offer.buyerName}</strong></div>
<div class="bg-slate-800 rounded-lg p-3"><span class="text-slate-400 block mb-1">Offer Price</span><strong class="text-emerald-400">₹${Number(offer.offerPrice).toLocaleString("en-IN")} / Qtl</strong></div>
<div class="bg-slate-800 rounded-lg p-3"><span class="text-slate-400 block mb-1">Quantity</span><strong>${offer.offerQuantity} Qtl</strong></div>
<div class="bg-slate-800 rounded-lg p-3"><span class="text-slate-400 block mb-1">Submitted</span><strong>${offer.createdAt}</strong></div>
</div>
${offer.status==="Pending"?`<div class="flex gap-2"><button data-id="${offer.id}" class="acceptOfferButton flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-lg text-xs">✓ ACCEPT OFFER</button><button data-id="${offer.id}" class="rejectOfferButton flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2 rounded-lg text-xs border border-rose-500/30">✕ REJECT OFFER</button></div>`:""}
</div>`;
}).join("");
document.querySelectorAll(".acceptOfferButton").forEach(button=>button.addEventListener("click",function(){
updateOfferStatus(this.dataset.id,"Accepted");
}));
document.querySelectorAll(".rejectOfferButton").forEach(button=>button.addEventListener("click",function(){
updateOfferStatus(this.dataset.id,"Rejected");
}));
}
function updateOfferStatus(id,newStatus){
const offers=getOffers();
const offer=offers.find(item=>String(item.id)===String(id));
if(!offer)return;
offer.status=newStatus;
saveOffers(offers);
renderOffers();
loadListings();
}
async function removeProduce(id,crop){
if(!confirm(`Remove "${crop}" from your published produce?`))return;
try{
const response=await fetch(`http://127.0.0.1:8000/api/produce/${id}`,{method:"DELETE"});
const result=await response.json();
if(!response.ok)throw new Error(result.detail||"Delete failed");
const offers=getOffers().filter(offer=>String(offer.listingKey)!==String(id));
saveOffers(offers);
status.textContent=result.message||"Produce removed successfully.";
status.className="text-xs text-emerald-400 text-center";
await loadListings();
}catch(error){
console.error("Remove produce error:",error);
status.textContent="Could not remove this listing.";
status.className="text-xs text-rose-400 text-center";
}
}
async function loadListings(){
try{
const response=await fetch("http://127.0.0.1:8000/api/produce/list");
if(!response.ok)throw new Error("Backend error");
const items=await response.json();
if(items.length===0){
listings.innerHTML='<tr><td colspan="7" class="py-8 text-center text-slate-400">No produce listed yet.</td></tr>';
renderOffers();
return;
}
listings.innerHTML=items.map(item=>{
const bestOffer=getBestOffer(item.id);
return `<tr>
<td class="py-3 px-3 font-semibold text-slate-100">${item.crop_name}</td>
<td class="py-3 px-3">${item.location||"Not specified"}</td>
<td class="py-3 px-3">${item.quantity} Qtl</td>
<td class="py-3 px-3 text-emerald-400">₹${Number(item.expected_price).toLocaleString("en-IN")}</td>
<td class="py-3 px-3 ${bestOffer?"text-emerald-400 font-bold":"text-slate-400"}">${bestOffer?`₹${Number(bestOffer.offerPrice).toLocaleString("en-IN")} (${bestOffer.buyerName})`:"Pending"}</td>
<td class="py-3 px-3"><span class="text-emerald-400">Active</span></td>
<td class="py-3 px-3"><button data-id="${item.id}" data-name="${item.crop_name}" class="removeProduceButton bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold">REMOVE</button></td>
</tr>`;
}).join("");
document.querySelectorAll(".removeProduceButton").forEach(button=>button.addEventListener("click",function(){
removeProduce(this.dataset.id,this.dataset.name);
}));
renderOffers();
}catch(error){
console.error("Farmer dashboard error:",error);
listings.innerHTML='<tr><td colspan="7" class="py-8 text-center text-rose-400">Could not load listings. Make sure FastAPI is running.</td></tr>';
renderOffers();
}
}
if(farmerForm){
farmerForm.addEventListener("submit",async function(event){
event.preventDefault();
if(!cropName.value.trim()||!quantity.value||!price.value||!location.value.trim()){
status.textContent="Please fill all fields.";
status.className="text-xs text-rose-400 text-center";
return;
}
submitBtn.disabled=true;
submitBtn.textContent="SUBMITTING...";
try{
const payload={
crop_name:cropName.value.trim(),
quantity:parseFloat(quantity.value),
quality_grade:"Grade A (Premium)",
expected_price:parseFloat(price.value),
location:location.value.trim()
};
const response=await fetch("http://127.0.0.1:8000/api/produce/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
const result=await response.json();
if(!response.ok)throw new Error(result.detail?JSON.stringify(result.detail):"Backend error");
status.textContent=result.message||"Listing added successfully!";
status.className="text-xs text-emerald-400 text-center";
farmerForm.reset();
await loadListings();
}catch(error){
console.error("Farmer submit error:",error);
status.textContent="Server error. Please try again.";
status.className="text-xs text-rose-400 text-center";
}finally{
submitBtn.disabled=false;
submitBtn.textContent="SUBMIT LISTING";
}
});
}
loadListings();
});