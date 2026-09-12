const API_BASE="http://127.0.0.1:8000";
let allProduce=[];
let filteredProduce=[];
let selectedProduce=null;
document.addEventListener("DOMContentLoaded",function(){
setupBuyerPage();
});
function setupBuyerPage(){
const searchInput=document.getElementById("searchInput");
const locationSelect=document.getElementById("locationSelect");
const sortSelect=document.getElementById("sortSelect");
const offerForm=document.getElementById("offerForm");
const closeDetailsBtn=document.getElementById("closeDetailsBtn");
const closeOfferBtn=document.getElementById("closeOfferBtn");
if(searchInput)searchInput.addEventListener("input",applyFilters);
if(locationSelect)locationSelect.addEventListener("change",applyFilters);
if(sortSelect)sortSelect.addEventListener("change",applyFilters);
if(offerForm)offerForm.addEventListener("submit",submitOffer);
if(closeDetailsBtn)closeDetailsBtn.addEventListener("click",closeDetailsModal);
if(closeOfferBtn)closeOfferBtn.addEventListener("click",closeOfferModal);
const detailsModal=document.getElementById("detailsModal");
const offerModal=document.getElementById("offerModal");
if(detailsModal){
detailsModal.addEventListener("click",function(event){
if(event.target===detailsModal)closeDetailsModal();
});
}
if(offerModal){
offerModal.addEventListener("click",function(event){
if(event.target===offerModal)closeOfferModal();
});
}
loadVoiceSearch();
fetchMarketplaceItems();
}
async function fetchMarketplaceItems(){
const grid=document.getElementById("marketplaceGrid");
if(!grid)return;
grid.innerHTML='<div class="col-span-full text-center py-12 text-slate-400 text-sm">Loading live crop listings from database...</div>';
try{
const response=await fetch(API_BASE+"/api/produce/list");
if(!response.ok)throw new Error("Failed to fetch produce");
const data=await response.json();
allProduce=Array.isArray(data)?data:[];
populateLocations();
applyFilters();
}catch(error){
console.error("Marketplace error:",error);
grid.innerHTML='<div class="col-span-full text-center py-12 text-rose-400 text-sm">⚠️ Failed to connect to FastAPI server. Make sure the backend is running on http://127.0.0.1:8000</div>';
}
}
function populateLocations(){
const locationSelect=document.getElementById("locationSelect");
if(!locationSelect)return;
const oldValue=locationSelect.value;
const locations=[];
const defaultLocations=["Maharashtra","Punjab","Karnataka","Telangana","Andhra Pradesh"];
defaultLocations.forEach(function(location){
if(!locations.some(function(existing){
return existing.toLowerCase()===location.toLowerCase();
})){
locations.push(location);
}
});
allProduce.forEach(function(item){
const location=String(item.location||"").trim();
if(location&&!locations.some(function(existing){
return existing.toLowerCase()===location.toLowerCase();
})){
locations.push(location);
}
});
locations.sort(function(a,b){
return a.localeCompare(b);
});
locationSelect.innerHTML="";
const allOption=document.createElement("option");
allOption.value="";
allOption.textContent="All Locations";
locationSelect.appendChild(allOption);
locations.forEach(function(location){
const option=document.createElement("option");
option.value=location;
option.textContent=location;
locationSelect.appendChild(option);
});
if(oldValue){
const matchingOption=Array.from(locationSelect.options).find(function(option){
return option.value.toLowerCase()===oldValue.toLowerCase();
});
if(matchingOption)locationSelect.value=matchingOption.value;
}
}
function loadVoiceSearch(){
const params=new URLSearchParams(window.location.search);
const urlSearch=params.get("search");
const savedSearch=localStorage.getItem("farmDirectVoiceSearch");
const voiceSearch=(urlSearch||savedSearch||"").trim();
if(!voiceSearch)return;
const searchInput=document.getElementById("searchInput");
if(searchInput)searchInput.value=voiceSearch;
localStorage.removeItem("farmDirectVoiceSearch");
}
function applyFilters(){
const searchInput=document.getElementById("searchInput");
const locationSelect=document.getElementById("locationSelect");
const sortSelect=document.getElementById("sortSelect");
const searchTerm=searchInput?searchInput.value.trim().toLowerCase():"";
const selectedLocation=locationSelect?locationSelect.value.trim().toLowerCase():"";
filteredProduce=allProduce.filter(function(item){
const cropName=String(item.crop_name||"").toLowerCase();
const location=String(item.location||"").toLowerCase();
const searchMatch=!searchTerm||cropName.includes(searchTerm)||location.includes(searchTerm);
const locationMatch=!selectedLocation||location===selectedLocation;
return searchMatch&&locationMatch;
});
if(sortSelect){
if(sortSelect.value==="price_asc"){
filteredProduce.sort(function(a,b){
return Number(a.expected_price||0)-Number(b.expected_price||0);
});
}else if(sortSelect.value==="price_desc"){
filteredProduce.sort(function(a,b){
return Number(b.expected_price||0)-Number(a.expected_price||0);
});
}else if(sortSelect.value==="qty_desc"){
filteredProduce.sort(function(a,b){
return Number(b.quantity||0)-Number(a.quantity||0);
});
}else if(sortSelect.value==="newest"){
filteredProduce.sort(function(a,b){
return getDateValue(b)-getDateValue(a);
});
}
}
renderProduceGrid(filteredProduce);
}
function getDateValue(item){
const date=item.created_at||item.createdAt||item.submitted_at||item.submittedAt||item.id||0;
const parsed=Date.parse(date);
if(!Number.isNaN(parsed))return parsed;
return Number(date)||0;
}
function renderProduceGrid(items){
const grid=document.getElementById("marketplaceGrid");
if(!grid)return;
if(!items.length){
grid.innerHTML='<div class="col-span-full text-center py-12 text-slate-400 text-sm">No matching crops found.<br><a href="add-produce.html" class="text-emerald-400 underline">Add Produce</a></div>';
return;
}
grid.innerHTML=items.map(function(item,index){
const cropName=escapeHtml(item.crop_name||"Unknown Crop");
const quality=escapeHtml(item.quality_grade||"Grade A");
const quantity=Number(item.quantity||0);
const price=Number(item.expected_price||0);
const location=escapeHtml(item.location||"Regional Mandi");
const produceKey=item.id!==undefined&&item.id!==null?String(item.id):"index-"+index;
return `
<div class="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg flex flex-col justify-between hover:border-emerald-500/50 transition-all">
<div>
<div class="flex justify-between items-start mb-2">
<h3 class="font-bold text-slate-100 text-base">${cropName}</h3>
<span class="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">${quality}</span>
</div>
<p class="text-xs text-slate-400 mb-3">📍 ${location} • Direct Farmer Listing</p>
<div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 space-y-1 text-xs mb-4">
<div class="flex justify-between text-slate-300">
<span>Available Quantity:</span>
<strong class="text-slate-100">${quantity} Quintals</strong>
</div>
<div class="flex justify-between text-slate-300">
<span>Asking Price:</span>
<strong class="text-emerald-400">₹${price.toLocaleString("en-IN")} / Qtl</strong>
</div>
</div>
</div>
<div class="flex gap-2">
<button type="button" class="offer-button flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all" data-produce-key="${escapeHtml(produceKey)}">
Make Bidding Offer
</button>
<button type="button" class="details-button bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 border border-slate-600" data-produce-key="${escapeHtml(produceKey)}">
Details
</button>
</div>
</div>`;
}).join("");
document.querySelectorAll(".offer-button").forEach(function(button){
button.addEventListener("click",function(){
const item=findProduce(button.getAttribute("data-produce-key"));
if(item)openOfferModal(item);
});
});
document.querySelectorAll(".details-button").forEach(function(button){
button.addEventListener("click",function(){
const item=findProduce(button.getAttribute("data-produce-key"));
if(item)openDetailsModal(item);
});
});
}
function findProduce(key){
for(let i=0;i<filteredProduce.length;i++){
const item=filteredProduce[i];
const itemKey=item.id!==undefined&&item.id!==null?String(item.id):"index-"+i;
if(itemKey===key)return item;
}
for(let i=0;i<allProduce.length;i++){
const item=allProduce[i];
const itemKey=item.id!==undefined&&item.id!==null?String(item.id):"index-"+i;
if(itemKey===key)return item;
}
return null;
}
function openDetailsModal(item){
const modal=document.getElementById("detailsModal");
const title=document.getElementById("detailsTitle");
const content=document.getElementById("detailsContent");
if(!modal||!title||!content)return;
const cropName=String(item.crop_name||"Unknown Crop");
const quality=String(item.quality_grade||"Grade A");
const quantity=Number(item.quantity||0);
const price=Number(item.expected_price||0);
const location=String(item.location||"Regional Mandi");
title.textContent=cropName+" Details";
content.innerHTML=`
<div class="space-y-4 text-sm">
<div class="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
<div class="flex justify-between"><span class="text-slate-400">Crop</span><strong class="text-slate-100">${escapeHtml(cropName)}</strong></div>
<div class="flex justify-between"><span class="text-slate-400">Quality</span><strong class="text-emerald-400">${escapeHtml(quality)}</strong></div>
<div class="flex justify-between"><span class="text-slate-400">Available Quantity</span><strong class="text-slate-100">${quantity} Qtl</strong></div>
<div class="flex justify-between"><span class="text-slate-400">Expected Price</span><strong class="text-emerald-400">₹${price.toLocaleString("en-IN")} / Qtl</strong></div>
<div class="flex justify-between"><span class="text-slate-400">Location</span><strong class="text-slate-100">${escapeHtml(location)}</strong></div>
</div>
<button type="button" id="detailsMakeOfferBtn" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs">
MAKE BIDDING OFFER
</button>
</div>`;
modal.classList.remove("hidden");
modal.classList.add("flex");
const detailsMakeOfferBtn=document.getElementById("detailsMakeOfferBtn");
if(detailsMakeOfferBtn){
detailsMakeOfferBtn.addEventListener("click",function(){
closeDetailsModal();
openOfferModal(item);
});
}
}
function openOfferModal(item){
const modal=document.getElementById("offerModal");
const cropName=document.getElementById("offerCropName");
const cropInfo=document.getElementById("offerCropInfo");
const buyerName=document.getElementById("buyerName");
const offerPrice=document.getElementById("offerPrice");
const offerQuantity=document.getElementById("offerQuantity");
const offerStatus=document.getElementById("offerStatus");
if(!modal||!cropName||!cropInfo||!buyerName||!offerPrice||!offerQuantity)return;
selectedProduce=item;
const name=String(item.crop_name||"Unknown Crop");
const price=Number(item.expected_price||0);
const quantity=Number(item.quantity||0);
const location=String(item.location||"Regional Mandi");
cropName.textContent=name;
cropInfo.textContent="Available: "+quantity+" Qtl • Asking Price: ₹"+price.toLocaleString("en-IN")+" / Qtl • "+location;
buyerName.value="";
offerPrice.value="";
offerQuantity.value=quantity>0?quantity:"";
offerStatus.textContent="";
offerStatus.className="text-xs text-center";
modal.classList.remove("hidden");
modal.classList.add("flex");
setTimeout(function(){
offerPrice.focus();
},100);
}
function closeDetailsModal(){
const modal=document.getElementById("detailsModal");
if(modal){
modal.classList.add("hidden");
modal.classList.remove("flex");
}
}
function closeOfferModal(){
const modal=document.getElementById("offerModal");
if(modal){
modal.classList.add("hidden");
modal.classList.remove("flex");
}
selectedProduce=null;
}
function submitOffer(event){
event.preventDefault();
const buyerNameInput=document.getElementById("buyerName");
const offerPriceInput=document.getElementById("offerPrice");
const offerQuantityInput=document.getElementById("offerQuantity");
const offerStatus=document.getElementById("offerStatus");
if(!buyerNameInput||!offerPriceInput||!offerQuantityInput||!offerStatus)return;
const buyerName=buyerNameInput.value.trim();
const priceText=offerPriceInput.value.trim();
const quantityText=offerQuantityInput.value.trim();
const offerPrice=offerPriceInput.valueAsNumber;
const offerQuantity=offerQuantityInput.valueAsNumber;
const availableQuantity=selectedProduce?Number(selectedProduce.quantity||0):0;
if(!buyerName){
offerStatus.textContent="Please enter buyer name.";
offerStatus.className="text-xs text-center text-rose-400";
return;
}
if(priceText===""||Number.isNaN(offerPrice)||!Number.isFinite(offerPrice)||offerPrice<=0){
offerStatus.textContent="Please enter a valid offer price.";
offerStatus.className="text-xs text-center text-rose-400";
return;
}
if(quantityText===""||Number.isNaN(offerQuantity)||!Number.isFinite(offerQuantity)||offerQuantity<=0){
offerStatus.textContent="Please enter a valid quantity.";
offerStatus.className="text-xs text-center text-rose-400";
return;
}
if(availableQuantity>0&&offerQuantity>availableQuantity){
offerStatus.textContent="Requested quantity is more than available quantity.";
offerStatus.className="text-xs text-center text-rose-400";
return;
}
const existingOffers=localStorage.getItem("farmDirectOffers");
let offers=[];
try{
offers=existingOffers?JSON.parse(existingOffers):[];
if(!Array.isArray(offers))offers=[];
}catch(error){
offers=[];
}
const now=new Date().toISOString();
offers.push({
id:Date.now().toString(),
produce_id:selectedProduce&&selectedProduce.id!==undefined?selectedProduce.id:null,
crop_name:selectedProduce?selectedProduce.crop_name:"",
cropName:selectedProduce?selectedProduce.crop_name:"",
farmer_location:selectedProduce?selectedProduce.location:"",
buyer_name:buyerName,
buyerName:buyerName,
offer_price:offerPrice,
offerPrice:offerPrice,
quantity:offerQuantity,
submitted_at:now,
submittedAt:now,
status:"Pending"
});
localStorage.setItem("farmDirectOffers",JSON.stringify(offers));
offerStatus.textContent="Bidding offer submitted successfully!";
offerStatus.className="text-xs text-center text-emerald-400";
setTimeout(function(){
closeOfferModal();
},1200);
}
function escapeHtml(value){
return String(value)
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}