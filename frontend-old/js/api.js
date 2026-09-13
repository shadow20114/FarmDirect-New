const API_BASE_URL="http://127.0.0.1:8000";
async function apiGet(endpoint){
const response=await fetch(API_BASE_URL+endpoint);
if(!response.ok)throw new Error("API request failed");
return await response.json();
}
async function apiPost(endpoint,data){
const response=await fetch(API_BASE_URL+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
if(!response.ok)throw new Error("API request failed");
return await response.json();
}