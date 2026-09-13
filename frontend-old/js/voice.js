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
const cropAliases={
tomato:[
"tomato","tomatoes","टमाटर","टमाटरों","टमाटर की","टोमॅटो","टोमॅटोचा","टोमॅटोचे","ਟਮਾਟਰ","ਟਮਾਟਰਾਂ","ਟਮਾਟਰ ਦਾ","టమాటా","టమాటాలు","టమోటా","టొమాటో","టొమాటాలు","టమోటాలు"
],
wheat:[
"wheat","गेहूं","गेहू","गहू","गव्हाचा","ਗੇਹੂੰ","ਗੇਹੂ","ਗੇਹੂੰ ਦਾ","గోధుమ","గోధుమలు","గోధుమల"
],
rice:[
"rice","चावल","चांवल","तांदूळ","ਭਾਤ","ਚਾਵਲ","ਚੌਲ","బియ్యం","బియ్యము"
]
};
const priceWords=[
"price","prices","market price","mandi","मंडी","भाव","कीमत","किंमत","मंडी भाव","ਮੰਡੀ","ਮੁੱਲ","ਮੰਡੀ ਭਾਵ","ధర","మార్కెట్","మండి","మార్కెట్ ధర"
];
const buyerWords=[
"show","find","search","view","list","produce","crop",
"दिखाओ","दिखा","खोजो","देखो","फसल","माल","दाखवा","शोधा",
"ਦਿਖਾਓ","ਵੇਖੋ","ਖੋਜੋ","ਫਸਲ",
"వెతుకు","చూపించు","చూపించండి","పంట","చూడండి","వెతకండి"
];
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
function normalizeText(text){
return String(text||"").toLowerCase().trim().replace(/\s+/g," ");
}
function includesAny(text,words){
const value=normalizeText(text);
return words.some(word=>value.includes(normalizeText(word)));
}
function getCrop(text){
const value=normalizeText(text);
if(includesAny(value,cropAliases.tomato))return "tomato";
if(includesAny(value,cropAliases.wheat))return "wheat";
if(includesAny(value,cropAliases.rice))return "rice";
return null;
}
async function openProduce(crop){
try{
setStatus("Searching FarmDirect produce...");
const response=await fetch("http://127.0.0.1:8000/api/produce/list");
if(!response.ok)throw new Error("Could not load produce.");
const items=await response.json();
const matches=items.filter(item=>normalizeText(item.crop_name).includes(normalizeText(crop)));
if(matches.length===0){
setStatus(`No ${crop} produce is currently listed.`);
localStorage.removeItem("farmDirectVoiceSearch");
setTimeout(function(){
window.location.href="buyer-dashboard.html";
},1200);
return;
}
localStorage.setItem("farmDirectVoiceSearch",crop);
localStorage.setItem("farmDirectVoiceCommand","true");
window.location.href="buyer-dashboard.html?search="+encodeURIComponent(crop);
}catch(error){
console.error("Produce search error:",error);
localStorage.setItem("farmDirectVoiceSearch",crop);
localStorage.setItem("farmDirectVoiceCommand","true");
window.location.href="buyer-dashboard.html?search="+encodeURIComponent(crop);
}
}
function handleCommand(text){
const value=normalizeText(text);
const crop=getCrop(value);
if(crop){
openProduce(crop);
return;
}
if(includesAny(value,priceWords)){
window.location.href="ai-page.html";
return;
}
if(includesAny(value,buyerWords)){
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
r.maxAlternatives=5;
r.onstart=function(){
listening=true;
setButton(true);
setStatus("Listening... Speak now.");
};
r.onspeechstart=function(){
setStatus("Speech detected. Processing...");
};
r.onresult=function(event){
let transcripts=[];
for(let i=0;i<event.results.length;i++){
for(let j=0;j<event.results[i].length;j++){
const transcript=event.results[i][j].transcript;
if(transcript)transcripts.push(transcript);
}
}
const text=transcripts.join(" ").trim();
console.log("Recognized speech:",text);
if(speechDisplay)speechDisplay.textContent='"'+text+'"';
if(!text){
setStatus("Could not recognize speech. Please try again.");
return;
}
setStatus("Command recognized.");
handleCommand(text);
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
setStatus('Click and speak. Example: "show tomatoes"');
});