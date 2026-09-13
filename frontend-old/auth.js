const API="http://127.0.0.1:8000";

function formatError(data){
if(!data)return"Something went wrong.";
if(typeof data==="string")return data;
if(Array.isArray(data.detail)){
return data.detail.map(item=>{
if(typeof item==="string")return item;
return item.msg||"Validation error";
}).join(", ");
}
if(typeof data.detail==="string")return data.detail;
if(typeof data.message==="string")return data.message;
return"Request failed.";
}

function showMessage(text,success=false){
const message=document.getElementById("message");
if(!message)return;
message.textContent=String(text);
message.className=success
?"text-center text-sm mt-4 text-emerald-400"
:"text-center text-sm mt-4 text-rose-400";
}

function getDashboard(role){
if(role==="FARMER")return"farmer-dashboard.html";
if(role==="BUYER")return"buyer-dashboard.html";
if(role==="FPO")return"fpo-page.html";
return"index.html";
}

const loginForm=document.getElementById("loginForm");

if(loginForm){
loginForm.addEventListener("submit",async function(event){
event.preventDefault();
showMessage("Logging in...",true);
try{
const response=await fetch(API+"/api/auth/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
phone:document.getElementById("phone").value.trim(),
password:document.getElementById("password").value
})
});
const data=await response.json();
if(!response.ok){
throw new Error(formatError(data));
}
if(!data.access_token||!data.user){
throw new Error("Login response is incomplete.");
}
localStorage.setItem("farmDirectToken",data.access_token);
localStorage.setItem("farmDirectUser",JSON.stringify(data.user));
showMessage("Login successful. Opening dashboard...",true);
setTimeout(function(){
window.location.href=getDashboard(data.user.role);
},700);
}catch(error){
console.error("Login error:",error);
showMessage(error.message||"Login failed.");
}
});
}

const registerForm=document.getElementById("registerForm");

if(registerForm){
registerForm.addEventListener("submit",async function(event){
event.preventDefault();
showMessage("Creating account...",true);
try{
const name=document.getElementById("name").value.trim();
const phone=document.getElementById("phone").value.trim();
const password=document.getElementById("password").value;
const role=document.getElementById("role").value;
const location=document.getElementById("location").value.trim();
const language=document.getElementById("language").value;

if(name.length<2){
throw new Error("Name must contain at least 2 characters.");
}
if(phone.length<5){
throw new Error("Enter a valid phone number.");
}
if(password.length<4){
throw new Error("Password must contain at least 4 characters.");
}

const response=await fetch(API+"/api/auth/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
name:name,
phone:phone,
password:password,
role:role,
location:location,
language:language
})
});

const data=await response.json();

if(!response.ok){
throw new Error(formatError(data));
}

showMessage("Registration successful. Opening login...",true);

setTimeout(function(){
window.location.href="login.html";
},800);

}catch(error){
console.error("Registration error:",error);
showMessage(error.message||"Registration failed.");
}
});
}