const $=s=>document.querySelector(s);
const bootLines=["INITIALIZING SYSTEM...","CHECKING VISUAL ENGINE...","LOADING INTERACTION LAYER...","ESTABLISHING NEXUS...","SYSTEM READY."];
let p=0,i=0;
const bootTimer=setInterval(()=>{p+=4;$("#progressBar").style.width=p+"%";if(p%20===0){$("#bootText").textContent=bootLines[Math.min(i++,bootLines.length-1)]}if(p>=100){clearInterval(bootTimer);setTimeout(()=>{$("#boot").classList.add("hidden");$("#app").classList.remove("hidden")},350)}},90);

function openWindow(id){document.getElementById(id).classList.add("open");if(id==="terminal")setTimeout(()=>$("#command").focus(),100)}
function closeWindow(id){document.getElementById(id).classList.remove("open")}
function toggleTheme(){document.body.classList.toggle("light")}
function updateClock(){$("#clock").textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}
setInterval(updateClock,1000);updateClock();

document.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="t"&&document.activeElement.tagName!=="INPUT")openWindow("terminal");if(e.key==="Escape")document.querySelectorAll(".window.open").forEach(w=>w.classList.remove("open"))});

const commands={
 help:`Available commands:
  help       show this list
  about      open system info
  lab        open signal lab
  game       open reaction test
  theme      toggle light/dark mode
  time       show local time
  clear      clear terminal
  matrix     print a secret pattern
  whoami     identify current user
  exit       close terminal`,
 about:"NEXUS is a browser-only interactive Web OS.",
 whoami:"guest@nexus — explorer mode",
 matrix:"101001 010110 110001 001101 011010",
};
$("#command").addEventListener("keydown",e=>{
 if(e.key!=="Enter")return;
 const v=e.target.value.trim().toLowerCase();e.target.value="";
 if(!v)return;
 $("#output").innerHTML+=`<br><span style="color:#7dd3fc">guest@nexus:~$ ${v}</span><br>`;
 if(v==="clear"){$("#output").innerHTML="";return}
 if(v==="about")openWindow("about");
 else if(v==="lab")openWindow("lab");
 else if(v==="game")openWindow("game");
 else if(v==="theme")toggleTheme();
 else if(v==="time")$("#output").innerHTML+=new Date().toString()+"<br>";
 else if(v==="exit")closeWindow("terminal");
 else $("#output").innerHTML+=(commands[v]||"Command not found. Type help.")+"<br>";
});

function labUpdate(){const a=$("#signal").value,b=$("#speed").value;$("#labReadout").textContent=`SIGNAL: ${a}% // SPEED: ${b}%`}
$("#signal").addEventListener("input",labUpdate);$("#speed").addEventListener("input",labUpdate);
function randomSignal(){$("#signal").value=Math.floor(Math.random()*101);$("#speed").value=Math.floor(Math.random()*101);labUpdate()}

const canvas=$("#space"),ctx=canvas.getContext("2d");let stars=[];
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);stars=Array.from({length:90},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.5+.2,v:Math.random()*.25+.05}))}
function animate(){ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle=getComputedStyle(document.body).backgroundColor;stars.forEach(s=>{s.y+=s.v;if(s.y>innerHeight)s.y=0;ctx.globalAlpha=.25+s.r/2;ctx.fillStyle="#9db7dd";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(animate)}
addEventListener("resize",resize);resize();animate();

let reactionState="idle",startTime=0,best=localStorage.nexusBest?Number(localStorage.nexusBest):null;
if(best)$("#score").textContent="Best: "+best+" ms";
$("#reaction").onclick=()=>{
 if(reactionState==="idle"){reactionState="waiting";$("#reaction").textContent="WAIT...";$("#reaction").classList.remove("ready");setTimeout(()=>{reactionState="ready";startTime=performance.now();$("#reaction").textContent="TAP NOW";$("#reaction").classList.add("ready")},900+Math.random()*2200)}
 else if(reactionState==="waiting"){reactionState="idle";$("#reaction").textContent="TOO EARLY — TRY AGAIN"}
 else {const ms=Math.round(performance.now()-startTime);reactionState="idle";$("#reaction").textContent=ms+" ms — AGAIN";$("#reaction").classList.remove("ready");if(!best||ms<best){best=ms;localStorage.nexusBest=ms;$("#score").textContent="Best: "+ms+" ms"}}
};
