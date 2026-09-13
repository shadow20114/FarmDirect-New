document.addEventListener("DOMContentLoaded",function(){
const page=location.pathname.split("/").pop()||"index.html";
const user=getUser();
const protectedRoles={"add-produce.html":"FARMER","farmer-dashboard.html":"FARMER","earnings-page.html":"FARMER","ai-page.html":"FARMER","buyer-dashboard.html":"BUYER","orders.html":"BUYER","fpo-page.html":"FPO"};
const requiredRole=protectedRoles[page];
if(requiredRole){
if(!user){location.href="login.html?next="+encodeURIComponent(page);return;}
if(user.role!==requiredRole){alert("This page is for "+requiredRole+" users. Your account is "+user.role+".");location.href="index.html";return;}
}
document.querySelectorAll("[data-logout]").forEach(btn=>btn.addEventListener("click",logout));
const nav=document.querySelector("[data-auth-nav]");
if(nav){
if(user){nav.innerHTML=`<span class="text-xs text-emerald-400">${escapeAuth(user.name||"User")} • ${escapeAuth(user.role||"")}</span><a href="profile.html" class="text-xs text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg">Profile</a><button data-logout class="text-xs text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg">Logout</button>`;}else{nav.innerHTML='<a href="login.html" class="text-xs text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg">Login</a><a href="register.html" class="text-xs text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg">Register</a>';}
nav.querySelector("[data-logout]")?.addEventListener("click",logout);
}
const loginForm=document.getElementById("loginForm");
if(loginForm){
const status=document.getElementById("loginStatus");
const btn=document.getElementById("loginBtn");
const phoneInput=document.getElementById("phone");
const passwordInput=document.getElementById("password");
loginForm.addEventListener("submit",async function(e){
e.preventDefault();
if(btn)btn.disabled=true;
if(status){status.textContent="Logging in...";status.className="text-xs text-center text-slate-400";}
try{
const data=await apiPost("/auth/login",{phone:phoneInput.value.trim(),password:passwordInput.value});
setAuthSession(data);
const next=new URLSearchParams(window.location.search).get("next");
window.location.href=next||({"FARMER":"farmer-dashboard.html","BUYER":"buyer-dashboard.html","FPO":"fpo-page.html"}[data.user.role]||"index.html");
}catch(err){
if(status){status.textContent=err.message;status.className="text-xs text-center text-rose-400";}
}finally{if(btn)btn.disabled=false;}
});
}
const registerForm=document.getElementById("registerForm");
if(registerForm){
const status=document.getElementById("registerStatus");
const btn=document.getElementById("registerBtn");
const nameInput=document.getElementById("name");
const phoneInput=document.getElementById("phone");
const passwordInput=document.getElementById("password");
const roleInput=document.getElementById("role");
const locationInput=document.getElementById("location");
const languageInput=document.getElementById("language");
registerForm.addEventListener("submit",async function(e){
e.preventDefault();
if(btn)btn.disabled=true;
if(status){status.textContent="Creating account...";status.className="text-xs text-center text-slate-400";}
try{
const name=nameInput.value.trim();
const phone=phoneInput.value.trim();
const password=passwordInput.value;
const role=roleInput.value;
const location=locationInput.value.trim();
const language=languageInput.value;
if(name.length<2)throw new Error("Name must contain at least 2 characters.");
if(phone.length<5)throw new Error("Enter a valid phone number.");
if(password.length<4)throw new Error("Password must contain at least 4 characters.");
if(!role)throw new Error("Please select a role.");
const data=await apiPost("/auth/register",{name,phone,password,role,location,language});
if(status){status.textContent=data.message||"Registration successful. Redirecting to login...";status.className="text-xs text-center text-emerald-400";}
setTimeout(()=>window.location.href="login.html",900);
}catch(err){
if(status){status.textContent=err.message;status.className="text-xs text-center text-rose-400";}
}finally{if(btn)btn.disabled=false;}
});
}
});
async function logout(){try{if(getToken())await apiPost("/auth/logout");}catch(e){console.warn(e);}finally{clearAuthSession();location.href="login.html";}}
function escapeAuth(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
