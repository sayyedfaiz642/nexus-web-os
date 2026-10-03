// NEXUS Web OS — Termux-style browser shell
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const boot = $("#boot"), bootBar = $("#bootBar"), bootText = $("#bootText");
let bootProgress = 0;
const bootTimer = setInterval(() => {
  bootProgress += Math.floor(Math.random()*13)+5;
  if (bootProgress >= 100) {
    bootProgress = 100; clearInterval(bootTimer);
    bootText.textContent = "SYSTEM READY";
    setTimeout(() => { boot.style.opacity = "0"; setTimeout(()=>boot.remove(),650); }, 350);
  }
  bootBar.style.width = bootProgress + "%";
}, 120);

// Starfield
const canvas = $("#stars"), ctx = canvas.getContext("2d");
let stars = [];
function resizeStars(){
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth+"px"; canvas.style.height = innerHeight+"px";
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  stars = Array.from({length: Math.min(180, Math.floor(innerWidth/6))}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    r: Math.random()*1.4+.2, s: Math.random()*.35+.08
  }));
}
function drawStars(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const s of stars){
    s.y += s.s; if(s.y>innerHeight) {s.y=0;s.x=Math.random()*innerWidth}
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle = "rgba(150,220,255,.65)"; ctx.fill();
  }
  requestAnimationFrame(drawStars);
}
addEventListener("resize", resizeStars); resizeStars(); drawStars();

// Windows
const ids = {about:"aboutWindow",terminal:"terminalWindow",lab:"labWindow",game:"gameWindow"};
function openWindow(name){
  Object.values(ids).forEach(id => $("#"+id).classList.add("hidden"));
  $("#"+ids[name]).classList.remove("hidden");
  if(name==="terminal") setTimeout(()=>$("#terminalInput").focus(),50);
}
function closeWindow(id){ $("#"+id).classList.add("hidden"); }
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>openWindow(b.dataset.open)));
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>closeWindow(b.dataset.close)));
addEventListener("keydown", e => {
  if(e.key.toLowerCase()==="t" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) openWindow("terminal");
  if(e.key==="Escape") $$(".window").forEach(w=>w.classList.add("hidden"));
});

// Theme
$("#themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("light");
  localStorage.setItem("nexus-theme",document.body.classList.contains("light")?"light":"dark");
});
if(localStorage.getItem("nexus-theme")==="light") document.body.classList.add("light");

// Signal Lab
function updateSignal(){
  const a=+$("#signalSlider").value,b=+$("#speedSlider").value;
  $("#signalValue").textContent=a+"%"; $("#signalText").textContent=a+"%";
  $("#speedValue").textContent=b+"%"; $("#speedText").textContent=b+"%";
  document.documentElement.style.setProperty("--signal",a/100);
}
$("#signalSlider").addEventListener("input",updateSignal);
$("#speedSlider").addEventListener("input",updateSignal);
$("#randomSignal").addEventListener("click",()=>{
  $("#signalSlider").value=Math.floor(Math.random()*101);
  $("#speedSlider").value=Math.floor(Math.random()*101); updateSignal();
  toast("Random signal generated");
});
updateSignal();

// Reaction game
let reactionTimer=null, startTime=0, gameActive=false;
$("#gameStart").addEventListener("click",()=>{
  const box=$("#reactionBox"); gameActive=false; box.className="reaction-box wait"; box.textContent="WAIT...";
  $("#reactionResult").textContent="— ms";
  clearTimeout(reactionTimer);
  reactionTimer=setTimeout(()=>{
    gameActive=true; startTime=performance.now(); box.className="reaction-box go"; box.textContent="TAP!";
  }, 900+Math.random()*3000);
});
$("#reactionBox").addEventListener("click",()=>{
  if(!gameActive) return;
  const ms=Math.round(performance.now()-startTime); gameActive=false;
  $("#reactionBox").className="reaction-box"; $("#reactionBox").textContent="DONE";
  $("#reactionResult").textContent=ms+" ms";
});

// Toast
let toastTimer;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),1800);
}

// ---------------- Browser Termux ----------------
const out=$("#terminalOutput"), input=$("#terminalInput");
const history=[], fs={
  "/home/guest":{type:"dir"},
  "/home/guest/about.txt":{type:"file",content:"NEXUS — Interactive Web OS\\nA browser-based futuristic interface."},
  "/home/guest/nexus.config":{type:"file",content:"mode=browser\\nuser=guest\\nserver=none"},
  "/home/guest/projects":{type:"dir"},
  "/home/guest/downloads":{type:"dir"}
};
let cwd="/home/guest";

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function print(text="", cls=""){
  const div=document.createElement("div"); if(cls) div.className=cls;
  div.innerHTML=esc(text).replace(/\\n/g,"<br>"); out.appendChild(div); out.scrollTop=out.scrollHeight;
}
function printHTML(html,cls=""){const d=document.createElement("div");if(cls)d.className=cls;d.innerHTML=html;out.appendChild(d);out.scrollTop=out.scrollHeight;}
function normalizePath(p){
  if(!p || p==="~") return "/home/guest";
  if(p.startsWith("~/")) p="/home/guest/"+p.slice(2);
  else if(!p.startsWith("/")) p=cwd+"/"+p;
  const parts=[];
  for(const x of p.split("/")){ if(!x||x===".")continue; if(x==="..")parts.pop(); else parts.push(x); }
  return "/"+parts.join("/");
}
function displayPath(){return cwd==="/home/guest"?"~": "~"+cwd.slice("/home/guest".length);}
function children(dir){
  const prefix=dir.endsWith("/")?dir:dir+"/", names=[];
  Object.keys(fs).forEach(k=>{
    if(k.startsWith(prefix)){
      const rest=k.slice(prefix.length);
      if(rest && !rest.includes("/")) names.push(rest+(fs[k].type==="dir"?"/":""));
    }
  }); return names.sort();
}
function commandLine(raw){
  const cmd=raw.trim(); if(!cmd)return;
  history.push(cmd);
  print(`guest@nexus:${displayPath()}$ ${cmd}`,"cmd");
  runCommand(cmd);
}
function runCommand(raw){
  const parts=raw.match(/"[^"]*"|'[^']*'|\\S+/g)||[];
  const cmd=(parts.shift()||"").toLowerCase();
  const args=parts.map(x=>x.replace(/^['"]|['"]$/g,""));
  switch(cmd){
    case "help":
      print("NEXUS browser shell — Termux-style commands","ok");
      print("help clear ls pwd cd mkdir touch cat echo whoami date uname neofetch scan ping history status matrix about lab game theme exit");
      print("Note: this is a safe simulation. It does not run real Linux commands.");
      break;
    case "clear": out.innerHTML=""; break;
    case "pwd": print(cwd); break;
    case "ls": {
      const target=normalizePath(args[0]||cwd);
      if(!fs[target]||fs[target].type!=="dir"){print("ls: no such directory: "+(args[0]||target),"err");break}
      print(children(target).join("  ")||"(empty)"); break;
    }
    case "cd": {
      const target=normalizePath(args[0]||"~");
      if(!fs[target]||fs[target].type!=="dir"){print("cd: no such directory: "+target,"err");break}
      cwd=target; break;
    }
    case "mkdir": {
      if(!args[0]){print("mkdir: missing operand","err");break}
      const target=normalizePath(args[0]);
      if(fs[target]){print("mkdir: already exists","err");break}
      const parent=target.slice(0,target.lastIndexOf("/"))||"/";
      if(!fs[parent]||fs[parent].type!=="dir"){print("mkdir: parent does not exist","err");break}
      fs[target]={type:"dir"}; print("created directory: "+args[0],"ok"); break;
    }
    case "touch": {
      if(!args[0]){print("touch: missing file name","err");break}
      const target=normalizePath(args[0]); if(fs[target]){print("file already exists");break}
      const parent=target.slice(0,target.lastIndexOf("/"))||"/";
      if(!fs[parent]||fs[parent].type!=="dir"){print("touch: parent does not exist","err");break}
      fs[target]={type:"file",content:""}; print("created: "+args[0],"ok"); break;
    }
    case "cat": {
      if(!args[0]){print("cat: missing file name","err");break}
      const target=normalizePath(args[0]);
      if(!fs[target]||fs[target].type!=="file"){print("cat: file not found: "+args[0],"err");break}
      print(fs[target].content); break;
    }
    case "echo": print(args.join(" ")); break;
    case "whoami": print("guest"); break;
    case "date": print(new Date().toString()); break;
    case "uname": print("NEXUS Browser OS 1.1 x86_64 web"); break;
    case "neofetch":
      printHTML(`<span class="ok">       _   _ _____  __  __</span><br><span class="ok">      | \\ | | ____| \\ \\/ /</span><br><span class="ok">      |  \\| |  _|    \\  / </span><br><span class="ok">      | |\\  | |___   /  \\ </span><br><span class="ok">      |_| \\_|_____| /_/\\_\\</span><br><br>User: guest<br>Host: NEXUS<br>Shell: nexus-sh<br>Mode: Browser simulation<br>Kernel: web-runtime<br>Theme: ${document.body.classList.contains("light")?"light":"dark"}`);
      break;
    case "scan":
      print("NEXUS network scanner","ok"); print("Scanning virtual environment...");
      setTimeout(()=>{print("127.0.0.1   nexus-local   ONLINE");print("localhost   browser      ONLINE");print("No external network scan performed.","warn");},450);
      break;
    case "ping":
      if(!args[0]){print("ping: missing host","err");break}
      print(`PING ${args[0]} (simulated)`,"ok");
      let n=0; const p=setInterval(()=>{n++;print(`64 bytes from ${args[0]}: time=${Math.floor(12+Math.random()*45)} ms`);if(n>=4)clearInterval(p)},400);
      break;
    case "history": history.forEach((h,i)=>print(`${i+1}  ${h}`)); break;
    case "status": print("NEXUS STATUS: ONLINE","ok"); print(`Terminal: ready | Virtual FS: ${Object.keys(fs).length} entries | Path: ${cwd}`); break;
    case "matrix":
      print("Entering matrix mode...","ok");
      let lines=0;const m=setInterval(()=>{print(Array.from({length:32},()=>Math.random()>.5?"1":"0").join(""));if(++lines>=12)clearInterval(m)},90);
      break;
    case "about": openWindow("about"); break;
    case "lab": openWindow("lab"); break;
    case "game": openWindow("game"); break;
    case "theme": document.body.classList.toggle("light");localStorage.setItem("nexus-theme",document.body.classList.contains("light")?"light":"dark");print("Theme: "+(document.body.classList.contains("light")?"light":"dark"),"ok");break;
    case "exit": closeWindow("terminalWindow"); break;
    default: print(`${cmd}: command not found. Type "help".`,"err");
  }
}
input.addEventListener("keydown",e=>{
  if(e.key==="Enter"){commandLine(input.value);input.value="";}
  if(e.key==="ArrowUp"){const h=history[history.length-1];if(h)input.value=h;}
});
print("NEXUS Terminal v1.1","ok");
print('Type "help" to see commands.');
print('Try: ls  •  neofetch  •  scan  •  ping nexus  •  matrix');
