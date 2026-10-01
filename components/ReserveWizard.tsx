'use client';
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';
import {SLOTS,today,addDays,mins,nowMin} from '@/lib/dates';
import {BRAND} from '@/components/config';

// EDIT: match your real seating areas
const SEATS:[string,string][]=[['Indoor','Dining room'],['Outdoor','Open-air seating'],['Counter','Quick and casual'],['No preference','Seat me anywhere']];
const OCC=['Birthday','Anniversary','Business meeting','Kids in the group','High chair needed','Accessible seating'];
const STEPS=['When','Who & where','Details','Confirm'];
const fmt=(t:string)=>{const h=Number(t.slice(0,2));return `${h%12||12}:${t.slice(3)} ${h<12?'am':'pm'}`};
const utc=(d:string)=>new Date(d+'T00:00:00Z');
const long=(d:string)=>utc(d).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const GROUPS:[string,(t:string)=>boolean][]=[['Morning',t=>mins(t)<720],['Lunch',t=>mins(t)>=720&&mins(t)<1020],['Evening',t=>mins(t)>=1020]];

export default function ReserveWizard(){
 const [t0,setT0]=useState('');const [step,setStep]=useState(0);const [dir,setDir]=useState(1);const [shake,setShake]=useState(false);
 const [f,setF]=useState({date:'',time:'',guests:2,seat:'No preference',occ:[] as string[],note:'',name:'',phone:'',email:'',website:''});
 const [full,setFull]=useState<string[]>([]);const [left,setLeft]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState(false);const [err,setErr]=useState('');const [ref,setRef]=useState('');const [back,setBack]=useState(false);
 const card=useRef<HTMLDivElement>(null);
 const set=<K extends keyof typeof f>(k:K,v:(typeof f)[K])=>setF(x=>({...x,[k]:v}));

 useEffect(()=>{const t=today();setT0(t);set('date',t);
  try{const n=localStorage.getItem('guestName'),p=localStorage.getItem('phone');
   if(n||p){setF(x=>({...x,name:n||x.name,phone:p||x.phone}));setBack(true)}}catch{}},[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(!f.date)return;let live=true;
  fetch(`/api/leads/reservations?date=${f.date}&guests=${f.guests}`).then(r=>r.json()).then(j=>{if(!live)return;
   setFull(j.full||[]);setLeft(j.left||{});setF(x=>(j.full||[]).includes(x.time)?{...x,time:''}:x)}).catch(()=>{});
  return()=>{live=false}},[f.date,f.guests]);

 const dates=t0?Array.from({length:14},(_,i)=>addDays(t0,i)):[];
 const past=(t:string)=>f.date===t0&&mins(t)<nowMin();
 const weekend=f.date&&[5,6].includes(utc(f.date).getUTCDay())&&f.time&&mins(f.time)>=1080;

 function bad(m:string){setErr(m);setShake(true);setTimeout(()=>setShake(false),400)}
 function go(n:number){setDir(n>step?1:-1);setStep(n);setErr('');card.current?.scrollIntoView({behavior:'smooth',block:'start'})}
 function next(){setErr('');
  if(step===0&&!f.time)return bad('Please choose a time.');
  if(step===2){if(f.name.trim().length<2)return bad('Please enter your name.');
   if(!/^(?:\+?254|0)[17]\d{8}$/.test(f.phone.replace(/[\s-]/g,'')))return bad('Enter a valid Kenyan number, e.g. 0712 345 678.');
   if(f.email&&!/^\S+@\S+\.\S+$/.test(f.email))return bad('That email address looks wrong.');}
  if(step===3)return submit();
  go(step+1);}
 async function submit(){setBusy(true);setErr('');
  const requests=[`Seating: ${f.seat}`,f.occ.length?`Notes: ${f.occ.join(', ')}`:'',f.note.trim()].filter(Boolean).join(' | ').slice(0,300);
  try{const r=await fetch('/api/leads/reservations',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({date:f.date,time:f.time,guests:f.guests,name:f.name,phone:f.phone,email:f.email,requests,website:f.website})});
   const j=await r.json();
   if(!r.ok){setErr(j.error||'Something went wrong.');if(r.status===409){set('time','');go(0);setErr(j.error)}return}
   try{localStorage.setItem('guestName',f.name);localStorage.setItem('phone',f.phone)}catch{}
   setRef(j.ref);card.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch{setErr('No connection. Please try again.')}finally{setBusy(false)}}

 const ics=()=>{const d=f.date.replace(/-/g,''),e=mins(f.time)+90;
  const end=String(Math.floor(e/60)).padStart(2,'0')+String(e%60).padStart(2,'0')+'00';
  return 'data:text/calendar;charset=utf8,'+encodeURIComponent(['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
   `DTSTART;TZID=Africa/Nairobi:${d}T${f.time.replace(':','')}00`,`DTEND;TZID=Africa/Nairobi:${d}T${end}`,
   `SUMMARY:Table at ${BRAND.name}`,`LOCATION:${BRAND.address}`,`DESCRIPTION:Reservation ${ref}`,'END:VEVENT','END:VCALENDAR'].join('\r\n'))};
 const wa=`https://wa.me/${BRAND.wa}?text=${encodeURIComponent(`Hi ${BRAND.name}, my reservation is ${ref}: ${f.guests} guests, ${long(f.date)} at ${fmt(f.time)}.`)}`;

 return <main className="rw">
  <div ref={card} className="rw-card">
   {!ref&&<ol className="rw-prog" aria-label="Progress">{STEPS.map((s,i)=><li key={s} className={(i===step?'on ':'')+(i<step?'done':'')} aria-current={i===step?'step':undefined}>
    <button type="button" disabled={i>=step} onClick={()=>go(i)}><span>{i<step?'✓':i+1}</span>{s}</button></li>)}</ol>}

   {ref?<div className="rw-done"><small>REQUEST RECEIVED</small><h2>{ref}</h2>
     <p>Thanks {f.name.split(' ')[0]}. We&apos;ve got your request for <b>{f.guests} {f.guests===1?'guest':'guests'}</b> on <b>{long(f.date)}</b> at <b>{fmt(f.time)}</b>.</p>
     <p>Your table isn&apos;t final until we confirm. We&apos;ll call or message {f.phone} shortly.</p>
     <div className="rw-acts"><a className="btn" href={wa} target="_blank" rel="noreferrer">Message us on WhatsApp</a>
      <a className="btn tx-ghost dk" href={ics()} download={`${BRAND.name}-reservation.ics`}>Add to calendar</a></div>
     <p><Link href="/order">Want food ready when you arrive? Order ahead</Link></p></div>
   :<div key={step} className={'rw-step '+(dir>0?'fwd':'bwd')+(shake?' shake':'')}>

    {step===0&&<>
     <h2>When are you coming?</h2>
     <div className="rw-dates" role="group" aria-label="Choose a date">{dates.map((d,i)=>{const u=utc(d);
      return <button type="button" key={d} aria-pressed={f.date===d} className={f.date===d?'on':''} onClick={()=>set('date',d)}>
       <small>{i===0?'Today':i===1?'Tomorrow':u.toLocaleDateString('en-GB',{weekday:'short',timeZone:'UTC'})}</small>
       <b>{u.getUTCDate()}</b><small>{u.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})}</small></button>})}</div>
     {GROUPS.map(([name,test])=>{const list=SLOTS.filter(test);return <div key={name} className="rw-group"><h3>{name}</h3>
      <div className="rw-slots" role="group" aria-label={name+' times'}>{list.map(t=>{const off=full.includes(t)||past(t);const few=!off&&left[t]!==undefined&&left[t]-f.guests<10;
       return <button type="button" key={t} disabled={off} aria-pressed={f.time===t} className={f.time===t?'on':''} onClick={()=>set('time',t)}>{fmt(t)}{few&&<i>Few left</i>}</button>})}</div></div>})}
     {weekend&&<p className="rw-hint">Friday and Saturday evenings are our busiest. Booking now was a good idea.</p>}
    </>}

    {step===1&&<>
     <h2>How many, and where?</h2>
     <span className="rw-label">Party size</span>
     <div className="tx-step"><button type="button" aria-label="Fewer guests" onClick={()=>set('guests',Math.max(1,f.guests-1))}>−</button><b aria-live="polite">{f.guests}</b>
      <button type="button" aria-label="More guests" onClick={()=>set('guests',Math.min(20,f.guests+1))}>+</button><span>{f.guests===1?'guest':'guests'}</span></div>
     {f.guests>=8&&<p className="rw-hint">Bigger group? We&apos;ll try to seat you together. Add a note on the next step.{f.guests>12&&<> For events, use <Link href="/catering">catering</Link>.</>}</p>}
     <span className="rw-label">Seating</span>
     <div className="rw-seats" role="group" aria-label="Seating area">{SEATS.map(([n,d])=><button type="button" key={n} aria-pressed={f.seat===n} className={f.seat===n?'on':''} onClick={()=>set('seat',n)}><b>{n}</b><small>{d}</small></button>)}</div>
    </>}

    {step===2&&<>
     <h2>A few details</h2>
     {back&&<p className="rw-hint">Welcome back{f.name?`, ${f.name.split(' ')[0]}`:''}. We filled in your details from last time.</p>}
     <span className="rw-label">Anything we should prepare for?</span>
     <div className="rw-chips" role="group" aria-label="Occasions and needs">{OCC.map(o=><button type="button" key={o} aria-pressed={f.occ.includes(o)} className={f.occ.includes(o)?'on':''} onClick={()=>set('occ',f.occ.includes(o)?f.occ.filter(x=>x!==o):[...f.occ,o])}>{o}</button>)}</div>
     <div className="rw-fields">
      <label className="tx-f"><span>Your name</span><input autoComplete="name" value={f.name} onChange={e=>set('name',e.target.value)}/></label>
      <label className="tx-f"><span>Phone</span><input inputMode="tel" autoComplete="tel" placeholder="07…" value={f.phone} onChange={e=>set('phone',e.target.value)}/></label>
      <label className="tx-f"><span>Email (optional)</span><input type="email" autoComplete="email" value={f.email} onChange={e=>set('email',e.target.value)}/></label>
      <label className="tx-f"><span>Notes (optional)</span><input maxLength={120} placeholder="Allergies, surprise cake at 8pm…" value={f.note} onChange={e=>set('note',e.target.value)}/></label>
     </div>
     <input className="tx-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={e=>set('website',e.target.value)}/>
    </>}

    {step===3&&<>
     <h2>Check and send</h2>
     <p className="rw-hint">This sends a request to our team. We&apos;ll confirm by call or message.</p>
     <dl className="rw-rev"><div><dt>When</dt><dd>{long(f.date)} · {fmt(f.time)}</dd><button type="button" onClick={()=>go(0)}>Edit</button></div>
      <div><dt>Party</dt><dd>{f.guests} {f.guests===1?'guest':'guests'} · {f.seat}</dd><button type="button" onClick={()=>go(1)}>Edit</button></div>
      <div><dt>Contact</dt><dd>{f.name} · {f.phone}</dd><button type="button" onClick={()=>go(2)}>Edit</button></div>
      {(f.occ.length>0||f.note)&&<div><dt>Notes</dt><dd>{[...f.occ,f.note].filter(Boolean).join(', ')}</dd><button type="button" onClick={()=>go(2)}>Edit</button></div>}</dl>
    </>}

    {err&&<p role="alert" className="tx-err">{err}</p>}
    <div className="rw-nav">
     <button type="button" className="rw-back" style={{visibility:step?'visible':'hidden'}} onClick={()=>go(step-1)}>Back</button>
     <button type="button" className="btn" disabled={busy} onClick={next}>{busy?'Sending…':step===3?'Request reservation':'Continue'}</button>
    </div>
   </div>}
  </div>

  <aside className="rw-sum" aria-label="Your reservation">
   <h3>Your reservation</h3>
   <div><span>Date</span><b>{f.date?long(f.date):'-'}</b></div>
   <div><span>Time</span><b>{f.time?fmt(f.time):'-'}</b></div>
   <div><span>Party</span><b>{f.guests} {f.guests===1?'guest':'guests'}</b></div>
   <div><span>Seating</span><b>{f.seat}</b></div>
   {f.occ.length>0&&<div className="rw-tags">{f.occ.map(o=><i key={o}>{o}</i>)}</div>}
   <p>{BRAND.hoursText}<br/>{BRAND.address}</p>
  </aside>
 </main>;}