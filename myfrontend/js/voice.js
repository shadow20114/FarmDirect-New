document.addEventListener("DOMContentLoaded",function(){
const languageSelect=document.querySelector("select");
const voiceButton=document.querySelector("button");
const speechDisplay=document.querySelector(".text-emerald-400.font-semibold.text-sm");
const statusDisplay=document.querySelector("main p.text-xs.text-slate-400.mt-3");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const languages={
"English":"en-IN",
"हिंदी (Hindi)":"hi-IN",
"मराठी (Marathi)":"mr-IN",
"ਪੰਜਾਬੀ (Punjabi)":"pa-IN",
"తెలుగు (Telugu)":"te-IN"
};
if(!voiceButton)return;
if(!SpeechRecognition){
if(statusDisplay)statusDisplay.textContent="Voice recognition is not supported. Please use Google Chrome.";
return;
}
let recognition=null;
let listening=false;
function setStatus(message){
if(statusDisplay)statusDisplay.textContent=message;
}
function setButton(active){
if(active){
voiceButton.textContent="⏹️";
voiceButton.style.backgroundColor="#ef4444";
voiceButton.style.animation="none";
}else{
voiceButton.textContent="🎙️";
voiceButton.style.backgroundColor="";
voiceButton.style.animation="";
}
}
function getLanguage(){
return languages[languageSelect?.value]||"en-IN";
}
function includesWord(text,words){
return words.some(word=>text.includes(word));
}
async function openProduce(crop){
try{
setStatus("Searching FarmDirect produce...");
const response=await fetch("http://127.0.0.1:8000/api/produce/list");
if(!response.ok)throw new Error("Could not load produce.");
const items=await response.json();
const matches=items.filter(item=>(item.crop_name||"").toLowerCase().includes(crop.toLowerCase()));
if(matches.length===0){
setStatus(`No ${crop} produce is currently listed.`);
setTimeout(function(){
window.location.href="buyer-dashboard.html";
},1200);
return;
}
localStorage.setItem("farmDirectVoiceSearch",crop);
window.location.href="buyer-dashboard.html?search="+encodeURIComponent(crop);
}catch(error){
console.error("Produce search error:",error);
localStorage.setItem("farmDirectVoiceSearch",crop);
window.location.href="buyer-dashboard.html?search="+encodeURIComponent(crop);
}
}
function handleCommand(text){
const tomatoWords=["tomato","tomatoes","टमाटर","टमाटर की","टोमॅटो","टोमॅटोचा","ਟਮਾਟਰ","ਟਮਾਟਰਾਂ","టమాటా","టమోటా","టొమాటో","టమాటాలు"];
const wheatWords=["wheat","गेहूं","गहू","ਗੇਹੂੰ","ਗੇਹੂੰ","గోధుమ","గోధుమలు"];
const riceWords=["rice","चावल","तांदूळ","ਚਾਵਲ","ਚੌਲ","బియ్యం","బియ్యము"];
const buyerWords=["show","find","search","view","list","produce","crop","दिखाओ","दिखा","खोजो","देखो","फसल","माल","दाखवा","शोधा","ਪੀਖੋ","ਦਿਖਾਓ","వెతుకు","చూపించు","చూపించండి","పంట"];
const priceWords=["price","prices","market price","mandi","मंडी","भाव","कीमत","किंमत","ਮੰਡੀ","ਮੁੱਲ","ధర","మార్కెట్","మండి"];
if(includesWord(text,tomatoWords)){
openProduce("tomato");
return;
}
if(includesWord(text,wheatWords)){
openProduce("wheat");
return;
}
if(includesWord(text,riceWords)){
openProduce("rice");
return;
}
if(includesWord(text,priceWords)){
window.location.href="ai-page.html";
return;
}
if(includesWord(text,buyerWords)){
window.location.href="buyer-dashboard.html";
return;
}
setStatus("Speech recognized, but I could not find a FarmDirect command.");
}
function createRecognition(){
const r=new SpeechRecognition();
r.lang=getLanguage();
r.continuous=false;
r.interimResults=false;
r.maxAlternatives=3;
r.onstart=function(){
listening=true;
setButton(true);
setStatus("Listening... Speak now.");
};
r.onspeechstart=function(){
setStatus("Speech detected. Processing...");
};
r.onresult=function(event){
let text="";
for(let i=0;i<event.results.length;i++){
text+=event.results[i][0].transcript+" ";
}
text=text.trim();
console.log("Recognized speech:",text);
if(speechDisplay)speechDisplay.textContent='"'+text+'"';
if(!text){
setStatus("Could not recognize speech. Please try again.");
return;
}
setStatus("Command recognized.");
handleCommand(text.toLowerCase());
};
r.onerror=function(event){
console.error("Voice error:",event.error);
if(event.error==="not-allowed"||event.error==="service-not-allowed"){
setStatus("Microphone permission denied. Allow microphone access in Chrome.");
}else if(event.error==="audio-capture"){
setStatus("No microphone detected. Check your microphone.");
}else if(event.error==="no-speech"){
setStatus("No speech detected. Please speak after pressing the microphone.");
}else if(event.error==="network"){
setStatus("Speech service connection failed. Check your internet.");
}else{
setStatus("Could not recognize speech. Please try again.");
}
};
r.onend=function(){
listening=false;
setButton(false);
};
return r;
}
voiceButton.addEventListener("click",function(){
if(listening){
if(recognition){
try{recognition.stop();}catch(error){}
}
return;
}
recognition=createRecognition();
try{
recognition.start();
}catch(error){
console.error("Recognition start error:",error);
setStatus("Could not start voice recognition. Please try again.");
}
});
if(languageSelect){
languageSelect.addEventListener("change",function(){
if(listening&&recognition){
try{recognition.stop();}catch(error){}
}
setStatus("Language changed. Press the microphone and speak.");
});
}
setButton(false);
setStatus("Click and speak. Example: \"show tomatoes\"");
});