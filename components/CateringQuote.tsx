'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ADDONS,DIETARY,EVENT_TYPES,FULFIL,MAX_GUESTS,MIN_GUESTS,PACKAGES,PRESETS,TIMES,WA_NUMBER,estimate,kes} from '@/lib/catering';

const LABELS=['Your event','Food and extras','Your details'];
const toggle=(list:string[],v:string)=>list.includes(v)?list.filter(x=>x!==v):[...list,v];
const niceDate=(d:string)=>d?new Date(d+'T00:00').toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'}):'';

export default function CateringQuote(){
 const [step,setStep]=useState(0);const [bwd,setBwd]=useState(false);const [done,setDone]=useState(false);
 const [type,setType]=useState('');const [date,setDate]=useState('');const [time,setTime]=useState('');
 const [guests,setGuests]=useState(50);
 const [pkg,setPkg]=useState('platter');const [addons,setAddons]=useState<string[]>([]);
 const [fulfil,setFulfil]=useState(FULFIL[0]);const [diet,setDiet]=useState<string[]>([]);
 const [name,setName]=useState('');const [phone,setPhone]=useState('');const [venue,setVenue]=useState('');const [notes,setNotes]=useState('');
 const [err,setErr]=useState('');const [shake,setShake]=useState(false);
 const [minDate,setMinDate]=useState('');
 const card=useRef<HTMLDivElement>(null);

 const pk=PACKAGES.find(p=>p.id===pkg);
 const est=useMemo(()=>estimate(pkg,guests,addons),[pkg,guests,addons]);

 useEffect(()=>{ // earliest bookable date: 2 days from today
  const d=new Date();d.setDate(d.getDate()+2);setMinDate(d.toLocaleDateString('en-CA'));
 },[]);

 useEffect(()=>{ // the explorer and the package cards pre-fill the form
  const onEvent=(e:Event)=>{const v=(e as CustomEvent<string>).detail;if(EVENT_TYPES.includes(v))setType(v)};
  const onPkg=(e:Event)=>{const v=(e as CustomEvent<string>).detail;if(PACKAGES.some(p=>p.id===v))setPkg(v)};
  window.addEventListener('catering:select-event',onEvent);
  window.addEventListener('catering:select-package',onPkg);
  return()=>{window.removeEventListener('catering:select-event',onEvent);window.removeEventListener('catering:select-package',onPkg)};
 },[]);

 const check=(s:number)=>{
  if(s===0){
   if(!type)return 'Pick the type of event.';
   if(!date)return 'Choose a date.';
   if(minDate&&date<minDate)return 'We need at least 2 days notice. For sooner, message us on WhatsApp.';
   if(!time)return 'Choose a time of day.';
   if(guests<MIN_GUESTS||guests>MAX_GUESTS)return `Catering is for ${MIN_GUESTS} to ${MAX_GUESTS} guests.`;
  }
  if(s===2){
   if(name.trim().length<2)return 'Add your name.';
   if(phone.replace(/\D/g,'').length<9)return 'Add a phone number we can reach you on.';
  }
  return '';
 };
 const fail=(m:string)=>{setErr(m);setShake(true);setTimeout(()=>setShake(false),450)};
 const show=()=>card.current?.scrollIntoView({behavior:'smooth',block:'start'});
 const next=()=>{const m=check(step);if(m)return fail(m);setErr('');setBwd(false);setStep(step+1);show()};
 const back=(n=step-1)=>{setErr('');setBwd(true);setStep(n);show()};

 const text=[
  `Hi Treehouse, I'd like a catering quote.`,
  `Event: ${type}`,
  `Date: ${niceDate(date)} (${time})`,
  `Guests: ${guests}`,
  `Package: ${pk?.name}`,
  addons.length&&`Extras: ${addons.map(id=>ADDONS.find(a=>a.id===id)?.label).filter(Boolean).join(', ')}`,
  `Service: ${fulfil}`,
  diet.length&&`Dietary: ${diet.join(', ')}`,
  venue&&`Venue or area: ${venue}`,
  notes&&`Notes: ${notes}`,
  est&&`Estimate: ${kes(est.total)}`,
  `${name} - ${phone}`,
 ].filter(Boolean).join('\n');
 const wa=`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

 const send=()=>{
  const m=check(2);if(m)return fail(m);
  window.open(wa,'_blank','noopener');setDone(true);show();
 };

 return <div className="rw">
  <div className={'rw-card'+(shake?' shake':'')} ref={card}>
   {done?<div className="rw-done">
    <small>REQUEST READY</small>
    <h2>One more tap to send it</h2>
    <p>WhatsApp should have opened with your details filled in. Press send there and we will come back with a written quote, usually within one working day.</p>
    <div className="rw-acts">
     <a className="btn" href={wa} target="_blank" rel="noopener">Open WhatsApp again</a>
     <button type="button" className="btn tx-ghost dk" onClick={()=>{setDone(false);setStep(0)}}>Edit request</button>
    </div>
   </div>:<>
    <ol className="rw-prog">
     {LABELS.map((l,n)=><li key={l} className={n<step?'done':n===step?'on':''}>
      <button type="button" disabled={n>=step} onClick={()=>n<step&&back(n)}><span>{n+1}</span>{l}</button>
     </li>)}
    </ol>

    <div className={'rw-step'+(bwd?' bwd':'')} key={step}>
     {step===0&&<>
      <h2>Tell us about your event</h2>
      <span className="rw-label">Type of event</span>
      <div className="rw-chips">{EVENT_TYPES.map(t=><button type="button" key={t} aria-pressed={type===t} className={type===t?'on':''} onClick={()=>setType(t)}>{t}</button>)}</div>

      <label className="rw-label" htmlFor="cq-date">Date</label>
      <div className="tx-f" style={{maxWidth:'16rem'}}><input id="cq-date" type="date" min={minDate} value={date} onChange={e=>setDate(e.target.value)}/></div>

      <span className="rw-label">Time of day</span>
      <div className="rw-chips">{TIMES.map(t=><button type="button" key={t} aria-pressed={time===t} className={time===t?'on':''} onClick={()=>setTime(t)}>{t}</button>)}</div>

      <span className="rw-label">Number of guests</span>
      <div className="tx-step">
       <button type="button" aria-label="Fewer guests" onClick={()=>setGuests(g=>Math.max(MIN_GUESTS,g-10))}>−</button>
       <input className="cq-num" type="number" inputMode="numeric" min={MIN_GUESTS} max={MAX_GUESTS} value={guests||''} aria-label="Number of guests"
        onChange={e=>setGuests(Number(e.target.value)||0)}
        onBlur={()=>setGuests(g=>Math.min(MAX_GUESTS,Math.max(MIN_GUESTS,g||MIN_GUESTS)))}/>
       <button type="button" aria-label="More guests" onClick={()=>setGuests(g=>Math.min(MAX_GUESTS,g+10))}>+</button>
      </div>
      <div className="rw-chips cq-pre">{PRESETS.map(n=><button type="button" key={n} className={guests===n?'on':''} onClick={()=>setGuests(n)}>{n}</button>)}</div>
     </>}

     {step===1&&<>
      <h2>Food and extras</h2>
      <span className="rw-label">Package</span>
      <div className="rw-seats">{PACKAGES.map(p=><button type="button" key={p.id} aria-pressed={pkg===p.id} className={pkg===p.id?'on':''} onClick={()=>setPkg(p.id)}>
       <b>{p.name}</b><small>{p.tagline}</small><small>{kes(p.per)} per person</small>
      </button>)}</div>

      <span className="rw-label">Extras (optional)</span>
      <div className="rw-chips">{ADDONS.map(a=><button type="button" key={a.id} aria-pressed={addons.includes(a.id)} className={addons.includes(a.id)?'on':''} onClick={()=>setAddons(l=>toggle(l,a.id))}>
       {a.label} · {a.per?`${kes(a.per)} pp`:kes(a.flat||0)}
      </button>)}</div>

      <span className="rw-label">How should we get it to you?</span>
      <div className="rw-chips">{FULFIL.map(f=><button type="button" key={f} aria-pressed={fulfil===f} className={fulfil===f?'on':''} onClick={()=>setFulfil(f)}>{f}</button>)}</div>

      <span className="rw-label">Dietary needs (optional)</span>
      <div className="rw-chips">{DIETARY.map(d=><button type="button" key={d} aria-pressed={diet.includes(d)} className={diet.includes(d)?'on':''} onClick={()=>setDiet(l=>toggle(l,d))}>{d}</button>)}</div>
     </>}

     {step===2&&<>
      <h2>Your details</h2>
      <div className="rw-fields">
       <label className="tx-f"><span>Name</span><input value={name} autoComplete="name" onChange={e=>setName(e.target.value)}/></label>
       <label className="tx-f"><span>Phone</span><input type="tel" inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
       <label className="tx-f"><span>Venue or area (optional)</span><input value={venue} onChange={e=>setVenue(e.target.value)}/></label>
       <label className="tx-f"><span>Anything else we should know? (optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      </div>
      <dl className="rw-rev">
       <div><dt>Event</dt><dd>{type}, {niceDate(date)}, {time}</dd><button type="button" onClick={()=>back(0)}>Edit</button></div>
       <div><dt>Guests</dt><dd>{guests}</dd><button type="button" onClick={()=>back(0)}>Edit</button></div>
       <div><dt>Package</dt><dd>{pk?.name}</dd><button type="button" onClick={()=>back(1)}>Edit</button></div>
      </dl>
      <p className="rw-hint">This opens WhatsApp with your request ready to send. We reply with a written quote.</p>
     </>}
    </div>

    {err&&<p className="tx-err" role="alert">{err}</p>}
    <div className="rw-nav">
     {step>0?<button type="button" className="rw-back" onClick={()=>back()}>← Back</button>:<span/>}
     {step<2
      ?<button type="button" className="btn" onClick={next}>Continue</button>
      :<button type="button" className="btn" onClick={send}>Send on WhatsApp</button>}
    </div>
   </>}
  </div>

  <aside className="rw-sum">
   <h3>Your estimate</h3>
   <div><span>Event</span><b>{type||'Not chosen yet'}</b></div>
   <div><span>Date</span><b>{date?niceDate(date):'Not chosen yet'}</b></div>
   <div><span>Guests</span><b>{guests||'-'}</b></div>
   <div><span>Package</span><b>{pk?.name}</b></div>
   <div className="rw-tags"><span>Extras</span>{addons.length?addons.map(id=><i key={id}>{ADDONS.find(a=>a.id===id)?.label}</i>):<b>None</b>}</div>
   {est&&<div className="cq-est">
    <small>Estimated total</small>
    <b className="big">{kes(est.total)}</b>
    <div className="cq-lines">{est.lines.map(([l,v])=><div key={l}><span>{l}</span><span>{kes(v)}</span></div>)}</div>
    <p>A guide only. Delivery, venue access and the final menu are confirmed in your written quote.</p>
   </div>}
  </aside>
 </div>;
}