document.addEventListener("DOMContentLoaded",function(){
const grossRevenue=250000;
const transportCost=4800;
const platformFee=2400;
const totalDeductions=transportCost+platformFee;
const netPayout=grossRevenue-totalDeductions;
const grossElement=document.getElementById("grossRevenue");
const deductionElement=document.getElementById("totalDeductions");
const payoutElement=document.getElementById("netPayout");
const receiptPayoutElement=document.getElementById("receiptNetPayout");
if(grossElement)grossElement.textContent="₹"+grossRevenue.toLocaleString("en-IN");
if(deductionElement)deductionElement.textContent="₹"+totalDeductions.toLocaleString("en-IN");
if(payoutElement)payoutElement.textContent="₹"+netPayout.toLocaleString("en-IN");
if(receiptPayoutElement)receiptPayoutElement.textContent="₹"+netPayout.toLocaleString("en-IN");
});