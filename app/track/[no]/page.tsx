'use client';
import {use,useCallback,useEffect,useRef,useState} from 'react';import Link from 'next/link';
import {useCart,kes} from '@/lib/Cart';import {BRAND} from '@/components/config';
import {Pic} from '@/components/Dish';

type T={no:number;status:string;items:{id:string;name:string;qty:number;price:number}[];total:number;createdAt:number;paidAt?:number;payStart:number;pickup:string;ahead:number};
const TITLE:Record<string,string>={PENDING_PAYMENT:'Waiting for payment',PAID:'Order confirmed',PREPARING:'Preparing your order',READY:'READY! Come and get it',COMPLETED:'Order complete',CANCELLED:'Order cancelled',PAYMENT_FAILED:'Payment failed'};
const HEAD:Record<string,string>={PENDING_PAYMENT:'Check your phone',PAID:'Payment confirmed',PREPARING:'Cooking your order',READY:"It's ready!",COMPLETED:'Enjoy your meal',CANCELLED:'Order cancelled',PAYMENT_FAILED:'Payment not completed'};
const TOAST:Record<string,string>={PAID:'Payment confirmed ✓',PREPARING:'The kitchen has started your order',READY:'Your order is ready ✓',COMPLETED:'Order complete',PAYMENT_FAILED:'Payment not completed',CANCELLED:'Order cancelled'};
const PREP_BASE=7,PER_ORDER=2; // EDIT: minutes to cook one order, and extra minutes per order ahead of you
const EAT=3*3600000,DAY=86400000,CIRC=2*Math.PI*52;

function chime(){try{const C=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;const c=new C();
 [660,880].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.connect(g);g.connect(c.destination);
  const st=c.currentTime+i*.2;g.gain.setValueAtTime(.15,st);g.gain.exponentialRampToValueAtTime(.001,st+.35);o.start(st);o.stop(st+.35)})}catch{}}
const clock=(ms:number)=>new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'Africa/Nairobi'}).replace(/\s?([AP])M/i,(_,x:string)=>' '+x.toLowerCase()+'m');
// custom pickups arrive as "At 2:30 pm" (Nairobi time, same day the order was placed)
const parseSched=(pickup:string,created:number)=>{
 const m=/^At (\d{1,2}):(\d{2}) ?(am|pm)$/i.exec(pickup.trim());if(!m)return null;
 let h=Number(m[1])%12;if(m[3].toLowerCase()==='pm')h+=12;
 const day=Math.floor((created+EAT)/DAY)*DAY-EAT;
 return day+(h*60+Number(m[2]))*60000;
};

export default function Track({params}:{params:Promise<{no:string}>}){
 const {no}=use(params);const {setAll,setOpen}=useCart();
 const [t,setT]=useState<T|null>(null);const [missing,setMissing]=useState(false);const [offline,setOffline]=useState(false);
 const [now,setNow]=useState(Date.now());const [perm,setPerm]=useState('');const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
 const [toast,setToast]=useState('');const [party,setParty]=useState(false);
 const prev=useRef('');
 const toastT=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const partyT=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const status=t?.status||'';
 const done=status==='COMPLETED'||status==='CANCELLED';
 const waiting=status==='PENDING_PAYMENT'||status==='PAID'||status==='PREPARING';

 const load=useCallback(async()=>{try{
  const r=await fetch('/api/orders/'+no,{cache:'no-store'});
  if(r.status===404){setMissing(true);return}
  if(r.ok){setT(await r.json());setOffline(false)}}catch{setOffline(true)}},[no]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(done)return;
  const id=setInterval(()=>{if(!document.hidden)load()},3000);
  const vis=()=>{if(!document.hidden)load()};document.addEventListener('visibilitychange',vis);
  return()=>{clearInterval(id);document.removeEventListener('visibilitychange',vis)}},[load,done]);
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),status==='PENDING_PAYMENT'?1000:10000);return()=>clearInterval(id)},[status]);
 useEffect(()=>{try{setPerm(typeof Notification==='undefined'?'none':Notification.permission)}catch{setPerm('none')}},[]);
 useEffect(()=>()=>{clearTimeout(toastT.current);clearTimeout(partyT.current)},[]);

 // keep the screen awake while the customer is waiting (where the browser supports it)
 useEffect(()=>{if(!waiting)return;
  type WL={request:(k:'screen')=>Promise<{release:()=>Promise<void>}>};
  const wl=(navigator as Navigator&{wakeLock?:WL}).wakeLock;if(!wl)return;
  let lock:{release:()=>Promise<void>}|null=null;let dead=false;
  const get=()=>{wl.request('screen').then(l=>{if(dead)l.release().catch(()=>{});else lock=l}).catch(()=>{})};
  get();const vis=()=>{if(!document.hidden)get()};document.addEventListener('visibilitychange',vis);
  return()=>{dead=true;document.removeEventListener('visibilitychange',vis);lock?.release().catch(()=>{})}},[waiting]);

 useEffect(()=>{if(!t)return;const s=t.status;
  document.title=`${TITLE[s]||'Your order'} | #${t.no} | Treehouse`;
  if(prev.current&&prev.current!==s){
   if(TOAST[s]){setToast(TOAST[s]);clearTimeout(toastT.current);toastT.current=setTimeout(()=>setToast(''),5000)}
   if(s==='READY'){
    navigator.vibrate?.([200,100,200,100,400]);chime();
    setParty(true);clearTimeout(partyT.current);partyT.current=setTimeout(()=>setParty(false),5000);
    try{if(Notification.permission==='granted')new Notification(`Order #${t.no} is ready`,{body:'Come and pick it up.'})}catch{}
   }else if(s==='PAID')navigator.vibrate?.(80);
  }
  prev.current=s;
  try{const l:{no:number}[]=JSON.parse(localStorage.getItem('myOrders')||'[]');
   localStorage.setItem('myOrders',JSON.stringify([{no:t.no,ts:t.createdAt},...l.filter(x=>x.no!==t.no)].slice(0,5)))}catch{}
 },[t]);

 async function retry(){setBusy(true);setMsg('');
  try{const r=await fetch(`/api/orders/${no}/retry`,{method:'POST'});const j=await r.json();
   if(!r.ok)setMsg(j.error||'Could not send the prompt.');else load()}catch{setMsg('No connection. Try again.')}setBusy(false)}
 async function share(){try{if(navigator.share)await navigator.share({title:`Order #${no}`,url:location.href});
  else{await navigator.clipboard.writeText(location.href);setMsg('Link copied')}}catch{}}
 async function notify(){try{setPerm(await Notification.requestPermission())}catch{}}
 function again(){if(!t)return;const q:Record<string,number>={};t.items.forEach(i=>{q[i.id]=i.qty});setAll(q);setOpen(true)}

 if(missing)return <div className="tt-miss"><h1>We can&apos;t find order #{no}</h1>
  <p>Check the number, or it may have been cleared. Try again below.</p><Link className="btn" href="/track">Find an order</Link></div>;
 if(!t)return <div className="tt-hero"><div className="tt-top"><span className="tt-no">Order #{no}</span>
  <span className={'tt-live'+(offline?' off':'')}><i/>{offline?'Reconnecting…':'Loading'}</span></div>
  <div className="tt-ph" aria-hidden/><p className="tt-sub" aria-live="polite">{offline?'No connection. Retrying…':'Loading your order…'}</p></div>;

 const pending=status==='PENDING_PAYMENT',failed=status==='PAYMENT_FAILED',cancelled=status==='CANCELLED',ready=status==='READY',complete=status==='COMPLETED';

 // timing
 const sched=parseSched(t.pickup,t.createdAt);
 const base=(t.paidAt??t.createdAt)+(PREP_BASE+t.ahead*PER_ORDER)*60000;
 const scheduled=sched!==null&&sched>=base;
 const late=sched!==null&&sched<base;
 const target=scheduled?(sched as number):base;
 const left=Math.ceil((target-now)/60000);
 const frac=t.paidAt?Math.min(1,Math.max(0,(now-t.paidAt)/((target-t.paidAt)||1))):0;
 const idx=['PAID','PREPARING','READY','COMPLETED'].indexOf(status);
 const pct=pending?8:idx===0?20:idx===1?40+45*frac:idx>=2?100:0;
 const payLeft=Math.max(0,180-Math.floor((now-t.payStart)/1000));
 const pm=Math.floor(payLeft/60),ps=payLeft%60;

 const core:{big:string;small:string}|null=pending?null
  :failed?{big:'×',small:'not paid'}:cancelled?{big:'×',small:'cancelled'}
  :ready?{big:'Ready',small:'collect now'}:complete?{big:'✓',small:'enjoy'}
  :scheduled?{big:clock(target),small:'pickup'}
  :{big:left>1?String(left):'Soon',small:left>1?'min left':'almost there'};
 const sub=pending?(payLeft>0?`Enter your M-Pesa PIN. The prompt expires in ${pm}:${String(ps).padStart(2,'0')}.`:'Checking with M-Pesa…')
  :failed?'We could not confirm your payment.':cancelled?'This order was cancelled.'
  :ready?'Show your order number at the counter.':complete?'Thank you for ordering with Treehouse.'
  :scheduled?`Scheduled for ${clock(target)}.`
  :late?`Ready around ${clock(target)}, a little after your chosen time.`
  :left>1?`About ${left} min to go.`:'Almost there.';

 // timeline
 const cur=cancelled?0:pending||failed?1:status==='PAID'||status==='PREPARING'?2:ready?3:4;
 const stState=(i:number)=>cancelled?(i===0?'done':'todo'):i<cur?'done':i===cur?(complete?'done':failed?'bad':'now'):'todo';
 const STEPS=[
  {t:'Order placed',d:'We have your order.',m:clock(t.createdAt)},
  {t:failed?'Payment not completed':pending?'Waiting for payment':t.paidAt?'Payment confirmed':'Payment',
   d:failed?'We could not confirm your payment.':pending?'Enter your M-Pesa PIN on your phone.':'We have your payment.',m:t.paidAt?clock(t.paidAt):''},
  {t:'Preparing',d:status==='PAID'?'You are in the queue.':'The kitchen is cooking it now.',m:''},
  {t:'Ready',d:'Come and get it while it is hot.',m:''},
  {t:'Collected',d:'Enjoy your meal.',m:''}];
 const wa=`https://wa.me/${BRAND.wa}?text=${encodeURIComponent(`Hi, about my order #${t.no}`)}`;

 return <>
 {party&&<div className="tt-confetti" aria-hidden>{Array.from({length:30},(_,i)=>
  <i key={i} data-c={i%3} style={{'--x':`${(i*37)%100}%`,'--d':`${(((i*53)%100)/100*.9).toFixed(2)}s`,'--r':`${(i*47)%360}deg`} as React.CSSProperties}/>)}</div>}

 <div className={'tt-hero'+(ready?' ready':'')}>
  <div className="tt-top"><span className="tt-no">Order #{t.no}</span>
   <span className={'tt-live'+(offline?' off':done?' end':'')}><i/>{offline?'Reconnecting…':done?'Final':'Live'}</span></div>

  <div className="tt-vis" key={pending?'pay':'ring'}>
   {pending
    ?<div className="od-orb">{[0,1,2].map(k=><i key={k} style={{'--k':k} as React.CSSProperties}/>)}
      <div className="od-core"><svg className="od-ph" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg></div></div>
    :<div className="tt-ring"><svg viewBox="0 0 120 120" aria-hidden><circle className="tt-tr" cx="60" cy="60" r="52"/>
      <circle className="tt-pg" cx="60" cy="60" r="52" style={{strokeDasharray:CIRC,strokeDashoffset:CIRC*(1-pct/100)}}/></svg>
      {core&&<div className="tt-core"><b>{core.big}</b><small>{core.small}</small></div>}</div>}
   <span className="tx-sr" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Order progress"/>
  </div>

  <h1>{HEAD[status]||'Your order'}</h1>
  <p className="tt-sub" aria-live="polite">{sub}</p>
  {toast&&<p className="tt-toast" key={toast} role="status">{toast}</p>}
 </div>
 {offline&&<p role="status" className="tk-off">Connection lost. Retrying…</p>}

 <div className="tt-body">
  <div className="tt-left">
   {waiting&&perm==='default'&&<button type="button" className="tt-notify" onClick={notify}><span aria-hidden>🔔</span>
    <span><b>Get a ping when it&apos;s ready</b><small>We&apos;ll also chime and vibrate if this page is open.</small></span></button>}

   {pending&&<div className="tt-card"><h2>What happens next</h2>
    <ol className="tt-how"><li>Open the M-Pesa prompt on your phone.</li><li>Enter your PIN to approve {kes(t.total)}.</li><li>This page updates the moment we get your payment.</li></ol></div>}

   {failed&&<div className="tt-card bad"><h2>Payment not completed</h2>
    <p>You have not been charged for this order unless M-Pesa sent you a confirmation. If you did pay, this page will update on its own.</p>
    <button className="btn" disabled={busy} onClick={retry}>{busy?'Sending…':'Send the prompt again'}</button></div>}

   {cancelled&&<div className="tt-card bad"><h2>Order cancelled</h2>
    <p>If you were charged, call us on <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a> with your order number and we will sort it out.</p></div>}

   {ready&&<div className="tt-pass"><small>SHOW THIS AT THE COUNTER</small><b>#{t.no}</b><p>Your food is hot and waiting.</p></div>}

   <ol className="tt-steps" aria-label="Order steps">{STEPS.map((s,i)=>{const st=stState(i);
    return <li key={s.t} className={st} aria-current={st==='now'?'step':undefined}>
     <span>{st==='done'?'✓':st==='bad'?'!':i+1}</span>
     <div><h3>{s.t}{s.m&&st!=='todo'&&<small>{s.m}</small>}</h3>
      {st!=='todo'&&<p>{s.d}</p>}
      {i===2&&st==='now'&&(status==='PAID'
       ?scheduled?<p className="tt-eta">Scheduled for <b>{clock(target)}</b></p>
        :t.ahead>0?<div className="tt-queue">{Array.from({length:Math.min(t.ahead,8)},(_,k)=><i key={k} style={{'--k':k} as React.CSSProperties}/>)}
          <b>You</b><span>{t.ahead} {t.ahead===1?'order is':'orders are'} ahead</span></div>
         :<p className="tt-eta">You are next.</p>
       :<p className="tt-eta">{scheduled?'Scheduled for':'Ready around'} <b>{clock(target)}</b></p>)}
     </div></li>})}</ol>

   <div className="tt-help"><h2>Need a hand?</h2>
    <div><a href={`tel:${BRAND.phone}`}>Call</a><a href={wa} target="_blank" rel="noreferrer noopener">WhatsApp ↗</a>
     <a href={BRAND.maps} target="_blank" rel="noreferrer noopener">Directions ↗</a></div></div>
  </div>

  <aside className="tt-receipt" aria-label="Your order">
   <h2>Your order</h2>
   <ul className="tt-items">{t.items.map(i=><li key={i.id}>
    <div className="tt-th"><Pic id={i.id} sizes="48px" alt="" emoji="🍽️"/></div>
    <span>{i.qty} × {i.name}</span><b>{kes(i.price*i.qty)}</b></li>)}</ul>
   <div className="tt-tot"><span>Total</span><b>{kes(t.total)}</b></div>
   <dl className="tt-meta"><div><dt>Placed</dt><dd>{clock(t.createdAt)}</dd></div><div><dt>Pickup</dt><dd>{t.pickup}</dd></div></dl>
   <div className="tt-acts"><button className="btn" onClick={again}>Order again</button>
    <button className="btn tx-ghost dk" onClick={share}>Share link</button></div>
   {msg&&<p role="status" className="tt-msg">{msg}</p>}
   <p className="tt-fine">Problem with your order? Call <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a> and quote #{t.no}.</p>
  </aside>
 </div></>;}