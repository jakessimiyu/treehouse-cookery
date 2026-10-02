'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

type L={id:string;name:string;qty:number;price:number};
type O={no:number;status:string;items:L[];total:number;notes:string;pickup:string;receipt?:string;version:number;
 createdAt:number;paidAt?:number;acceptedAt?:number;preparingAt?:number;readyAt?:number;completedAt?:number};
type Entry={o:O;at:number};
type Plan={asap:boolean;pickup:number;by:number};
type Kind='new'|'urgent'|'later'|'cooking'|'ready';

// ---- tune these to your kitchen ----
const PREP_BASE=7,PER_ITEM=1,PREP_MAX=20;   // minutes to prepare: base + extra per additional item, capped
const URGENT_MIN=10;                         // start-now window: minutes of slack before "prepare by"
const READY_WAIT_MIN=5;                      // food waiting on the counter longer than this turns red
const lvl=(min:number)=>min>=4?3:min>=2?2:min>=1?1:0;
const GAP=[25,20,15,10];
const VOL=[.4,.55,.7,.85];
const PAT=[[880,1175,1568],[880,1175,1568,1175],[1175,880,1175,880,1568],[1568,1175,1568,1175,1568,1175]];
const EAT=3*3600000,DAY=86400000;

const SHOW=['PAID','PREPARING','READY','COMPLETED'];
const BACK:Record<string,string>={PREPARING:'PAID',READY:'PREPARING',COMPLETED:'READY'};
const LABEL:Record<string,string>={PREPARING:'Cooking',READY:'Ready',COMPLETED:'Done'};

const clock=(ms:number)=>new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'Africa/Nairobi'})
 .replace(/\s?([AP])M/i,(_,x:string)=>' '+x.toLowerCase()+'m');
const fc=(ms:number)=>{const s=Math.max(0,Math.round(ms/1000));
 if(s>=3600)return `${Math.floor(s/3600)}h ${String(Math.floor(s%3600/60)).padStart(2,'0')}m`;
 return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};

// Sauces arrive as "Item: Sauce; Item: Sauce | customer note". Separate them so each sauce sits under its item.
function split(o:O){
 const parts=o.notes?o.notes.split(' | '):[];const sauce:Record<string,string>={};let rest=parts;
 if(parts[0]){
  const segs=parts[0].split('; ');
  const ok=segs.every(s=>{const i=s.lastIndexOf(': ');return i>0&&o.items.some(x=>x.name===s.slice(0,i))});
  if(ok){segs.forEach(s=>{const i=s.lastIndexOf(': ');sauce[s.slice(0,i)]=s.slice(i+2)});rest=parts.slice(1)}
 }
 return{sauce,note:rest.join(' | ')};
}

function plan(o:O):Plan{
 const base=o.paidAt||o.createdAt;
 const qty=o.items.reduce((a,i)=>a+i.qty,0);
 const prep=Math.min(PREP_MAX,PREP_BASE+Math.max(0,qty-1)*PER_ITEM)*60000;
 const p=o.pickup.trim();let at:number|null=null;
 const rel=/^In (\d+) min$/i.exec(p);
 if(rel)at=o.createdAt+Number(rel[1])*60000;
 else{
  const k=/^At (\d{1,2}):(\d{2}) ?(am|pm)$/i.exec(p);
  if(k){let h=Number(k[1])%12;if(k[3].toLowerCase()==='pm')h+=12;
   at=Math.floor((o.createdAt+EAT)/DAY)*DAY-EAT+(h*60+Number(k[2]))*60000}
 }
 if(at===null)return{asap:true,pickup:base+prep,by:base};
 return{asap:false,pickup:at,by:at-prep};
}

function ding(c:AudioContext|null,level:number){
 if(!c)return;
 try{
  if(c.state==='suspended')c.resume();
  const sq=level>=2,step=sq?.15:.17,peak=VOL[level]*(sq?.45:1);
  PAT[level].forEach((f,i)=>{
   const o=c.createOscillator(),g=c.createGain();o.type=sq?'square':'triangle';o.frequency.value=f;o.connect(g);g.connect(c.destination);
   const t=c.currentTime+i*step;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.02);
   g.gain.exponentialRampToValueAtTime(.0001,t+.4);o.start(t);o.stop(t+.45);
  });
  if(level>=2)navigator.vibrate?.([200,100,200]);
 }catch{}
}

function Card({o,p,t,kind,busy,onAccept,onMove}:{o:O;p:Plan;t:number;kind:Kind;busy:boolean;onAccept:(o:O)=>void;onMove:(o:O,to:string)=>void}){
 const {sauce,note}=split(o);
 const slack=p.by-t,due=p.pickup-t;
 const un=t-(o.paidAt||o.createdAt);

 // one status line that tells the cook what to do right now
 let tag='',tone='';
 if(kind==='new'){tag=un>=60000?`Waiting ${fc(un)} to accept`:'New order';tone='new'}
 else if(kind==='urgent'){tag=slack<=0?'Start now':`Start in ${fc(slack)}`;tone='urgent'}
 else if(kind==='later'){tag=`Start in ${fc(slack)}`;tone='later'}
 else if(kind==='cooking'){tag=due<=0?`Late by ${fc(-due)}`:`Due in ${fc(due)}`;tone=due<=0?'urgent':due<=120000?'soon':'cooking'}
 else{const w=t-(o.readyAt||t);tag=`Waiting ${fc(w)}`;tone=w>=READY_WAIT_MIN*60000?'urgent':'ready'}

 const high=slack<=URGENT_MIN*60000;
 const prim=kind==='new'?(high?{l:'Start preparing',f:()=>onMove(o,'PREPARING'),c:'p-red'}:{l:'Accept order',f:()=>onAccept(o),c:'p-dark'})
  :(kind==='urgent'||kind==='later')?{l:'Start preparing',f:()=>onMove(o,'PREPARING'),c:kind==='urgent'?'p-red':'p-dark'}
  :kind==='cooking'?{l:'Mark ready',f:()=>onMove(o,'READY'),c:'p-green'}
  :{l:'Handed over',f:()=>onMove(o,'COMPLETED'),c:'p-dark'};
 const alt=kind==='new'?(high?{l:'Accept, start later',f:()=>onAccept(o)}:{l:'Start now',f:()=>onMove(o,'PREPARING')}):null;

 return <article className={`k2-card t-${tone}`}>
  <header className="k2-ch">
   <b className="k2-no">#{o.no}</b>
   <span className={`k2-tag t-${tone}`}>{tag}</span>
  </header>
  <div className="k2-when">
   <span>Pickup <b>{p.asap?'ASAP':clock(p.pickup)}</b></span>
   {(kind==='new'||kind==='urgent'||kind==='later')&&!p.asap&&<span>Prepare by <b>{clock(p.by)}</b></span>}
   <span className="k2-ph">Placed {clock(o.createdAt)}</span>
  </div>
  <ul className="k2-items">{o.items.map(i=><li key={i.id}>
   <b className="k2-q">{i.qty}×</b>
   <span className="k2-n">{i.name}{sauce[i.name]&&<em>{sauce[i.name]}</em>}</span></li>)}</ul>
  {note&&<div className="k2-note"><b>Customer note</b><p>{note}</p></div>}
  <div className="k2-acts">
   <button type="button" className={`k2-btn ${prim.c}`} disabled={busy} onClick={prim.f}>{busy?'Please wait…':prim.l}</button>
   {alt&&<button type="button" className="k2-link" disabled={busy} onClick={alt.f}>{alt.l}</button>}
  </div>
 </article>;
}

const CSS=`
.k2{position:fixed;inset:0;height:100vh;height:100dvh;overflow:hidden;z-index:60;display:flex;flex-direction:column;background:#f4f5f7;color:#14181f;
 font-family:var(--body),system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.k2 *{box-sizing:border-box;min-width:0}
.k2 button{font-family:inherit;cursor:pointer}
.k2 button:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
.k2-bar{flex:none;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-bottom:1px solid #dde1e7;flex-wrap:wrap}
.k2-logo{font-family:var(--display),Georgia,serif;font-size:26px;margin-right:auto}
.k2-clock{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
.k2-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#eceff3;color:#14181f;border:0;font-size:15px;font-weight:600}
.k2-pill i{width:10px;height:10px;border-radius:50%;background:#9ca3af}
.k2-pill.live i{background:#16a34a}.k2-pill.retry i{background:#f59e0b}.k2-pill.down{background:#fee2e2;color:#991b1b}.k2-pill.down i{background:#dc2626}
.k2-pill.warn{background:#fef3c7;color:#92400e}
.k2-off{flex:none;background:#dc2626;color:#fff;padding:12px 16px;font-weight:700;font-size:17px;text-align:center}
.k2-alert{flex:none;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:14px 16px;background:#dc2626;color:#fff;animation:k2p 1.4s ease-in-out infinite}
.k2-alert b{font-size:26px}.k2-alert span{font-size:22px;font-weight:700}
.k2-alert button{border:0;border-radius:999px;background:#fff;color:#b91c1c;font-size:18px;font-weight:800;padding:12px 24px}
@keyframes k2p{50%{background:#b91c1c}}
@media (prefers-reduced-motion:reduce){.k2-alert{animation:none}}
.k2-tabs{display:none}
/* the board fills the space under the bars; each column scrolls on its own */
.k2-board{flex:1 1 0;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:minmax(0,1fr);gap:12px;padding:12px;overflow:hidden}
.k2-col{display:flex;flex-direction:column;min-height:0;height:100%;background:#fff;border:1px solid #dde1e7;border-radius:18px;overflow:hidden}
.k2-ch2{flex:none;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:4px solid var(--c)}
.k2-ch2 h2{margin:0;font-size:22px;font-weight:800}
.k2-ch2 small{display:block;font-size:14px;color:#5b6573;margin-top:2px}
.k2-cnt{min-width:40px;height:40px;border-radius:20px;background:var(--c);color:#fff;display:grid;place-items:center;font-size:20px;font-weight:800;padding:0 10px}
.k2-list{flex:1 1 0;min-height:0;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;padding:12px 12px 110px;display:flex;flex-direction:column;gap:12px;background:#f4f5f7;-webkit-overflow-scrolling:touch}
.k2-list>*{flex:none}
.k2-empty{padding:28px 12px;text-align:center;color:#6b7482;font-size:17px;line-height:1.4}
.k2-card{background:#fff;border-radius:16px;padding:16px;border:1px solid #dde1e7;border-left:8px solid #94a3b8;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(20,24,31,.08)}
.k2-card.t-new{border-color:#dc2626;border-left-color:#dc2626;box-shadow:0 0 0 2px #dc2626}
.k2-card.t-urgent{border-left-color:#f59e0b}
.k2-card.t-later{border-left-color:#94a3b8}
.k2-card.t-cooking,.k2-card.t-soon{border-left-color:#0284c7}
.k2-card.t-ready{border-left-color:#16a34a}
.k2-ch{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.k2-no{font-size:40px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.k2-tag{padding:8px 14px;border-radius:999px;font-size:17px;font-weight:800;background:#e5e8ed;color:#334155;white-space:nowrap}
.k2-tag.t-new{background:#dc2626;color:#fff}.k2-tag.t-urgent{background:#f59e0b;color:#1a1200}
.k2-tag.t-soon{background:#fde68a;color:#451a03}.k2-tag.t-cooking{background:#e0f2fe;color:#075985}.k2-tag.t-ready{background:#dcfce7;color:#166534}
.k2-when{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:17px;color:#4b5563}
.k2-when b{color:#14181f;font-size:19px}
.k2-ph{color:#6b7482;font-size:15px}
.k2-items{list-style:none;margin:0;padding:12px 0;border-top:1px solid #e5e8ed;border-bottom:1px solid #e5e8ed;display:flex;flex-direction:column;gap:10px}
.k2-items li{display:flex;gap:12px;align-items:baseline}
.k2-q{font-size:26px;color:#dc2626;min-width:44px;font-variant-numeric:tabular-nums}
.k2-n{font-size:23px;font-weight:700;line-height:1.25;overflow-wrap:anywhere}
.k2-n em{display:block;font-style:normal;font-size:17px;font-weight:600;color:#b45309;margin-top:2px}
.k2-note{background:#fef3c7;color:#451a03;border:1px solid #f59e0b;border-radius:12px;padding:12px 14px}
.k2-note b{font-size:15px}.k2-note p{margin:4px 0 0;font-size:20px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}
.k2-acts{display:flex;flex-direction:column;gap:8px}
.k2-btn{min-height:66px;border:0;border-radius:14px;font-size:22px;font-weight:800;color:#fff;width:100%}
.k2-btn:active{transform:scale(.99)}.k2-btn:disabled{opacity:.55}
.p-red{background:#dc2626}.p-green{background:#16a34a}.p-dark{background:#1f2937}
.k2-link{background:none;border:0;color:#374151;font-size:17px;font-weight:600;padding:10px;text-decoration:underline}
.k2-done{margin-top:4px;background:#fff;border:1px solid #dde1e7;border-radius:14px;padding:4px 12px}
.k2-done summary{cursor:pointer;padding:12px 0;font-weight:700;font-size:17px;color:#374151}
.k2-done ul{list-style:none;margin:0;padding:0 0 8px;display:flex;flex-direction:column;gap:8px}
.k2-done li{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:16px;color:#374151}
.k2-done li button{border:0;border-radius:10px;background:#e5e8ed;color:#14181f;padding:10px 12px;font-size:15px;font-weight:600;white-space:nowrap}
.k2-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:14px;background:#14181f;color:#fff;
 border-radius:999px;padding:14px 22px;font-size:18px;font-weight:700;box-shadow:0 8px 30px rgba(0,0,0,.25);max-width:calc(100% - 24px)}
.k2-toast button{border:0;background:#fff;color:#14181f;border-radius:999px;padding:8px 16px;font-weight:700;font-size:16px}
.k2-gate{display:grid;place-items:center;padding:20px}
.k2-gate form{width:min(420px,100%);display:flex;flex-direction:column;gap:14px}
.k2-gate h1{margin:0;font-family:var(--display),Georgia,serif;font-size:36px}
.k2-gate p{margin:0;color:#4b5563;font-size:17px;line-height:1.4}
.k2-gate input{padding:16px;border-radius:12px;border:2px solid #cbd2da;background:#fff;color:#14181f;font-size:18px}
.k2-gate .k2-err{color:#b91c1c;font-weight:700}
@media (max-width:899px){
 .k2-tabs{flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 12px 0}
 .k2-tabs button{border:0;border-radius:14px;background:#fff;color:#14181f;box-shadow:inset 0 0 0 1px #dde1e7;padding:10px 6px;font-size:16px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:2px}
 .k2-tabs button b{font-size:26px;line-height:1}
 .k2-tabs button.on{background:#14181f;color:#fff}
 .k2-tabs button.hot{background:#dc2626;color:#fff}
 .k2-board{display:flex;flex-direction:column}
 .k2-col{display:none;flex:1 1 0;height:auto}.k2-col.on{display:flex}
 .k2-ch2{display:none}
 .k2-no{font-size:36px}
}
`;

export default function Kitchen(){
 const [key,setKey]=useState('');const [keyIn,setKeyIn]=useState('');const [started,setStarted]=useState(false);const [authErr,setAuthErr]=useState('');
 const [map,setMap]=useState<Record<number,Entry>>({});
 const [now,setNow]=useState(0);const [up,setUp]=useState(false);const [lastSync,setLastSync]=useState(0);
 const [muted,setMuted]=useState(false);const [audioOn,setAudioOn]=useState(true);
 const [busy,setBusy]=useState<Record<number,boolean>>({});
 const [toast,setToast]=useState<{text:string;undo?:()=>void}|null>(null);const [view,setView]=useState<'todo'|'cooking'|'ready'>('todo');
 const offset=useRef(0),lastId=useRef(0),lastBeat=useRef(0),lastPlay=useRef(0);
 const ctx=useRef<AudioContext|null>(null),tt=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const chimed=useRef<Set<number>>(new Set()),seenU=useRef<Set<number>|null>(null);
 const mapRef=useRef(map);mapRef.current=map;

 useEffect(()=>{try{setKeyIn(localStorage.getItem('sk')||'')}catch{}},[]);
 const flash=useCallback((text:string,undo?:()=>void)=>{
  setToast({text,undo});clearTimeout(tt.current);tt.current=setTimeout(()=>setToast(null),undo?8000:5000);
 },[]);

 // apply one order snapshot; stale or duplicate events are ignored by version
 const handle=useCallback((o:O)=>{
  const had=mapRef.current[o.no];
  setMap(prev=>{
   const p=prev[o.no];if(p&&p.o.version>=o.version)return prev;
   const n={...prev};if(SHOW.includes(o.status))n[o.no]={o,at:Date.now()};else delete n[o.no];return n;
  });
  if(had&&o.status==='CANCELLED')flash(`Order #${o.no} was cancelled`);
 },[flash]);

 // full re-sync from the database (source of truth)
 const sync=useCallback(async()=>{
  if(!key)return false;const t0=Date.now();
  try{
   const r=await fetch('/api/kitchen/orders',{headers:{'x-staff-key':key},cache:'no-store'});
   if(r.status===401){setAuthErr('That staff key was not accepted.');setStarted(false);setUp(false);return false}
   if(!r.ok)return false;
   const j:{orders:O[];lastEventId:number;serverTime:number}=await r.json();
   offset.current=j.serverTime-Date.now();
   if(j.lastEventId>lastId.current)lastId.current=j.lastEventId;
   const seen=new Set(j.orders.map(o=>o.no));
   Object.values(mapRef.current).forEach(p=>{if(!seen.has(p.o.no)&&p.at<t0&&p.o.status!=='COMPLETED')flash(`Order #${p.o.no} is no longer active`)});
   setMap(prev=>{
    const n:Record<number,Entry>={};
    for(const o of j.orders){const p=prev[o.no];n[o.no]=p&&p.o.version>o.version?p:{o,at:Date.now()}}
    for(const k in prev){const p=prev[k];if(!n[k]&&p.at>=t0)n[k]=p}
    return n;
   });
   setLastSync(Date.now());return true;
  }catch{return false}
 },[key,flash]);

 // live stream with automatic resume
 useEffect(()=>{
  if(!started||!key)return;
  let es:EventSource|null=null,dead=false,fails=0,isUp=false,timer:ReturnType<typeof setTimeout>|undefined;
  const down=()=>{isUp=false;setUp(false)};
  const open=()=>{
   if(dead)return;clearTimeout(timer);es?.close();
   es=new EventSource(`/api/kitchen/stream?key=${encodeURIComponent(key)}&after=${lastId.current}`);
   es.onopen=()=>{fails=0;isUp=true;setUp(true);lastBeat.current=Date.now();sync()};
   es.onmessage=e=>{
    const n=Number(e.lastEventId);if(n>lastId.current)lastId.current=n;lastBeat.current=Date.now();
    try{handle(JSON.parse(e.data))}catch{}
   };
   es.addEventListener('ping',e=>{
    lastBeat.current=Date.now();
    try{const d=JSON.parse((e as MessageEvent).data);offset.current=d.t-Date.now();if(d.c>lastId.current)lastId.current=d.c}catch{}
   });
   es.addEventListener('reconnect',()=>open());
   es.addEventListener('db-error',()=>{es?.close();down();fails=Math.max(fails,3);timer=setTimeout(open,15000)}); // database down: wait, don't hammer it
   es.onerror=()=>{es?.close();down();fails++;timer=setTimeout(open,Math.min(1000*2**fails,10000))};
  };
  open();
  const wd=setInterval(()=>{if(isUp&&Date.now()-lastBeat.current>25000){es?.close();down();open()}},5000);
  const wake=()=>{if(!document.hidden&&!isUp)open()};
  document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);
  return()=>{dead=true;clearTimeout(timer);clearInterval(wd);es?.close();
   document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake)};
 },[started,key,sync,handle]);

 // safety net: re-sync every 10s and whenever the screen wakes or the network returns
 useEffect(()=>{
  if(!started)return;
  sync();
  const i=setInterval(()=>{if(!document.hidden)sync()},10000);
  const v=()=>{if(!document.hidden)sync()};
  document.addEventListener('visibilitychange',v);window.addEventListener('online',v);
  return()=>{clearInterval(i);document.removeEventListener('visibilitychange',v);window.removeEventListener('online',v)};
 },[started,sync]);
 useEffect(()=>{
  if(!started)return;
  const i=setInterval(()=>{setNow(Date.now());setAudioOn(!ctx.current||ctx.current.state==='running')},1000);
  return()=>clearInterval(i);
 },[started]);

 // keep the screen awake
 useEffect(()=>{
  if(!started)return;
  type WL={request:(k:'screen')=>Promise<{release:()=>Promise<void>}>};
  const wl=(navigator as Navigator&{wakeLock?:WL}).wakeLock;if(!wl)return;
  let lock:{release:()=>Promise<void>}|null=null,dead=false;
  const get=()=>{wl.request('screen').then(l=>{if(dead)l.release().catch(()=>{});else lock=l}).catch(()=>{})};
  get();const v=()=>{if(!document.hidden)get()};document.addEventListener('visibilitychange',v);
  return()=>{dead=true;document.removeEventListener('visibilitychange',v);lock?.release().catch(()=>{})};
 },[started]);

 // ---- derived view ----
 const t=now+offset.current;
 const orders=Object.values(map).map(x=>x.o);
 const P:Record<number,Plan>={};orders.forEach(o=>{P[o.no]=plan(o)});
 const age=(o:O)=>o.paidAt||o.createdAt;
 const byBy=(a:O,b:O)=>P[a.no].by-P[b.no].by||age(a)-age(b);
 const nw:O[]=[],ur:O[]=[],lt:O[]=[],cook:O[]=[],rdy:O[]=[];
 orders.forEach(o=>{
  if(o.status==='PREPARING')cook.push(o);
  else if(o.status==='READY')rdy.push(o);
  else if(o.status==='PAID'){
   if(!o.acceptedAt)nw.push(o);
   else if(P[o.no].by-t<=URGENT_MIN*60000)ur.push(o);
   else lt.push(o);
  }
 });
 nw.sort(byBy);ur.sort(byBy);lt.sort(byBy);
 cook.sort((a,b)=>P[a.no].pickup-P[b.no].pickup||age(a)-age(b));
 rdy.sort((a,b)=>(a.readyAt||0)-(b.readyAt||0));
 const todo:{o:O;kind:Kind}[]=[...nw.map(o=>({o,kind:'new' as Kind})),...ur.map(o=>({o,kind:'urgent' as Kind})),...lt.map(o=>({o,kind:'later' as Kind}))];
 const done=orders.filter(o=>o.status==='COMPLETED').sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,10);

 const hasNew=nw.length>0;
 const oldest=hasNew?Math.max(...nw.map(o=>t-age(o))):0;
 const newCount=nw.length,urgentKey=ur.map(o=>o.no).join(','),synced=lastSync>0;

 // sound: chime on arrival, then repeat with rising urgency until accepted
 useEffect(()=>{
  if(!started||muted)return;
  const tick=()=>{
   const tt2=Date.now()+offset.current;
   const list=Object.values(mapRef.current).map(x=>x.o).filter(o=>o.status==='PAID'&&!o.acceptedAt);
   if(!list.length)return;
   const level=lvl(Math.max(...list.map(o=>tt2-(o.paidAt||o.createdAt)))/60000);
   const since=Date.now()-lastPlay.current;
   const fresh=list.some(o=>!chimed.current.has(o.no));
   if((fresh&&since>=3000)||since>=GAP[level]*1000){
    list.forEach(o=>chimed.current.add(o.no));lastPlay.current=Date.now();ding(ctx.current,level);
   }
  };
  const i=setInterval(tick,1000);tick();return()=>clearInterval(i);
 },[started,muted]);

 // an accepted order has just become urgent: say so once
 useEffect(()=>{
  if(!synced)return;
  const ids=urgentKey?urgentKey.split(',').map(Number):[];
  if(!seenU.current){seenU.current=new Set(ids);return}
  const fresh=ids.filter(n=>!seenU.current!.has(n));
  ids.forEach(n=>seenU.current!.add(n));
  if(fresh.length){
   flash(`Start now: ${fresh.map(n=>'#'+n).join(' ')}`);
   if(!muted&&Date.now()-lastPlay.current>3000){lastPlay.current=Date.now();ding(ctx.current,0)}
  }
 },[urgentKey,synced,muted,flash]);

 useEffect(()=>{
  const base='Kitchen | Treehouse';
  if(!newCount){document.title=base;return}
  let on=true;const i=setInterval(()=>{document.title=on?`🔴 (${newCount}) NEW ORDER`:base;on=!on},900);
  return()=>{clearInterval(i);document.title=base};
 },[newCount]);

 // ---- actions ----
 const begin=()=>{
  const k=keyIn.trim();if(!k){setAuthErr('Enter the staff key.');return}
  try{
   const C=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
   ctx.current=ctx.current||new C();ctx.current.resume().catch(()=>{});
  }catch{}
  ding(ctx.current,0);
  try{localStorage.setItem('sk',k)}catch{}
  setAuthErr('');setKey(k);setNow(Date.now());setStarted(true);
 };
 const unlock=()=>{ctx.current?.resume().then(()=>{setAudioOn(true);ding(ctx.current,0)}).catch(()=>{})};
 const patch=async(no:number,body:object)=>{
  const r=await fetch(`/api/kitchen/orders/${no}`,{method:'PATCH',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j:{ok?:boolean;order?:O;error?:string}=await r.json().catch(()=>({}));
  return j;
 };
 const setB=(no:number,on:boolean)=>setBusy(b=>{const n={...b};if(on)n[no]=true;else delete n[no];return n});
 const accept=async(o:O)=>{
  seenU.current?.add(o.no);setB(o.no,true);
  try{
   const j=await patch(o.no,{action:'accept'});
   if(j.order)handle(j.order);
   if(!j.ok){flash(j.error?`#${o.no}: ${j.error}`:'Could not accept. Nothing was changed.');sync()}
  }catch{flash('No connection. The order was NOT accepted.')}
  finally{setB(o.no,false)}
 };
 const move=async(o:O,to:string,undo=false)=>{
  seenU.current?.add(o.no);setB(o.no,true);
  try{
   const j=await patch(o.no,{to});
   if(j.order)handle(j.order);
   if(j.ok){const back=BACK[to];if(!undo&&back)flash(`#${o.no} moved to ${LABEL[to]}`,()=>move({...o,status:to},back,true))}
   else{flash(j.error?`#${o.no}: ${j.error}`:'Could not update. Nothing was changed.');sync()}
  }catch{flash('No connection. The order was NOT updated.')}
  finally{setB(o.no,false)}
 };
 const acceptAll=()=>{nw.forEach(o=>accept(o))};
 const fs=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()};

 if(!started)return <div className="k2 k2-gate"><style>{CSS}</style><form onSubmit={e=>{e.preventDefault();begin()}}>
  <h1>Kitchen display</h1><p>Enter the staff key and tap Start. This also turns on the sound alerts.</p>
  <input type="password" autoComplete="current-password" placeholder="Staff key" value={keyIn} onChange={e=>setKeyIn(e.target.value)}/>
  {authErr&&<p className="k2-err" role="alert">{authErr}</p>}
  <button className="k2-btn p-red">Start</button></form></div>;

 const offline=synced&&Date.now()-lastSync>=25000;
 const cls=offline?'down':up?'live':'retry';
 const label=offline?'Offline':up?'Live':synced?'Reconnecting…':'Connecting…';

 const cols:{k:'todo'|'cooking'|'ready';title:string;hint:string;color:string;n:number}[]=[
  {k:'todo',title:'To do',hint:'Accept, then start cooking',color:'#ef4444',n:todo.length},
  {k:'cooking',title:'Cooking',hint:'Mark ready when done',color:'#38bdf8',n:cook.length},
  {k:'ready',title:'Ready',hint:'Hand over at the counter',color:'#34d399',n:rdy.length}];

 return <div className="k2"><style>{CSS}</style>
  <div className="k2-bar">
   <b className="k2-logo">Kitchen</b>
   <span className="k2-clock">{clock(t)}</span>
   <span className={'k2-pill '+cls}><i/>{label}</span>
   {!audioOn&&!muted&&<button type="button" className="k2-pill warn" onClick={unlock}>🔇 Tap to enable sound</button>}
   <button type="button" className="k2-pill" onClick={()=>setMuted(m=>!m)}>{muted?'🔇 Sound off':'🔔 Sound on'}</button>
   <button type="button" className="k2-pill" onClick={fs} aria-label="Toggle full screen">⛶</button>
  </div>
  {offline&&<div className="k2-off" role="alert">Offline. New orders may be missing. Check the internet; everything syncs when it returns.</div>}
  {hasNew&&<div className="k2-alert" role="alert">
   <b>{oldest>=60000?`Unaccepted for ${Math.floor(oldest/60000)} min`:`New order${newCount>1?'s':''}`}</b>
   <span>{nw.map(o=>'#'+o.no).join('  ')}{muted?'  (sound is off)':''}</span>
   <button type="button" onClick={acceptAll}>Accept all ({newCount})</button></div>}

  <div className="k2-tabs">{cols.map(c=>
   <button key={c.k} type="button" className={(view===c.k?'on':'')+(c.k==='todo'&&hasNew?' hot':'')} onClick={()=>setView(c.k)}>
    <b>{c.n}</b><span>{c.title}</span></button>)}</div>

  <div className="k2-board">
   <section className={'k2-col'+(view==='todo'?' on':'')} style={{'--c':cols[0].color} as React.CSSProperties}>
    <div className="k2-ch2"><div><h2>To do</h2><small>{cols[0].hint}</small></div><span className="k2-cnt">{todo.length}</span></div>
    <div className="k2-list">
     {!todo.length&&<div className="k2-empty">No orders waiting. You will hear a chime the moment one arrives.</div>}
     {todo.map(({o,kind})=><Card key={o.no} o={o} p={P[o.no]} t={t} kind={kind} busy={!!busy[o.no]} onAccept={accept} onMove={move}/>)}
    </div></section>

   <section className={'k2-col'+(view==='cooking'?' on':'')} style={{'--c':cols[1].color} as React.CSSProperties}>
    <div className="k2-ch2"><div><h2>Cooking</h2><small>{cols[1].hint}</small></div><span className="k2-cnt">{cook.length}</span></div>
    <div className="k2-list">
     {!cook.length&&<div className="k2-empty">Nothing on the line.</div>}
     {cook.map(o=><Card key={o.no} o={o} p={P[o.no]} t={t} kind="cooking" busy={!!busy[o.no]} onAccept={accept} onMove={move}/>)}
    </div></section>

   <section className={'k2-col'+(view==='ready'?' on':'')} style={{'--c':cols[2].color} as React.CSSProperties}>
    <div className="k2-ch2"><div><h2>Ready</h2><small>{cols[2].hint}</small></div><span className="k2-cnt">{rdy.length}</span></div>
    <div className="k2-list">
     {!rdy.length&&<div className="k2-empty">Nothing waiting at the counter.</div>}
     {rdy.map(o=><Card key={o.no} o={o} p={P[o.no]} t={t} kind="ready" busy={!!busy[o.no]} onAccept={accept} onMove={move}/>)}
     {done.length>0&&<details className="k2-done"><summary>Recently done ({done.length})</summary>
      <ul>{done.map(o=><li key={o.no}><span><b>#{o.no}</b> {o.items.map(i=>`${i.qty}× ${i.name}`).join(', ')}</span>
       <button type="button" disabled={!!busy[o.no]} onClick={()=>move(o,'READY',true)}>Undo</button></li>)}</ul></details>}
    </div></section>
  </div>

  {toast&&<div className="k2-toast" role="status"><span>{toast.text}</span>{toast.undo&&<button type="button" onClick={()=>{toast.undo?.();setToast(null)}}>Undo</button>}</div>}
 </div>;}