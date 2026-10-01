'use client';
import {useEffect,useRef,useState} from 'react';
import {Pic} from '@/components/Dish';
import {PACKAGES,kes} from '@/lib/catering';
import {OCC} from '@/lib/occasions';

export default function OccasionExplorer(){
 const [i,setI]=useState(0);const [auto,setAuto]=useState(true);const [still,setStill]=useState(true);
 const tabs=useRef<HTMLDivElement>(null);
 const o=OCC[i];const pkg=PACKAGES.find(p=>p.id===o.pkg);

 useEffect(()=>{setStill(matchMedia('(prefers-reduced-motion: reduce)').matches)},[]);
 useEffect(()=>{ // slide the underline to the active tab and keep it centred in the row
  const t=tabs.current;if(!t)return;
  const place=()=>{const b=t.querySelectorAll('button')[i] as HTMLElement|undefined;if(!b)return;
   t.style.setProperty('--x',b.offsetLeft+'px');t.style.setProperty('--w',b.offsetWidth+'px');
   t.scrollTo({left:b.offsetLeft-(t.clientWidth-b.offsetWidth)/2,behavior:'smooth'})};
  place();const ro=new ResizeObserver(place);ro.observe(t);return()=>ro.disconnect()},[i]);

 const pick=(n:number)=>{setI(n);setAuto(false)};
 const plan=()=>{ // pre-fill the quote form, then glide to it
  setAuto(false);
  window.dispatchEvent(new CustomEvent('catering:select-event',{detail:o.type}));
  window.dispatchEvent(new CustomEvent('catering:select-package',{detail:o.pkg}));
  document.getElementById('quote')?.scrollIntoView({behavior:still?'auto':'smooth',block:'start'})};

 return <div className="ob" onFocusCapture={()=>setAuto(false)}>
  {auto&&!still&&<i key={i} className="ob-prog" aria-hidden onAnimationEnd={()=>setI(n=>(n+1)%OCC.length)}/>}

  <div className="ob-tabs" ref={tabs} role="group" aria-label="Choose an event type">
   {OCC.map((x,n)=><button type="button" key={x.id} aria-pressed={i===n} className={i===n?'on':''} onClick={()=>pick(n)}>{x.title}</button>)}
   <span className="ob-ind" aria-hidden/>
  </div>

  <div className="ob-stage" aria-live={auto?'off':'polite'}>
   <div className="ob-body" key={o.id}>
    <p className="ob-line">{o.line}</p>
    <p className="ob-desc">{o.desc}</p>
    <ul>{o.bring.map(b=><li key={b}>{b}</li>)}</ul>
    <div className="ob-meta">
     <div><span>Suggested</span><b>{pkg?.name}</b></div>
     <div><span>From</span><b>{pkg?kes(pkg.per):''}<small> / person</small></b></div>
    </div>
    <button type="button" className="ob-go" onClick={plan}>Plan this event →</button>
   </div>

   <div className="ob-media">
    {OCC.map((x,n)=><div key={x.id} className={'ob-img'+(i===n?' on':'')} aria-hidden={i!==n}>
     <Pic id={x.img} alt={i===n?x.title:''} emoji={x.emoji} sizes="(min-width:900px) 40vw, 100vw"/></div>)}
    <div className="ob-chip"><b>{o.size}</b><span>typical guests</span></div>
   </div>
  </div>
 </div>;}