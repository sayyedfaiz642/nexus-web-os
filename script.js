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
   NEXUS TERMINAL — safe browser shell + app generator
   ========================================================= */
const terminal=$("#terminalOutput"), termInput=$("#terminalInput"), termPath=$("#termPath");
let cwd="/home/guest", commandHistory=[], histIndex=0;

const vfs={
  "/home/guest":{type:"dir"},
  "/home/guest/projects":{type:"dir"},
  "/home/guest/downloads":{type:"dir"},
  "/home/guest/about.txt":{type:"file",content:"NEXUS — browser operating system\\nBuilt for GitHub Pages."},
  "/home/guest/nexus.conf":{type:"file",content:"mode=browser\\nuser=guest\\nserver=none"}
};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function out(text="",cls=""){
  const d=document.createElement("div"); if(cls)d.className=cls;
  d.innerHTML=esc(text).replace(/\n/g,"<br>");
  terminal.appendChild(d); terminal.scrollTop=terminal.scrollHeight;
}
function outHTML(html,cls=""){
  const d=document.createElement("div"); if(cls)d.className=cls;
  d.innerHTML=html; terminal.appendChild(d); terminal.scrollTop=terminal.scrollHeight;
}
function pathNorm(input){
  if(!input || input==="~") return "/home/guest";
  let p=input.startsWith("~/")?"/home/guest/"+input.slice(2):input.startsWith("/")?input:cwd+"/"+input;
  const stack=[];
  for(const part of p.split("/")){
    if(!part||part===".") continue;
    if(part==="..") stack.pop(); else stack.push(part);
  }
  return "/"+stack.join("/");
}
function showPath(){return cwd==="/home/guest"?"~":"~"+cwd.slice("/home/guest".length);}
function refreshPrompt(){termPath.textContent=showPath();}
function children(dir){
  const prefix=dir.endsWith("/")?dir:dir+"/", names=[];
  for(const key of Object.keys(vfs)){
    if(key.startsWith(prefix)){
      const rest=key.slice(prefix.length);
      if(rest && !rest.includes("/")) names.push(rest+(vfs[key].type==="dir"?"/":""));
    }
  }
  return names.sort();
}
function tokenize(line){
  const m=line.match(/"[^"]*"|'[^']*'|[^\s]+/g)||[];
  return m.map(x=>x.replace(/^['"]|['"]$/g,""));
}
function downloadText(filename,content,mime="text/html"){
  const blob=new Blob([content],{type:mime});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function makeApp(kind,name){
  const safe=name || kind;
  const slug=safe.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "nexus-app";
  let body="";
  if(kind==="calculator") body=`<div class="calc"><input id="display" readonly><div class="keys">${["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map(x=>`<button onclick="press('${x}')">${x}</button>`).join("")}</div></div><script>function press(x){let d=document.getElementById('display');if(x==='='){try{d.value=Function('return '+d.value)()}catch(e){d.value='ERR'}}else d.value+=x}<\/script>`;
  else if(kind==="todo") body=`<h1>${esc(safe)}</h1><input id="task" placeholder="New task"><button onclick="add()">ADD</button><ul id="list"></ul><script>function add(){let i=document.getElementById('task'),l=document.getElementById('list');if(!i.value)return;let x=document.createElement('li');x.textContent=i.value;x.onclick=()=>x.remove();l.appendChild(x);i.value=''}<\/script>`;
  else if(kind==="notes") body=`<h1>${esc(safe)}</h1><textarea id="n" placeholder="Write your notes..."></textarea><button onclick="localStorage.nexusNotes=n.value;alert('Saved')">SAVE</button><script>n.value=localStorage.nexusNotes||''<\/script>`;
  else if(kind==="stopwatch") body=`<h1>${esc(safe)}</h1><div id="time">0.0</div><button onclick="start()">START</button><button onclick="stop()">STOP</button><button onclick="reset()">RESET</button><script>let t=0,id;function start(){if(!id)id=setInterval(()=>{t+=.1;time.textContent=t.toFixed(1)},100)}function stop(){clearInterval(id);id=null}function reset(){stop();t=0;time.textContent='0.0'}<\/script>`;
  else if(kind==="quiz") body=`<h1>NEXUS QUIZ</h1><p id="q">Which language runs in a browser?</p><button onclick="ans('JavaScript')">JavaScript</button><button onclick="ans('C')">C</button><p id="r"></p><script>function ans(x){r.textContent=x==='JavaScript'?'Correct!':'Try again.'}<\/script>`;
  else body=`<h1>${esc(safe)}</h1><p>Generated by NEXUS Terminal.</p><button onclick="alert('NEXUS app is alive!')">TEST APP</button>`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(safe)}</title><style>body{font-family:system-ui;max-width:700px;margin:50px auto;padding:20px;background:#07101d;color:#eaf3ff}button,input,textarea{padding:12px;margin:5px;border-radius:8px;border:1px solid #345;background:#101c2d;color:#fff}textarea{width:100%;height:300px}.keys{display:grid;grid-template-columns:repeat(4,1fr)}.keys button{font-size:20px}#display{width:90%;font-size:25px}li{padding:10px;cursor:pointer}</style></head><body>${body}</body></html>`;
  downloadText(slug+".html",html);
  out("Generated "+slug+".html and started download.","ok");
}
function runCommand(line){
  const p=tokenize(line), cmd=(p.shift()||"").toLowerCase(), a=p;
  if(!cmd)return;
  commandHistory.push(line); histIndex=commandHistory.length;
  out(`guest@nexus:${showPath()}$ ${line}`,"cmd");
  switch(cmd){
    case "help":
      out("NEXUS Shell v2.0 — browser development environment","ok");
      out("FILES: ls  pwd  cd  mkdir  touch  cat  rm  tree");
      out("TEXT: echo  clear  history");
      out("SYSTEM: whoami  date  uname  neofetch  status");
      out("NETWORK DEMO: ping  scan");
      out("APPS: mkapp  apps  about  lab  game  theme");
      out("TOOLS: calc  matrix  cls  exit");
      out("mkapp examples: mkapp calculator My Calc | mkapp todo Tasks | mkapp quiz Quiz");
      out("This shell is sandboxed; it does not execute real Linux/Android commands.","warn"); break;
    case "clear": terminal.innerHTML=""; break;
    case "cls": terminal.innerHTML=""; break;
    case "pwd": out(cwd); break;
    case "whoami": out("guest"); break;
    case "date": out(new Date().toString()); break;
    case "uname": out("NEXUS-Web 2.0 browser-runtime x86_64"); break;
    case "ls": {
      const t=pathNorm(a[0]||cwd);
      if(!vfs[t]||vfs[t].type!=="dir"){out("ls: no such directory","err");break}
      out(children(t).join("   ")||"(empty)"); break;
    }
    case "cd": {
      const t=pathNorm(a[0]||"~");
      if(!vfs[t]||vfs[t].type!=="dir"){out("cd: no such directory: "+t,"err");break}
      cwd=t; refreshPrompt(); break;
    }
    case "mkdir": {
      if(!a[0]){out("mkdir: missing operand","err");break}
      const t=pathNorm(a[0]), parent=t.slice(0,t.lastIndexOf("/"))||"/";
      if(vfs[t]){out("mkdir: already exists","err");break}
      if(!vfs[parent]||vfs[parent].type!=="dir"){out("mkdir: parent missing","err");break}
      vfs[t]={type:"dir"}; out("created directory "+a[0],"ok"); break;
    }
    case "touch": {
      if(!a[0]){out("touch: missing file","err");break}
      const t=pathNorm(a[0]), parent=t.slice(0,t.lastIndexOf("/"))||"/";
      if(!vfs[parent]){out("touch: parent missing","err");break}
      vfs[t]={type:"file",content:""}; out("created "+a[0],"ok"); break;
    }
    case "cat": {
      const t=pathNorm(a[0]||"");
      if(!vfs[t]||vfs[t].type!=="file"){out("cat: file not found","err");break}
      out(vfs[t].content); break;
    }
    case "echo": out(a.join(" ")); break;
    case "rm": {
      const t=pathNorm(a[0]||"");
      if(!vfs[t]||t==="/home/guest"){out("rm: target not found or protected","err");break}
      delete vfs[t]; out("removed "+a[0],"ok"); break;
    }
    case "tree":
      out("/home/guest");
      out(children("/home/guest").map(x=>"├─ "+x).join("\n")); break;
    case "history": commandHistory.forEach((x,i)=>out(`${i+1}  ${x}`)); break;
    case "neofetch":
      outHTML(`<span class="ok">███ NEXUS WEB OS</span><br>User: guest<br>Shell: nexus-sh 2.0<br>Mode: GitHub Pages<br>Runtime: Browser JavaScript<br>Game: NEXUS Arena<br>Theme: ${document.body.classList.contains("light")?"light":"dark"}`); break;
    case "status": out("CORE: ONLINE | TERMINAL: READY | ARENA: READY | LAB: READY","ok"); break;
    case "ping":
      if(!a[0]){out("ping: missing host","err");break}
      out("PING "+a[0]+" — simulated");
      let n=0; const id=setInterval(()=>{out("64 bytes: time="+(8+Math.floor(Math.random()*45))+" ms");if(++n===4)clearInterval(id)},350); break;
    case "scan":
      out("NEXUS scanner — virtual environment only","ok");
      out("localhost   ONLINE\nnexus-core   ONLINE\narena-engine ONLINE\nExternal device/network scan blocked by browser sandbox.","warn"); break;
    case "matrix":
      let rows=0; const mid=setInterval(()=>{out(Array.from({length:50},()=>Math.random()>.5?"1":"0").join(""));if(++rows>12)clearInterval(mid)},70); break;
    case "calc": {
      const expr=a.join(" ");
      if(!expr){out("Usage: calc 12*(5+2)","warn");break}
      if(!/^[0-9+\-*/().%\s]+$/.test(expr)){out("calc: numbers/operators only","err");break}
      try{out(String(Function('"use strict";return ('+expr+')')()),"ok")}catch{out("calc: invalid expression","err")} break;
    }
    case "mkapp": {
      const kind=(a[0]||"").toLowerCase(), name=a.slice(1).join(" ")||kind;
      if(!["calculator","todo","notes","stopwatch","quiz","blank"].includes(kind)){out("Usage: mkapp calculator|todo|notes|stopwatch|quiz App Name","warn");break}
      makeApp(kind,name); break;
    }
    case "apps": out("calculator  todo  notes  stopwatch  quiz  blank"); break;
    case "about": openWindow("about"); break;
    case "lab": openWindow("lab"); break;
    case "game": openWindow("game"); break;
    case "theme": document.body.classList.toggle("light");localStorage.setItem("nexus-theme",document.body.classList.contains("light")?"light":"dark");out("Theme changed.","ok");break;
    case "exit": closeWindow("terminalWindow"); break;
    default: out(cmd+": command not found. Type help.","err");
  }
}
termInput.addEventListener("keydown",e=>{
  if(e.key==="Enter"){runCommand(termInput.value);termInput.value="";}
  if(e.key==="ArrowUp"){e.preventDefault();if(histIndex>0)histIndex--;termInput.value=commandHistory[histIndex]||"";}
  if(e.key==="ArrowDown"){e.preventDefault();if(histIndex<commandHistory.length-1)histIndex++;else{histIndex=commandHistory.length;termInput.value=""}termInput.value=commandHistory[histIndex]||"";}
});
out("NEXUS Shell v2.0 — ready","ok");
out('Type "help" for commands. Try: apps, mkapp todo Tasks, calc 12*8, neofetch');

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
