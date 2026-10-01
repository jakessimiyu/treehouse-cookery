'use client';
import {useEffect,useRef,useState} from 'react';
import {today,addDays} from '@/lib/dates';import {BRAND} from '@/components/config';
import {PACKAGES,ADDONS,EVENT_TYPES,TIMES,DIETARY,PRESETS,MIN_GUESTS,MAX_GUESTS,FULFIL,estimate,kes} from '@/lib/catering';
const STEPS=['Your event','Menu & extras','Your details'];
const long=(d:string)=>d?new Date(d+'T00:00:00Z').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'-';
const tog=(l:string[],x:string)=>l.includes(x)?l.filter(y=>y!==x):[...l,x];

export default function CateringQuote(){
 const [f,setF]=useState({eventType:'',date:'',time:'',guests:30,fulfilment:'Delivery + setup',venue:'',pkg:'advise',addons:[] as string[],dietary:[] as string[],notes:'',name:'',phone:'',company:'',email:'',website:''});
 const [min,setMin]=useState('');const [step,setStep]=useState(0);const [dir,setDir]=useState(1);const [shake,setShake]=useState(false);
 const [busy,setBusy]=useState(false);const [err,setErr]=useState('');const [ref,setRef]=useState('');const top=useRef<HTMLDivElement>(null);
 const set=<K extends keyof typeof f>(k:K,v:(typeof f)[K])=>setF(x=>({...x,[k]:v}));
 useEffect(()=>{setMin(addDays(today(),2));
  try{const n=localStorage.getItem('guestName'),p=localStorage.getItem('phone');if(n||p)setF(x=>({...x,name:n||x.name,phone:p||x.phone}))}catch{}
    const on=(e:Event)=>{const id=(e as CustomEvent<string>).detail;if(PACKAGES.some(p=>p.id===id))setF(x=>({...x,pkg:id}))};
  const onEv=(e:Event)=>{const t=(e as CustomEvent<string>).detail;if(EVENT_TYPES.includes(t))setF(x=>({...x,eventType:t}))};
  addEventListener('catering:select-package',on);addEventListener('catering:select-event',onEv);
  return()=>{removeEventListener('catering:select-package',on);removeEventListener('catering:select-event',onEv)}},[]);
 const guests=Math.max(0,Math.min(MAX_GUESTS,f.guests||0));
 const est=estimate(f.pkg,guests,f.addons);const pkg=PACKAGES.find(p=>p.id===f.pkg);
 const bad=(m:string)=>{setErr(m);setShake(true);setTimeout(()=>setShake(false),400)};
 const go=(n:number)=>{setDir(n>step?1:-1);setStep(n);setErr('');top.current?.scrollIntoView({behavior:'smooth',block:'start'})};
 function next(){setErr('');
  if(step===0){const m=[];if(!f.eventType)m.push('event type');if(!f.date)m.push('date');if(guests<MIN_GUESTS)m.push(`at least ${MIN_GUESTS} guests`);
   if(f.fulfilment!=='Collection'&&!f.venue.trim())m.push('delivery address');if(m.length)return bad('Please add: '+m.join(', ')+'.')}
  if(step===2){if(f.name.trim().length<2)return bad('Please enter your name.');
   if(!/^(?:\+?254|0)[17]\d{8}$/.test(f.phone.replace(/[\s-]/g,'')))return bad('Enter a valid Kenyan number, e.g. 0712 345 678.');
   if(f.email&&!/^\S+@\S+\.\S+$/.test(f.email))return bad('That email address looks wrong.');return submit()}
  go(step+1)}
 async function submit(){setBusy(true);
  const extras=[f.time&&`Time: ${f.time}`,f.addons.length&&'Add-ons: '+f.addons.map(id=>ADDONS.find(a=>a.id===id)?.label).join(', '),
   f.dietary.length&&'Dietary: '+f.dietary.join(', '),f.notes.trim()].filter(Boolean).join(' | ');
  try{const r=await fetch('/api/leads/catering',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    eventType:f.eventType,date:f.date,guests,fulfilment:f.fulfilment,venue:f.venue,interest:pkg?pkg.name:'Not sure yet',
    budget:est?'Est. '+kes(est.total):'',company:f.company,name:f.name,phone:f.phone,email:f.email,details:extras,website:f.website})});
   const j=await r.json();if(!r.ok){bad(j.error||'Something went wrong.');return}
   try{localStorage.setItem('guestName',f.name);localStorage.setItem('phone',f.phone)}catch{}
   setRef(j.ref);top.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch{bad('No connection. Please try again.')}finally{setBusy(false)}}

 const wa=`https://wa.me/${BRAND.wa}?text=${encodeURIComponent(`Hi ${BRAND.name}, my catering enquiry is ${ref}: ${guests} guests on ${long(f.date)}.`)}`;
 return <div id="quote" className="rw" ref={top}>
  <div className="rw-card">
   {!ref&&<ol className="rw-prog" aria-label="Progress">{STEPS.map((s,i)=><li key={s} className={(i===step?'on ':'')+(i<step?'done':'')} aria-current={i===step?'step':undefined}>
    <button type="button" disabled={i>=step} onClick={()=>go(i)}><span>{i<step?'✓':i+1}</span>{s}</button></li>)}</ol>}

   {ref?<div className="rw-done"><small>ENQUIRY RECEIVED</small><h2>{ref}</h2>
    <p>Thanks {f.name.split(' ')[0]}. Our catering team will call or message {f.phone} with a written quote, usually within one working day.</p>
    {est&&<p>Your estimate: about <b>{kes(est.total)}</b>. The final price is confirmed in your quote.</p>}
    <div className="rw-acts"><a className="btn" href={wa} target="_blank" rel="noreferrer">Message us on WhatsApp</a></div></div>

   :<div key={step} className={'rw-step '+(dir>0?'fwd':'bwd')+(shake?' shake':'')}>
    {step===0&&<>
     <h2>Tell us about your event</h2>
     <span className="rw-label">What is the occasion?</span>
     <div className="rw-chips" role="group" aria-label="Event type">{EVENT_TYPES.map(t=><button type="button" key={t} aria-pressed={f.eventType===t} className={f.eventType===t?'on':''} onClick={()=>set('eventType',t)}>{t}</button>)}</div>
     <div className="rw-fields">
      <label className="tx-f"><span>Event date (2+ days ahead)</span><input type="date" min={min} value={f.date} onChange={e=>set('date',e.target.value)}/></label>
     </div>
     <span className="rw-label">Time of day (optional)</span>
     <div className="rw-chips" role="group" aria-label="Time of day">{TIMES.map(t=><button type="button" key={t} aria-pressed={f.time===t} className={f.time===t?'on':''} onClick={()=>set('time',f.time===t?'':t)}>{t}</button>)}</div>
     <span className="rw-label">How many people?</span>
     <div className="tx-step"><button type="button" aria-label="10 fewer" onClick={()=>set('guests',Math.max(0,guests-10))}>−</button>
      <input className="cq-num" type="number" inputMode="numeric" min={MIN_GUESTS} max={MAX_GUESTS} aria-label="Number of guests" value={f.guests||''} onChange={e=>set('guests',Number(e.target.value)||0)} onBlur={()=>set('guests',Math.max(MIN_GUESTS,guests))}/>
      <button type="button" aria-label="10 more" onClick={()=>set('guests',Math.min(MAX_GUESTS,guests+10))}>+</button><span>guests</span></div>
     <div className="rw-chips cq-pre">{PRESETS.map(n=><button type="button" key={n} aria-pressed={guests===n} className={guests===n?'on':''} onClick={()=>set('guests',n)}>{n}</button>)}</div>
     {guests>=150&&<p className="rw-hint">Big event. We&apos;ll likely suggest a quick site visit or call to plan the logistics.</p>}
     <span className="rw-label">Delivery</span>
     <div className="rw-chips" role="group" aria-label="Delivery option">{FULFIL.map(t=><button type="button" key={t} aria-pressed={f.fulfilment===t} className={f.fulfilment===t?'on':''} onClick={()=>set('fulfilment',t)}>{t}</button>)}</div>
     <div className="rw-fields"><label className="tx-f"><span>{f.fulfilment==='Collection'?'Area (optional)':'Delivery address or venue'}</span>
      <input autoComplete="street-address" placeholder="e.g. Westlands, Delta Towers 5th floor" value={f.venue} onChange={e=>set('venue',e.target.value)}/></label></div>
    </>}

    {step===1&&<>
     <h2>Menu and extras</h2>
     <span className="rw-label">Choose a package</span>
     <div className="rw-seats" role="group" aria-label="Package">{PACKAGES.map(p=><button type="button" key={p.id} aria-pressed={f.pkg===p.id} className={f.pkg===p.id?'on':''} onClick={()=>set('pkg',p.id)}>
      <b>{p.name}</b><small>{p.tagline}</small><small>from {kes(p.per)} / person</small></button>)}
      <button type="button" aria-pressed={f.pkg==='advise'} className={f.pkg==='advise'?'on':''} onClick={()=>set('pkg','advise')}><b>Not sure yet</b><small>Advise me</small></button></div>
     <span className="rw-label">Add-ons</span>
     <div className="rw-chips" role="group" aria-label="Add-ons">{ADDONS.map(a=><button type="button" key={a.id} aria-pressed={f.addons.includes(a.id)} className={f.addons.includes(a.id)?'on':''} onClick={()=>set('addons',tog(f.addons,a.id))}>
      {a.label} +{a.per?kes(a.per)+'/person':kes(a.flat||0)}</button>)}</div>
     <span className="rw-label">Dietary needs</span>
     <div className="rw-chips" role="group" aria-label="Dietary needs">{DIETARY.map(d=><button type="button" key={d} aria-pressed={f.dietary.includes(d)} className={f.dietary.includes(d)?'on':''} onClick={()=>set('dietary',tog(f.dietary,d))}>{d}</button>)}</div>
     <div className="rw-fields"><label className="tx-f"><span>Anything else? (optional)</span><textarea rows={3} maxLength={300} placeholder="Timings, access, a favourite dish…" value={f.notes} onChange={e=>set('notes',e.target.value)}/></label></div>
    </>}

    {step===2&&<>
     <h2>Your details</h2>
     <div className="rw-fields">
      <label className="tx-f"><span>Your name</span><input autoComplete="name" value={f.name} onChange={e=>set('name',e.target.value)}/></label>
      <label className="tx-f"><span>Phone (WhatsApp preferred)</span><input inputMode="tel" autoComplete="tel" placeholder="07…" value={f.phone} onChange={e=>set('phone',e.target.value)}/></label>
      <label className="tx-f"><span>Company (optional)</span><input autoComplete="organization" value={f.company} onChange={e=>set('company',e.target.value)}/></label>
      <label className="tx-f"><span>Email (optional)</span><input type="email" autoComplete="email" value={f.email} onChange={e=>set('email',e.target.value)}/></label>
     </div>
     <input className="tx-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={e=>set('website',e.target.value)}/>
     <p className="rw-hint">We only use these details to reply to your enquiry.</p>
    </>}

    {err&&<p role="alert" className="tx-err">{err}</p>}
    <div className="rw-nav">
     <button type="button" className="rw-back" style={{visibility:step?'visible':'hidden'}} onClick={()=>go(step-1)}>Back</button>
     <button type="button" className="btn" disabled={busy} onClick={next}>{busy?'Sending…':step===2?'Send my enquiry':'Continue'}</button>
    </div>
   </div>}
  </div>

  <aside className="rw-sum" aria-label="Your event">
   <h3>Your event</h3>
   <div><span>Occasion</span><b>{f.eventType||'-'}</b></div>
   <div><span>Date</span><b>{long(f.date)}</b></div>
   <div><span>Guests</span><b>{guests||'-'}</b></div>
   <div><span>Package</span><b>{pkg?pkg.name:'To be advised'}</b></div>
   <section className="cq-est"><small>Indicative estimate</small>
    {est?<><b className="big">{kes(est.total)}</b>
     <div className="cq-lines">{est.lines.map(([l,v])=><div key={l}><span>{l}</span><span>{kes(v)}</span></div>)}</div></>
     :<p>Choose a package to see an estimate.</p>}
    <p>A guide only. Delivery, venue access and final menu are confirmed in your written quote.</p></section>
  </aside>
 </div>;}