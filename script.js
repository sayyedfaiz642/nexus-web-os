/* NEXUS ULTIMATE — all app/game/terminal logic lives here. */
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const windows = {
  about: "#aboutWindow",
  terminal: "#terminalWindow",
  lab: "#labWindow",
  game: "#gameWindow"
};

function openWindow(name){
  Object.values(windows).forEach(sel => $(sel).classList.add("hidden"));
  $(windows[name]).classList.remove("hidden");
  if(name === "terminal") setTimeout(() => $("#terminalInput").focus(), 50);
  if(name === "game") resizeGame();
}
function closeWindow(id){ $("#" + id).classList.add("hidden"); }

$$("[data-open]").forEach(btn => btn.addEventListener("click", () => openWindow(btn.dataset.open)));
$$("[data-close]").forEach(btn => btn.addEventListener("click", () => closeWindow(btn.dataset.close)));

addEventListener("keydown", e => {
  if(e.key.toLowerCase() === "t" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) openWindow("terminal");
  if(e.key === "Escape") $$(".window").forEach(w => w.classList.add("hidden"));
});

/* Stars */
const starCanvas = $("#stars"), starCtx = starCanvas.getContext("2d");
let stars = [];
function resizeStars(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  starCanvas.width = innerWidth*dpr; starCanvas.height = innerHeight*dpr;
  starCanvas.style.width = innerWidth+"px"; starCanvas.style.height = innerHeight+"px";
  starCtx.setTransform(dpr,0,0,dpr,0,0);
  stars = Array.from({length:Math.min(170,Math.floor(innerWidth/6))},()=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.25+Math.random()*1.3,s:.06+Math.random()*.28
  }));
}
function drawStars(){
  starCtx.clearRect(0,0,innerWidth,innerHeight);
  for(const s of stars){
    s.y += s.s; if(s.y > innerHeight){s.y=-2;s.x=Math.random()*innerWidth}
    starCtx.beginPath(); starCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    starCtx.fillStyle="rgba(160,220,255,.58)"; starCtx.fill();
  }
  requestAnimationFrame(drawStars);
}
addEventListener("resize",resizeStars); resizeStars(); drawStars();

/* Theme */
$("#themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("light");
  localStorage.setItem("nexus-theme",document.body.classList.contains("light")?"light":"dark");
});
if(localStorage.getItem("nexus-theme")==="light") document.body.classList.add("light");

/* Signal Lab */
function updateSignal(){
  const signal=+$("#signalSlider").value, speed=+$("#speedSlider").value;
  $("#signalValue").textContent=signal+"%"; $("#signalText").textContent=signal+"%";
  $("#speedValue").textContent=speed+"%"; $("#speedText").textContent=speed+"%";
  document.documentElement.style.setProperty("--signal",signal/100);
  document.documentElement.style.setProperty("--orbit-speed",(14-speed*.11).toFixed(2)+"s");
}
$("#signalSlider").addEventListener("input",updateSignal);
$("#speedSlider").addEventListener("input",updateSignal);
$("#randomSignal").addEventListener("click",()=>{
  $("#signalSlider").value=Math.floor(Math.random()*101);
  $("#speedSlider").value=Math.floor(Math.random()*101);
  updateSignal(); toast("Signal randomized");
});
updateSignal();

/* Toast */
let toastTimer;
function toast(message){
  const t=$("#toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),1800);
}

/* =========================================================
   NEXUS CONSOLE — original browser Linux-style environment
   NOTE: this is an original implementation. It cannot execute
   native Android/Linux binaries from a GitHub Pages browser tab.
   ========================================================= */
const terminal=$("#terminalOutput"), termInput=$("#terminalInput"), termPath=$("#termPath");
let cwd="/home/guest", commandHistory=[], histIndex=0;

const vfs={
  "/home/guest":{type:"dir"},
  "/home/guest/projects":{type:"dir"},
  "/home/guest/downloads":{type:"dir"},
  "/home/guest/.config":{type:"dir"},
  "/home/guest/about.txt":{type:"file",content:"NEXUS browser environment\nUnix-style commands, a virtual filesystem and a local package database."},
  "/home/guest/nexus.conf":{type:"file",content:"mode=browser\nuser=guest\nnetwork=browser\nexecution=virtual"}
};
const packageCatalog={
  "coreutils":{v:"1.4.0",size:"182 KB",desc:"basic filesystem utilities"},
  "python":{v:"3.12.0",size:"4.8 MB",desc:"Python-like console runtime"},
  "nodejs":{v:"22.1.0",size:"7.2 MB",desc:"JavaScript console runtime"},
  "git":{v:"2.46.0",size:"2.1 MB",desc:"local project version tool"},
  "nano":{v:"8.1.0",size:"420 KB",desc:"text editor"},
  "curl":{v:"8.9.0",size:"610 KB",desc:"HTTP utility simulation"},
  "wget":{v:"1.21.4",size:"390 KB",desc:"download utility simulation"},
  "jq":{v:"1.7.1",size:"310 KB",desc:"JSON utility"},
  "figlet":{v:"2.2.5",size:"95 KB",desc:"ASCII banner utility"},
  "neofetch":{v:"7.1.0",size:"75 KB",desc:"system information"}
};
let installed=JSON.parse(localStorage.getItem("nexus-installed")||'{"coreutils":"1.4.0"}');
let pkgIndex=JSON.parse(localStorage.getItem("nexus-pkg-index")||"null");
if(!pkgIndex) pkgIndex={updated:0,packages:Object.keys(packageCatalog)};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function out(text="",cls=""){
  const d=document.createElement("div"); if(cls)d.className=cls;
  d.innerHTML=esc(text).replace(/\n/g,"<br>"); terminal.appendChild(d); terminal.scrollTop=terminal.scrollHeight;
}
function outHTML(html,cls=""){
  const d=document.createElement("div"); if(cls)d.className=cls;
  d.innerHTML=html; terminal.appendChild(d); terminal.scrollTop=terminal.scrollHeight;
}
function saveState(){localStorage.setItem("nexus-vfs",JSON.stringify(vfs));localStorage.setItem("nexus-installed",JSON.stringify(installed));localStorage.setItem("nexus-pkg-index",JSON.stringify(pkgIndex));}
(function restore(){try{const x=JSON.parse(localStorage.getItem("nexus-vfs")||"null");if(x)Object.assign(vfs,x);}catch{}})();
function pathNorm(input){
  if(!input||input==="~") return "/home/guest";
  let p=input.startsWith("~/")?"/home/guest/"+input.slice(2):input.startsWith("/")?input:cwd+"/"+input;
  const stack=[];
  for(const part of p.split("/")){if(!part||part===".")continue;if(part==="..")stack.pop();else stack.push(part)}
  return "/"+stack.join("/");
}
function showPath(){return cwd==="/home/guest"?"~": "~"+cwd.slice("/home/guest".length);}
function refreshPrompt(){termPath.textContent=showPath();}
function children(dir){return Object.keys(vfs).filter(k=>k!==dir&&k.startsWith(dir+"/")&&!k.slice(dir.length+1).includes("/"));}
function basename(path){return path.split("/").filter(Boolean).pop()||"/";}
function ensureParent(path){const par=path.split("/").slice(0,-1).join("/")||"/";return vfs[par]?.type==="dir";}
function cmdLine(cmd,args){return `<span class="term-dim">guest@nexus:${esc(showPath())} $</span> <span>${esc(cmd+(args.length?" "+args.join(" "):""))}</span>`;}
function saveVFS(){localStorage.setItem("nexus-vfs",JSON.stringify(vfs));}

function printHelp(){
 out("NEXUS CONSOLE — command reference");
 out("Filesystem:  ls  cd  pwd  mkdir  touch  cat  rm  cp  mv  tree  echo");
 out("Packages:    pkg update  |  pkg upgrade  |  pkg install <name>  |  pkg remove <name>");
 out("            pkg search <word>  |  pkg list-installed  |  pkg info <name>");
 out("Runtime:     python  |  node  |  sh  |  calc  |  clear  |  history");
 out("Network:     ping  |  curl  |  wget  |  scan");
 out("System:      uname  |  whoami  |  date  |  env  |  export  |  neofetch  |  status");
 out("Tools:       nano  |  figlet  |  git  |  mkapp  |  apps  |  matrix");
 out("Tip: commands are stateful and survive refresh. Type 'about' for limits.");
}
function pkgUpdate(){
 out("Checking NEXUS package indexes...");
 ["main","community","science"].forEach((r,i)=>out(`[${"+".repeat(i+1)}] ${r.padEnd(10)} index synchronized`));
 pkgIndex.updated=Date.now();pkgIndex.packages=Object.keys(packageCatalog);saveState();
 out("Reading package lists... Done","ok");out(`${Object.keys(packageCatalog).length} packages available.`);out("Run 'pkg upgrade' to upgrade installed packages.");
}
function pkgInstall(names){
 if(!names.length){out("pkg: missing package name");return}
 names.forEach(name=>{
  const meta=packageCatalog[name];
  if(!meta){out(`E: Unable to locate package ${name}`);return}
  if(installed[name]){out(`${name} ${installed[name]} is already installed.`);return}
  out(`Resolving ${name}...`);out(`Downloading ${name}_${meta.v} (${meta.size})... 100%`);out(`Unpacking ${name}...`);installed[name]=meta.v;out(`Setting up ${name} (${meta.v})... Done`,"ok");
 });saveState();
}
function pkgUpgrade(){
 let n=0;for(const name of Object.keys(installed)){if(packageCatalog[name]&&installed[name]!==packageCatalog[name].v){out(`Upgrading ${name} ${installed[name]} -> ${packageCatalog[name].v}... Done`);installed[name]=packageCatalog[name].v;n++}}
 out(n?`${n} package(s) upgraded.`:"All installed packages are up to date.","ok");saveState();
}
function pkgCommand(args){
 const sub=(args.shift()||"").toLowerCase();
 if(sub==="update"){pkgUpdate();return}
 if(sub==="upgrade"){pkgUpgrade();return}
 if(["install","add"].includes(sub)){pkgInstall(args);return}
 if(["remove","uninstall"].includes(sub)){args.forEach(n=>{if(n==="coreutils"){out("E: coreutils is required by the base environment");return}if(installed[n]){delete installed[n];out(`Removing ${n}... Done`)}else out(`${n} is not installed.`)});saveState();return}
 if(sub==="search"){const q=(args.join(" ")||"").toLowerCase();Object.entries(packageCatalog).filter(([n,m])=>!q||n.includes(q)||m.desc.includes(q)).forEach(([n,m])=>out(`${n.padEnd(12)} ${m.v.padEnd(9)} ${m.desc}`));return}
 if(["list-installed","list"].includes(sub)){Object.entries(installed).forEach(([n,v])=>out(`${n.padEnd(12)} ${v}`));return}
 if(["info","show"].includes(sub)){const n=args[0],m=packageCatalog[n];if(!m){out(`Package '${n||""}' not found.`);return}out(`${n}\n Version: ${m.v}\n Size: ${m.size}\n Description: ${m.desc}`);return}
 out("Usage: pkg {update|upgrade|install|remove|search|list-installed|info} ...");
}
function ls(args){const target=pathNorm(args[0]||cwd),node=vfs[target];if(!node){out(`ls: cannot access '${args[0]||"."}': No such file or directory`);return}if(node.type==="file"){out(basename(target));return}out(children(target).map(k=>vfs[k].type==="dir"?basename(k)+"/":basename(k)).join("  ")||"(empty)");}
function tree(dir=cwd,prefix=""){
 out(basename(dir)||"/");
 function walk(d,p){for(const k of children(d)){const last=children(d).at(-1)===k;out(p+(last?"└── ":"├── ")+basename(k)+(vfs[k].type==="dir"?"/":""));if(vfs[k].type==="dir")walk(k,p+(last?"    ":"│   "));}}
 walk(dir,prefix);
}
function mkdir(args){if(!args.length){out("mkdir: missing operand");return}for(const a of args){const p=pathNorm(a);if(vfs[p]){out(`mkdir: cannot create '${a}': File exists`);continue}if(!ensureParent(p)){out(`mkdir: cannot create '${a}': No such directory`);continue}vfs[p]={type:"dir"};out(`created ${p}`)}saveVFS();}
function touch(args){if(!args.length){out("touch: missing file operand");return}for(const a of args){const p=pathNorm(a);if(!vfs[p]){if(!ensureParent(p)){out(`touch: cannot touch '${a}': No such directory`);continue}vfs[p]={type:"file",content:""};out(`created ${p}`)}}saveVFS();}
function cat(args){if(!args.length){out("cat: missing file operand");return}for(const a of args){const p=pathNorm(a),n=vfs[p];if(!n){out(`cat: ${a}: No such file or directory`);continue}if(n.type!=="file"){out(`cat: ${a}: Is a directory`);continue}out(n.content||"");}}
function remove(args){if(!args.length){out("rm: missing operand");return}for(const a of args){const p=pathNorm(a);if(!vfs[p]){out(`rm: cannot remove '${a}': No such file or directory`);continue}if(p==="/home/guest"){out("rm: refusing to remove home");continue}const keys=Object.keys(vfs).filter(k=>k===p||k.startsWith(p+"/"));keys.forEach(k=>delete vfs[k]);out(`removed ${p}`)}saveVFS();if(!vfs[cwd]){cwd="/home/guest";refreshPrompt();}}
function copyMove(args,move){if(args.length<2){out(`${move?"mv":"cp"}: missing destination file operand`);return}const src=pathNorm(args[0]),dst=pathNorm(args[1]);if(!vfs[src]){out(`${move?"mv":"cp"}: ${args[0]}: No such file or directory`);return}if(vfs[src].type==="dir"){out(`${move?"mv":"cp"}: directory operation is limited in this browser shell`);return}const dest=vfs[dst]?.type==="dir"?dst+"/"+basename(src):dst;if(!ensureParent(dest)){out(`cannot write '${args[1]}': No such directory`);return}vfs[dest]={type:"file",content:vfs[src].content};if(move)delete vfs[src];saveVFS();out(`${move?"moved":"copied"} ${src} -> ${dest}`);}
function echoCmd(args){const text=args.join(" ");const m=text.match(/^(.*)\s*(>>|>)\s*([^>]+)$/);if(!m){out(text);return}const content=m[1].trim(),op=m[2],p=pathNorm(m[3].trim());if(!ensureParent(p)){out(`echo: ${m[3].trim()}: No such directory`);return}if(!vfs[p])vfs[p]={type:"file",content:""};if(vfs[p].type!=="file"){out("echo: target is a directory");return}vfs[p].content=op===">>"?(vfs[p].content? vfs[p].content+"\n":"")+content:content;saveVFS();}
function simpleCalc(expr){if(!/^[0-9+\-*/%().\s]+$/.test(expr))return null;try{return Function(`"use strict";return (${expr})`)()}catch{return null}}
function runPython(args){
 if(!installed.python){out("python: command not found\nInstall it with: pkg install python");return}
 const code=args.join(" ").replace(/^(-c\s+)?[\"']|[\"']$/g,"").trim();
 if(!code){out("NEXUS Python console\nType: python -c \"print('hello')\"");return}
 const pm=code.match(/^print\((.*)\)$/s);if(pm){let x=pm[1].trim();try{if(/^['\"`].*['\"`]$/.test(x))out(x.slice(1,-1));else if(simpleCalc(x)!==null)out(String(simpleCalc(x)));else out(x)}catch{out("Python runtime error")};return}
 out("Python subset: print(...), arithmetic expressions. Native modules are unavailable.");
}
function runNode(args){const code=args.join(" ").replace(/^-e\s+/,"").replace(/^['\"]|['\"]$/g,"");if(!code){out("NEXUS Node console\nType: node -e \"console.log('hello')\"");return}const m=code.match(/console\.log\((.*)\)/);if(m){let x=m[1].trim();if(/^['\"`].*['\"`]$/.test(x))out(x.slice(1,-1));else if(simpleCalc(x)!==null)out(String(simpleCalc(x)));else out(x);return}out("Node subset: console.log(...) and arithmetic expressions.");}
function shCommand(args){const code=args.join(" ").replace(/^-c\s+/,"").replace(/^['\"]|['\"]$/g,"");if(!code){out("NEXUS shell: use sh -c \"command\"");return}code.split(/\s*&&\s*|\s*;\s*/).filter(Boolean).forEach(runCommand);}
function mkapp(args){const type=(args.shift()||"blank").toLowerCase(),title=args.join(" ")||"NEXUS App";const safe=title.replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();const templates={calculator:`<!doctype html><title>${esc(title)}</title><style>body{font-family:system-ui;background:#10131a;color:#fff;padding:30px}input,button{padding:12px;margin:4px}</style><h1>${esc(title)}</h1><input id=a placeholder="25*4"><button onclick="o.textContent=Function('return '+a.value)()">Calculate</button><pre id=o></pre>`,todo:`<!doctype html><title>${esc(title)}</title><style>body{font-family:system-ui;background:#10131a;color:#fff;padding:30px}</style><h1>${esc(title)}</h1><input id=i><button onclick="if(i.value){l.innerHTML+='<li>'+i.value+'</li>';i.value=''}">Add</button><ul id=l></ul>`,notes:`<!doctype html><title>${esc(title)}</title><style>body{font-family:system-ui;background:#10131a;color:#fff;padding:30px}textarea{width:100%;height:60vh}</style><h1>${esc(title)}</h1><textarea placeholder="Write..."></textarea>`,stopwatch:`<!doctype html><title>${esc(title)}</title><style>body{font-family:system-ui;background:#10131a;color:#fff;padding:30px}button{padding:12px}</style><h1>${esc(title)}</h1><h2 id=t>0.0</h2><button onclick="s??">Start</button><script>let x=0,r;function s(){clearInterval(r);r=setInterval(()=>t.textContent=(x+=.1).toFixed(1),100)}</script>`,quiz:`<!doctype html><title>${esc(title)}</title><style>body{font-family:system-ui;background:#10131a;color:#fff;padding:30px}button{padding:12px}</style><h1>${esc(title)}</h1><p>What is 2 + 2?</p><button onclick="o.textContent='Correct'">4</button><button onclick="o.textContent='Try again'">5</button><h2 id=o></h2>`,blank:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body><h1>${esc(title)}</h1><p>Generated by NEXUS.</p></body></html>`};let html=templates[type]||templates.blank;const blob=new Blob([html],{type:"text/html"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=safe+".html";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);out(`Generated ${safe}.html and started download.` ,"ok");}
function apps(){out("NEXUS APP GENERATOR\nmkapp calculator <title>\nmkapp todo <title>\nmkapp notes <title>\nmkapp stopwatch <title>\nmkapp quiz <title>\nmkapp blank <title>");}
function neofetch(){out(`NEXUS\n------------------------------\nOS        NEXUS Browser OS\nKernel    virtual-6.x\nShell     nexus-sh\nUser      guest\nHome      /home/guest\nPackages  ${Object.keys(installed).length}\nStorage   local browser storage\nNetwork   browser sandbox`);}
function status(){out(`CORE       ONLINE\nCONSOLE    READY\nPACKAGE DB ${pkgIndex.updated?"SYNCED":"NEW"}\nPACKAGES   ${Object.keys(installed).length} installed\nFILES      ${Object.keys(vfs).length}\nARENA      READY\nLAB        READY`);}
function matrix(){let chars="01<>[]{}$#@";let s="";for(let i=0;i<260;i++)s+=chars[Math.floor(Math.random()*chars.length)];out(s);}
function ping(host="nexus"){let n=0;out(`PING ${host} (virtual) 32 bytes of data`);const timer=setInterval(()=>{n++;out(`64 bytes from ${host}: seq=${n} time=${(12+Math.random()*18).toFixed(1)} ms`);if(n>=4){clearInterval(timer);out(`--- ${host} statistics ---\n4 packets transmitted, 4 received, 0% packet loss`)}},280)}
function scan(){out("NEXUS local service scan\n22  virtual-shell   open\n80  web-interface   open\n443 secure-interface open\nNo external device access is performed.");}
function curlCmd(args){if(!args.length){out("curl: try 'curl <url>'");return}out(`curl: browser sandbox request simulated for ${args[0]}\nExternal downloads require a server endpoint and permission.`);}
function runCommand(line){
 const raw=line.trim();if(!raw)return;
 const chain=raw.split(/\s*(?:&&|;)\s*/).filter(Boolean);
 if(chain.length>1){chain.forEach(runCommand);return}
 const parts=raw.match(/(?:[^\s\"']+|\"[^\"]*\"|'[^']*')+/g)||[];const cmd=(parts.shift()||"").replace(/^['\"]|['\"]$/g,"").toLowerCase();const args=parts.map(x=>x.replace(/^['\"]|['\"]$/g,""));
 if(cmd==="help"||cmd==="?"){printHelp();return} if(cmd==="clear"){terminal.innerHTML="";return} if(cmd==="pwd"){out(cwd);return} if(cmd==="ls"||cmd==="dir"){ls(args);return} if(cmd==="cd"){const p=pathNorm(args[0]||"~");if(!vfs[p])out(`cd: ${args[0]||"~"}: No such file or directory`);else if(vfs[p].type!=="dir")out(`cd: ${args[0]}: Not a directory`);else{cwd=p;refreshPrompt()}return} if(cmd==="mkdir"){mkdir(args);return} if(cmd==="touch"){touch(args);return} if(cmd==="cat"){cat(args);return} if(cmd==="rm"||cmd==="rmdir"){remove(args);return} if(cmd==="cp"){copyMove(args,false);return} if(cmd==="mv"){copyMove(args,true);return} if(cmd==="tree"){tree(pathNorm(args[0]||cwd));return} if(cmd==="echo"){echoCmd(args);return}
 if(cmd==="pkg"||cmd==="apt"||cmd==="apt-get"){pkgCommand(args);return}
 if(cmd==="python"||cmd==="python3"){runPython(args);return} if(cmd==="node"||cmd==="nodejs"){if(!installed.nodejs){out("node: command not found\nInstall it with: pkg install nodejs");return}runNode(args);return} if(cmd==="sh"||cmd==="bash"){shCommand(args);return}
 if(cmd==="calc"){const r=simpleCalc(args.join(" "));out(r===null?"calc: invalid expression":String(r));return}
 if(cmd==="whoami"){out("guest");return} if(cmd==="date"){out(new Date().toString());return} if(cmd==="uname"){out("NEXUS virtual-kernel 6.8 browser-js x86_64");return} if(cmd==="env"){out("USER=guest\nHOME=/home/guest\nSHELL=/bin/nexus-sh\nTERM=nexus-256color\nPWD="+cwd);return} if(cmd==="export"){out("export: environment variables are session-local in this browser shell");return}
 if(cmd==="neofetch"){neofetch();return} if(cmd==="status"){status();return} if(cmd==="ping"){ping(args[0]||"nexus");return} if(cmd==="scan"){scan();return} if(cmd==="curl"||cmd==="wget"){curlCmd(args);return}
 if(cmd==="history"){commandHistory.forEach((x,i)=>out(`${i+1}  ${x}`));return} if(cmd==="matrix"){matrix();return} if(cmd==="mkapp"){mkapp(args);return} if(cmd==="apps"){apps();return} if(cmd==="nano"){if(!installed.nano){out("nano: command not found\nInstall it with: pkg install nano");return}out("NEXUS nano mode is available for simple file creation. Use: echo text > file");return}
 if(cmd==="git"){if(!installed.git){out("git: command not found\nInstall it with: pkg install git");return}out("NEXUS git: repository operations are local-only in the browser sandbox.\nTry: git init | git status");return}
 if(cmd==="about"){out("NEXUS is an original browser environment.\nIt reproduces useful Unix-style command behavior with a virtual filesystem and package database.\nA browser cannot execute native Android/Linux binaries or access the phone filesystem.");return}
 if(cmd==="lab"){openWindow("lab");return} if(cmd==="game"){openWindow("game");return} if(cmd==="theme"){$("#themeBtn").click();return} if(cmd==="exit"){closeWindow("terminalWindow");return}
 out(`${cmd}: command not found. Type 'help' for commands.`);
}
function bootTerminal(){
 out("NEXUS CONSOLE v2.0");out("Original Unix-style browser environment");out("Type 'help' to list commands.");out("Tip: pkg update && pkg install python");refreshPrompt();
}
termInput.addEventListener("keydown",e=>{
 if(e.key==="Enter"){const line=termInput.value.trim();if(line){outHTML(cmdLine(...(line.match(/(?:[^\s\"']+|\"[^\"]*\"|'[^']*')+/g)||[line]).slice(0,1),[]));commandHistory.push(line);histIndex=commandHistory.length;runCommand(line);localStorage.setItem("nexus-history",JSON.stringify(commandHistory));}termInput.value="";refreshPrompt();}
 if(e.key==="ArrowUp"){e.preventDefault();histIndex=Math.max(0,histIndex-1);termInput.value=commandHistory[histIndex]||""}
 if(e.key==="ArrowDown"){e.preventDefault();histIndex=Math.min(commandHistory.length,histIndex+1);termInput.value=commandHistory[histIndex]||""}
 if(e.key==="Tab"){e.preventDefault();const partial=termInput.value.trim();const pool=["help","clear","ls","cd","pwd","mkdir","touch","cat","rm","cp","mv","tree","echo","pkg","python","node","sh","calc","whoami","date","uname","env","export","neofetch","status","ping","scan","curl","wget","history","matrix","mkapp","apps","nano","git","about","lab","game","theme","exit"];const hit=pool.find(x=>x.startsWith(partial));if(hit)termInput.value=hit+" ";}
});
try{commandHistory=JSON.parse(localStorage.getItem("nexus-history")||"[]")}catch{commandHistory=[]}
bootTerminal();

/* =========================================================
   NEXUS ARENA — actual playable top-down survival game
   Canvas-based, no external assets.
   ========================================================= */
const canvas=$("#gameCanvas"), ctx=canvas.getContext("2d");
const game={running:false,score:0,wave:1,hp:100,best:+localStorage.nexusBest||0,last:0,spawn:0,shots:[],enemies:[],cores:[],particles:[],keys:{},aim:{x:360,y:230},fire:false,player:{x:360,y:230,r:15,speed:230,cool:0,inv:0},joy:{x:0,y:0}};
$("#gameBest").textContent=game.best;

function resizeGame(){ /* canvas scales via CSS; coordinates stay 720x460 */ }

function resetGame(){
  game.score=0;game.wave=1;game.hp=100;game.shots=[];game.enemies=[];game.cores=[];game.particles=[];
  game.player={x:360,y:230,r:15,speed:230,cool:0,inv:0};
  game.spawn=0; game.running=true; $("#gameMenu").classList.add("hidden"); updateHud();
  game.last=performance.now(); requestAnimationFrame(gameLoop);
}
function updateHud(){
  $("#gameScore").textContent=game.score;
  $("#gameWave").textContent=game.wave;
  $("#gameHp").textContent=Math.max(0,Math.ceil(game.hp));
  $("#gameBest").textContent=game.best;
}
function spawnEnemy(){
  const side=Math.floor(Math.random()*4), pad=25;
  let x,y;
  if(side===0){x=-pad;y=Math.random()*460}else if(side===1){x=720+pad;y=Math.random()*460}else if(side===2){x=Math.random()*720;y=-pad}else{x=Math.random()*720;y=460+pad}
  const type=Math.random()<Math.min(.25,game.wave*.025)?"tank":"drone";
  game.enemies.push({x,y,r:type==="tank"?18:12,hp:type==="tank"?3:1,max:type==="tank"?3:1,speed:type==="tank"?42+game.wave*2:65+game.wave*4,type});
}
function shoot(){
  if(!game.running||game.player.cool>0)return;
  const p=game.player, dx=game.aim.x-p.x,dy=game.aim.y-p.y,len=Math.hypot(dx,dy)||1;
  game.shots.push({x:p.x,y:p.y,vx:dx/len*480,vy:dy/len*480,r:4,life:1.2});
  game.player.cool=.16;
}
function addParticles(x,y,n=8){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*130;game.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.4})}
}
function damagePlayer(amount){
  if(game.player.inv>0)return;
  game.hp-=amount;game.player.inv=.7;addParticles(game.player.x,game.player.y,12);
  if(game.hp<=0) endGame();
}
function endGame(){
  game.running=false;
  if(game.score>game.best){game.best=game.score;localStorage.nexusBest=game.best}
  updateHud();
  $("#gameMenu").classList.remove("hidden");
  $("#gameMenu").querySelector(".game-logo").innerHTML=`GAME<br><span>OVER</span>`;
  $("#gameMenu").querySelector("p").textContent=`Score ${game.score} • Wave ${game.wave} • Best ${game.best}`;
  $("#gamePlay").textContent="PLAY AGAIN";
}
function updateGame(dt){
  const p=game.player;
  let dx=(game.keys.d?-1:0)+(game.keys.a?1:0),dy=(game.keys.s?1:0)+(game.keys.w?-1:0);
  if(game.joy.x||game.joy.y){dx=game.joy.x;dy=game.joy.y}
  const len=Math.hypot(dx,dy)||1;
  p.x=Math.max(p.r,Math.min(720-p.r,p.x+dx/len*p.speed*dt));
  p.y=Math.max(p.r,Math.min(460-p.r,p.y+dy/len*p.speed*dt));
  p.cool=Math.max(0,p.cool-dt);p.inv=Math.max(0,p.inv-dt);
  if(game.fire||game.keys[" "])shoot();

  game.spawn-=dt;
  const interval=Math.max(.28,1.1-game.wave*.045);
  if(game.spawn<=0){spawnEnemy();game.spawn=interval}
  if(game.score>=game.wave*250){game.wave++;toast("WAVE "+game.wave)}

  for(const s of game.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt}
  game.shots=game.shots.filter(s=>s.life>0&&s.x>-20&&s.x<740&&s.y>-20&&s.y<480);

  for(const e of game.enemies){
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
    e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;
    if(d<e.r+p.r){damagePlayer(e.type==="tank"?18:10);e.x-=dx/d*20;e.y-=dy/d*20}
  }

  for(const s of game.shots){
    for(const e of game.enemies){
      if(e.dead)continue;
      if(Math.hypot(s.x-e.x,s.y-e.y)<s.r+e.r){
        e.hp--;s.life=0;addParticles(e.x,e.y,5);
        if(e.hp<=0){e.dead=true;game.score+=e.type==="tank"?45:15;if(Math.random()<.1)game.cores.push({x:e.x,y:e.y,r:8})}
        break;
      }
    }
  }
  game.enemies=game.enemies.filter(e=>!e.dead);
  for(const c of game.cores){
    if(Math.hypot(c.x-p.x,c.y-p.y)<c.r+p.r){c.dead=true;game.score+=25;game.hp=Math.min(100,game.hp+8);addParticles(c.x,c.y,10)}
  }
  game.cores=game.cores.filter(c=>!c.dead);
  for(const q of game.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt}
  game.particles=game.particles.filter(q=>q.life>0);
  updateHud();
}
function drawGame(){
  ctx.clearRect(0,0,720,460);
  ctx.fillStyle="#050b16";ctx.fillRect(0,0,720,460);
  ctx.strokeStyle="rgba(80,150,220,.08)";ctx.lineWidth=1;
  for(let x=0;x<720;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,460);ctx.stroke()}
  for(let y=0;y<460;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(720,y);ctx.stroke()}
  for(const c of game.cores){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fillStyle="#66f7ff";ctx.shadowBlur=20;ctx.shadowColor="#66f7ff";ctx.fill();ctx.shadowBlur=0}
  for(const s of game.shots){ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle="#e8fbff";ctx.shadowBlur=12;ctx.shadowColor="#6ee7ff";ctx.fill();ctx.shadowBlur=0}
  for(const e of game.enemies){
    ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fillStyle=e.type==="tank"?"#ff5e79":"#9b7cff";ctx.fill();
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.12)";ctx.stroke();
  }
  const p=game.player;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(game.aim.y-p.y,game.aim.x-p.x));
  ctx.globalAlpha=p.inv>0&&Math.floor(performance.now()/80)%2?0.3:1;
  ctx.fillStyle="#6ee7ff";ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#dffcff";ctx.fillRect(6,-4,19,8);ctx.restore();
  for(const q of game.particles){ctx.globalAlpha=Math.max(0,q.life);ctx.fillStyle="#7feaff";ctx.fillRect(q.x,q.y,3,3)}ctx.globalAlpha=1;
}
function gameLoop(now){
  if(!game.running){drawGame();return}
  const dt=Math.min(.035,(now-game.last)/1000);game.last=now;
  updateGame(dt);drawGame();requestAnimationFrame(gameLoop);
}
$("#gamePlay").addEventListener("click",()=>{
  $("#gameMenu").querySelector(".game-logo").innerHTML="NEXUS<br><span>ARENA</span>";
  resetGame();
});

/* Aim / fire: mouse + touch */
function pointerAim(e){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*720/r.width,y=(e.clientY-r.top)*460/r.height;
  game.aim.x=x;game.aim.y=y;
}
canvas.addEventListener("pointermove",pointerAim);
canvas.addEventListener("pointerdown",e=>{pointerAim(e);game.fire=true;shoot()});
addEventListener("pointerup",()=>game.fire=false);
addEventListener("keydown",e=>{game.keys[e.key.toLowerCase()]=true});
addEventListener("keyup",e=>{game.keys[e.key.toLowerCase()]=false});

/* Mobile joystick */
const joy=$("#joy"), fireBtn=$("#fireBtn");
let joyPointer=null;
function joyMove(e){
  const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let x=e.clientX-cx,y=e.clientY-cy,d=Math.hypot(x,y),max=34;
  if(d>max){x=x/d*max;y=y/d*max}
  game.joy.x=x/max;game.joy.y=y/max;
  joy.querySelector("span").style.transform=`translate(${x}px,${y}px)`;
}
joy.addEventListener("pointerdown",e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});
joy.addEventListener("pointermove",e=>{if(e.pointerId===joyPointer)joyMove(e)});
joy.addEventListener("pointerup",()=>{joyPointer=null;game.joy.x=0;game.joy.y=0;joy.querySelector("span").style.transform=""});
fireBtn.addEventListener("pointerdown",()=>{game.fire=true;shoot()});
fireBtn.addEventListener("pointerup",()=>game.fire=false);
