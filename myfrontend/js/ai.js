document.addEventListener("DOMContentLoaded",function(){
const cropSelect=document.getElementById("cropSelect");
const runAnalysisBtn=document.getElementById("runAnalysisBtn");
const recommendedPrice=document.getElementById("recommendedPrice");
const priceMessage=document.getElementById("priceMessage");
const mandiRate=document.getElementById("mandiRate");
const aiTargetRate=document.getElementById("aiTargetRate");
const demandValue=document.getElementById("demandValue");
const demandMessage=document.getElementById("demandMessage");
const retailRate=document.getElementById("retailRate");
const priceTrend=document.getElementById("priceTrend");
const sellingPeriod=document.getElementById("sellingPeriod");
const buyerMatches=document.getElementById("buyerMatches");
const analysisText=document.getElementById("analysisText");
let produceItems=[];
if(!cropSelect)return;
async function loadProduce(){
try{
const response=await fetch("http://127.0.0.1:8000/api/produce/list");
if(!response.ok)throw new Error("Backend error");
produceItems=await response.json();
if(!produceItems.length){
cropSelect.innerHTML='<option value="">No published produce available</option>';
if(priceMessage)priceMessage.textContent="Publish produce from Farmer Dashboard first.";
return;
}
cropSelect.innerHTML=produceItems.map((item,index)=>`<option value="${index}">${item.crop_name} — ${item.location||"Location not specified"}</option>`).join("");
const params=new URLSearchParams(window.location.search);
const requestedCrop=params.get("crop");
if(requestedCrop){
const match=produceItems.findIndex(item=>item.crop_name.toLowerCase()===requestedCrop.toLowerCase());
if(match>=0)cropSelect.value=String(match);
}
await updateAIPrediction();
}catch(error){
console.error("AI loading error:",error);
cropSelect.innerHTML='<option value="">Unable to load produce</option>';
if(priceMessage)priceMessage.textContent="Could not load published produce.";
}
}
async function updateAIPrediction(){
if(!produceItems.length)return;
const item=produceItems[Number(cropSelect.value)];
if(!item)return;
if(priceMessage)priceMessage.textContent="Calculating AI recommendation...";
const quantity=Number(item.quantity);
const baseline=Number(item.expected_price);
const demand=Math.max(45,Math.min(95,Math.round(90-(quantity/20))));
try{
const url=`http://127.0.0.1:8000/api/ai/price-predict?crop=${encodeURIComponent(item.crop_name)}&baseline=${baseline}&demand=${demand}&quantity=${quantity}`;
const response=await fetch(url);
if(!response.ok)throw new Error("AI backend error");
const data=await response.json();
const price=Number(data.recommended_price);
const retail=Number(data.retail_rate);
const base=Number(data.mandi_baseline);
const change=Number(data.price_change_percentage);
if(recommendedPrice)recommendedPrice.innerHTML=`₹${price.toLocaleString("en-IN")} <span class="text-xs text-slate-400 font-normal">/ Qtl</span>`;
if(priceMessage)priceMessage.textContent="AI recommended price";
if(mandiRate)mandiRate.textContent=`₹${base.toLocaleString("en-IN")} / Qtl`;
if(aiTargetRate)aiTargetRate.textContent=`₹${price.toLocaleString("en-IN")} / Qtl`;
if(retailRate)retailRate.textContent=`₹${retail.toLocaleString("en-IN")} / Qtl`;
if(demandValue)demandValue.textContent=`${data.demand_level}`;
if(demandMessage)demandMessage.textContent=`Demand index: ${data.demand_index}`;
if(priceTrend)priceTrend.textContent=`AI target is ${change>=0?"+":""}${change}% compared with the current listing price.`;
if(data.demand_level==="HIGH")sellingPeriod.textContent="Next 3–7 Days";
else if(data.demand_level==="MEDIUM")sellingPeriod.textContent="Next 7–14 Days";
else sellingPeriod.textContent="Review after 2–3 Weeks";
if(data.demand_level==="HIGH")buyerMatches.textContent="High";
else if(data.demand_level==="MEDIUM")buyerMatches.textContent="Medium";
else buyerMatches.textContent="Low";
if(analysisText)analysisText.textContent=`For ${item.crop_name}, the current farmer listing is ${quantity} Qtl at ₹${baseline.toLocaleString("en-IN")} per quintal from ${item.location||"the selected location"}. The AI engine combines the listing baseline, quantity and estimated demand index to calculate a recommended target price of ₹${price.toLocaleString("en-IN")} per quintal.`;
}catch(error){
console.error("AI prediction error:",error);
const fallback=baseline*1.03;
if(recommendedPrice)recommendedPrice.innerHTML=`₹${fallback.toLocaleString("en-IN")} <span class="text-xs text-slate-400 font-normal">/ Qtl</span>`;
if(priceMessage)priceMessage.textContent="Estimated AI recommendation";
if(mandiRate)mandiRate.textContent=`₹${baseline.toLocaleString("en-IN")} / Qtl`;
if(aiTargetRate)aiTargetRate.textContent=`₹${fallback.toLocaleString("en-IN")} / Qtl`;
if(retailRate)retailRate.textContent=`₹${(fallback*1.15).toLocaleString("en-IN")} / Qtl`;
if(demandValue)demandValue.textContent="MEDIUM";
if(demandMessage)demandMessage.textContent=`Estimated demand index: ${demand}/100`;
if(sellingPeriod)sellingPeriod.textContent="Next 7–14 Days";
if(buyerMatches)buyerMatches.textContent="Medium";
if(analysisText)analysisText.textContent=`The backend AI model could not be reached, so an estimated recommendation is being displayed for ${item.crop_name}.`;
}
}
cropSelect.addEventListener("change",updateAIPrediction);
if(runAnalysisBtn)runAnalysisBtn.addEventListener("click",updateAIPrediction);
loadProduce();
});