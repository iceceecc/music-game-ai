const D=document,W=window;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(a,b)=>a+Math.random()*(b-a);
const choice=a=>a[Math.floor(Math.random()*a.length)];

// ---------- Audio (richer, with sustained glide synth + chords + sidechain) ----------
class Bus {
  constructor(ctx){ this.ctx=ctx; this.g=ctx.createGain(); this.gain=this.g.gain; }
  connect(node){ this.g.connect(node); }
}
class Engine {
  constructor(){
    this.ctx=null;
    this.master=null; this.musicBus=null; this.drumBus=null;
    this.sidechainLFO=null;
    this.reverb=null;
    this.tempo=110;
    this.song='citypop';
    this.isRunning=false; this.tick=0;
    this.glide=null; // continuous synth
  }
  init(){
    if(this.ctx) return;
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    const c=this.ctx;
    this.master=c.createGain(); this.master.gain.value=0.9;
    this.musicBus=new Bus(c); this.drumBus=new Bus(c);
    // sidechain duck on music bus
    const sc=c.createGain(); sc.gain.value=1.0;
    this.sidechainLFO=c.createOscillator(); this.sidechainLFO.type='sine'; this.sidechainLFO.frequency.value=2;
    const scAmt=c.createGain(); scAmt.gain.value=0.18;
    this.sidechainLFO.connect(scAmt); scAmt.connect(sc.gain);
    this.musicBus.connect(sc); sc.connect(this.master);
    this.drumBus.connect(this.master);

    // Reverb send
    const convolver=c.createConvolver(); convolver.buffer=this._impulse(2.5);
    const revGain=c.createGain(); revGain.gain.value=0.25;
    this.musicBus.g.connect(convolver); convolver.connect(revGain); revGain.connect(this.master);
    this.reverb={convolver,revGain};

    // master
    this.master.connect(c.destination);
    this.sidechainLFO.start();
  }
  _impulse(seconds=2){
    const c=this.ctx, len=c.sampleRate*seconds;
    const b=c.createBuffer(2, len, c.sampleRate);
    for(let ch=0; ch<2; ch++){
      const d=b.getChannelData(ch);
      for(let i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8); }
    }
    return b;
  }
  setReverb(sec){
    this.reverb.convolver.buffer=this._impulse(sec);
  }

  // --- Synth building blocks
  polyNote(freq, dur=.3, {type='triangle', cutoff=8000, gain=0.18, at=0.01, rt=0.2}={}){
    this.init(); const c=this.ctx;
    const o=c.createOscillator(); o.type=type; o.frequency.value=freq;
    const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cutoff;
    const g=c.createGain(); g.gain.value=0; o.connect(f); f.connect(g); g.connect(this.musicBus.g);
    const now=c.currentTime;
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(gain, now+at);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur+rt);
    o.start(now); o.stop(now+dur+rt+0.05);
  }
  drumKick(){
    this.init(); const c=this.ctx;
    const o=c.createOscillator(); const g=c.createGain(); g.gain.value=1; o.type='sine';
    o.connect(g); g.connect(this.drumBus.g);
    const n=c.currentTime;
    o.frequency.setValueAtTime(150,n); o.frequency.exponentialRampToValueAtTime(45,n+.12);
    g.gain.setValueAtTime(.9,n); g.gain.exponentialRampToValueAtTime(.001,n+.18);
    o.start(n); o.stop(n+.21);
  }
  drumSnare(){
    this.init(); const c=this.ctx;
    const b=c.createBuffer(1, 22050, c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2); }
    const s=c.createBufferSource(); s.buffer=b;
    const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=1800;
    const g=c.createGain(); g.gain.value=.5;
    s.connect(f); f.connect(g); g.connect(this.drumBus.g);
    s.start(); s.stop(c.currentTime+.12);
  }
  hat(){
    this.init(); const c=this.ctx;
    const b=c.createBuffer(1, 10000, c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const s=c.createBufferSource(); s.buffer=b;
    const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000;
    const g=c.createGain(); g.gain.value=.22;
    s.connect(f); f.connect(g); g.connect(this.drumBus.g);
    s.start(); s.stop(c.currentTime+.05);
  }

  startLoop(step){
    if(this.isRunning) return; this.isRunning=true;
    const tick=()=>{
      if(!this.isRunning) return;
      step(this.tick);
      this.tick=(this.tick+1)%64;
      const interval = 60000/(this.tempo*4); // 16th
      this._to=setTimeout(tick, interval);
    }; tick();
  }
  stopLoop(){ this.isRunning=false; clearTimeout(this._to); }

  midiToFreq(m){ return 440*Math.pow(2,(m-69)/12) }
  scale(name='citypop'){
    if(name==='citypop') return [57,61,64,66,69,73,76,81]; // A Dorian-ish
    if(name==='synthwave') return [57,60,64,65,69,72,76,77];
    if(name==='lofi') return [52,55,59,62,64,67,71];
    return [60,62,64,65,67,69,71,72];
  }
  chords(name='citypop'){
    if(name==='citypop') return [[57,64,69],[54,61,66],[52,59,64],[55,62,67]]; // Amaj7 F#m7 E6 Bm7
    if(name==='synthwave') return [[57,60,64],[50,57,62],[55,60,64],[53,57,62]]; // Am F C G-ish
    if(name==='lofi') return [[52,59,64],[47,54,59],[50,57,62],[52,59,64]];
    return [[60,64,67],[62,65,69],[57,60,64],[55,60,64]];
  }

  // continuous glide synth for swipe
  startGlide(){
    this.init(); if(this.glide) return;
    const c=this.ctx;
    const o=c.createOscillator(); o.type='sawtooth';
    const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1800;
    const g=c.createGain(); g.gain.value=0;
    o.connect(f); f.connect(g); g.connect(this.musicBus.g);

    const lfo=c.createOscillator(); lfo.frequency.value=6;
    const lfoGain=c.createGain(); lfoGain.gain.value=40; // gentle vibrato
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);

    const now=c.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.25, now+0.06);

    o.frequency.setValueAtTime(220, now);
    o.start(now); lfo.start(now);

    this.glide={o,g,f,lfo,lfoGain};
  }
  stopGlide(){
    if(!this.glide) return;
    const c=this.ctx, {o,g,lfo}=this.glide;
    const now=c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setTargetAtTime(0, now, 0.08);
    setTimeout(()=>{ try{o.stop();lfo.stop();}catch(e){} this.glide=null; }, 150);
  }
  glideToFreq(freq){
    if(!this.glide) return;
    const now=this.ctx.currentTime;
    this.glide.o.frequency.cancelScheduledValues(now);
    this.glide.o.frequency.setTargetAtTime(freq, now, 0.04); // portamento
    // small filter open on move
    this.glide.f.frequency.setTargetAtTime(2500, now, 0.05);
    this.glide.f.frequency.setTargetAtTime(1800, now+0.08, 0.2);
  }
}
const engine=new Engine();

// ---------- Visuals: glow trails, ripples, floating blobs ----------
const cvs=document.getElementById('bg'); const ctx=cvs.getContext('2d');
function resize(){ cvs.width=innerWidth; cvs.height=innerHeight; } resize(); addEventListener('resize', resize);

let trails=[]; let blobs=[];
function spawnTrail(x,y,color){
  trails.push({x,y, vx:rand(-.5,.5), vy:rand(-.5,.5), r:rand(6,12), life:1, color});
}
function spawnBlob(){
  const size=rand(80,180), x=rand(0,innerWidth), y=rand(0,innerHeight);
  blobs.push({x,y, r:size, vx:rand(-.2,.2), vy:rand(-.15,.15), hue:rand(0,360)});
}
for(let i=0;i<16;i++) spawnBlob();

function draw(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  // floating blobs
  for(const b of blobs){
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<-200) b.x=innerWidth+200; if(b.x>innerWidth+200) b.x=-200;
    if(b.y<-200) b.y=innerHeight+200; if(b.y>innerHeight+200) b.y=-200;
    ctx.globalCompositeOperation='screen'; ctx.globalAlpha=.12;
    const grad=ctx.createRadialGradient(b.x,b.y,1,b.x,b.y,b.r);
    const c1=getComputedStyle(document.documentElement).getPropertyValue('--neon').trim();
    grad.addColorStop(0, c1); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
  }
  // trails
  for(let i=trails.length-1;i>=0;i--){
    const t=trails[i];
    t.x+=t.vx; t.y+=t.vy; t.life-=0.016; if(t.life<=0){trails.splice(i,1); continue;}
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=t.life*0.9;
    const g=ctx.createRadialGradient(t.x,t.y,1,t.x,t.y,t.r);
    g.addColorStop(0, t.color); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(t.x,t.y,t.r,0,Math.PI*2); ctx.fill();
  }
  requestAnimationFrame(draw);
} draw();

// ---------- Grid & swipe interaction ----------
const grid = document.getElementById('grid');
const pads=[]; const COLS=8, ROWS=5;
function buildGrid(){
  grid.innerHTML='';
  for(let i=0;i<COLS*ROWS;i++){
    const p=document.createElement('div'); p.className='pad'; p.dataset.index=i;
    grid.appendChild(p); pads.push(p);
  }
}
buildGrid();

function padAt(x,y){
  const el=document.elementFromPoint(x,y);
  if(!el) return null;
  return el.classList.contains('pad')?el:null;
}
function ripple(p){
  const r=document.createElement('div');
  r.className='ripple';
  const rect=p.getBoundingClientRect();
  r.style.left = (event.clientX - rect.left) + 'px';
  r.style.top  = (event.clientY - rect.top) + 'px';
  p.appendChild(r);
  const size=Math.max(rect.width, rect.height);
  r.animate([{width:'0px',height:'0px',opacity:0.95},{width:size+'px',height:size+'px',opacity:0}],{duration:500, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>r.remove();
  p.classList.add('active'); setTimeout(()=>p.classList.remove('active'),120);
}

const themeSel=document.getElementById('themeSel');
const songSel=document.getElementById('songSel');
const autoBtn=document.getElementById('autoBtn');
const tempo=document.getElementById('tempo'); const tempoVal=document.getElementById('tempoVal');
const glow=document.getElementById('glow'); const reverb=document.getElementById('reverb');

function setTheme(name){ document.body.className='theme-'+name; }
themeSel.onchange=e=>setTheme(e.target.value);
songSel.onchange=e=>engine.song=e.target.value;
tempo.oninput=e=>{ engine.tempo=+e.target.value; tempoVal.textContent=e.target.value; }
reverb.oninput=e=>engine.setReverb(0.8 + (+e.target.value)/100*2.5);

let touching=false, lastPad=null;
function onDown(e){ touching=true; engine.init(); engine.startGlide(); onMove(e); }
function onUp(){ touching=false; engine.stopGlide(); lastPad=null; }
function onMove(e){
  if(!touching) return;
  const x=e.clientX?? (e.touches && e.touches[0].clientX);
  const y=e.clientY?? (e.touches && e.touches[0].clientY);
  if(x==null) return;
  const pad=padAt(x,y);
  const c = getComputedStyle(document.documentElement);
  const color=c.getPropertyValue('--accent').trim();
  spawnTrail(x,y,color);
  if(pad && pad!==lastPad){
    const scale=engine.scale(engine.song);
    const i=+pad.dataset.index;
    const col=i%COLS, row=Math.floor(i/COLS);
    const base=scale[(col)%scale.length];
    const midi=base + (row>2?12:0);
    engine.glideToFreq(engine.midiToFreq(midi));
    ripple(pad);
    lastPad=pad;
  }
}

document.addEventListener('pointerdown', onDown, {passive:false});
document.addEventListener('pointerup', onUp, {passive:false});
document.addEventListener('pointercancel', onUp, {passive:false});
document.addEventListener('pointermove', onMove, {passive:false});

// ---------- Auto music: chords + bass + drums ----------
let auto=false; autoBtn.onclick=()=>{ auto=!auto; autoBtn.classList.toggle('active', auto); if(auto) engine.startLoop(step); else engine.stopLoop(); };

let chordStep=0;
function step(t){
  const s=engine.song;
  const cp=engine.chords(s); // 4-bar loop
  // Drums
  const i=t%16;
  if(i%4===0) engine.drumKick();
  if(i===4||i===12) engine.drumSnare();
  if(i%2===1) engine.hat();

  // Chords every quarter
  if(i%4===0){
    const ch=cp[(Math.floor(t/4))%cp.length];
    for(const m of ch){
      engine.polyNote(engine.midiToFreq(m), .6, {type:'triangle', cutoff:3600, gain:.14, at:.02, rt:.35});
    }
    // Bass
    engine.polyNote(engine.midiToFreq(ch[0]-12), .4, {type:'sawtooth', cutoff:1200, gain:.18, at:.005, rt:.1});
  }
}

// Unlock audio on first touch
document.body.addEventListener('pointerdown', ()=>engine.init(), {once:true});

// initial theme
setTheme('neon');
