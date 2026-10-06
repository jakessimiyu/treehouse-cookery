'use client';
import {useEffect,useRef,useState} from 'react';
import {useCart,kes} from '@/lib/Cart';
import {Pic,BEST} from '@/components/Dish';
import {BRAND} from '@/components/config';

const CATS=['All','Chicken','Chips','Shawarma','Burgers','Biryani','Snacks','Drinks','Combos'];
const QUICK:[string,number][]=[['ASAP',0],['In 15 min',15],['In 30 min',30],['In 45 min',45]];
const PHONE_OK=/^(\+?254|0)?[17]\d{8}$/;
const NOTE_MAX=150;
const IDEAS=['No onions','Extra sauce','Less spicy','Cut in half','Extra napkins']; // EDIT: one-tap notes
const nairobi=()=>{
 const p=new Intl.DateTimeFormat('en-GB',{hour:'numeric',minute:'numeric',hour12:false,timeZone:'Africa/Nairobi'}).formatToParts(new Date());
 const g=(t:string)=>Number(p.find(x=>x.type===t)?.value);
 return (g('hour')%24)*60+g('minute');
};
const fmt=(m:number)=>{const h=Math.floor(m/60)%24,mm=m%60;return `${h%12||12}:${String(mm).padStart(2,'0')} ${h<12?'am':'pm'}`};

// small text-style buttons (inline so they don't depend on the stylesheet)
const textBtn:React.CSSProperties={background:'none',border:0,color:'inherit',opacity:.8,cursor:'pointer',textDecoration:'underline',padding:'6px 4px',font:'inherit',fontSize:'.85rem'};
const xBtn:React.CSSProperties={background:'none',border:0,color:'inherit',opacity:.7,cursor:'pointer',padding:'4px 6px',font:'inherit'};

export default function OrderPage(){
 const {menu,loaded,cart,sauces,lines,gone,total,count,usual,add,dec,remove,clear,setAll,checkout}=useCart();
 const [tab,setTab]=useState('All');
 const [mode,setMode]=useState('ASAP');const [slot,setSlot]=useState<number|null>(null);
 const [notes,setNotes]=useState('');const [phone,setPhone]=useState('');const [err,setErr]=useState('');
 const [stage,setStage]=useState<'idle'|'sending'|'sent'>('idle');const [amt,setAmt]=useState(0);
 const [now,setNow]=useState<number|null>(null);
 const [sure,setSure]=useState(false); // "Clear order" needs a second tap
 const noteRef=useRef<HTMLTextAreaElement>(null);

 useEffect(()=>{try{setPhone(localStorage.getItem('phone')||'')}catch{}},[]);
 useEffect(()=>{setNow(nairobi());const t=setInterval(()=>setNow(nairobi()),30000);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(stage==='idle')return;const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=o}},[stage]);
 useEffect(()=>{ // measure the nav so the sticky category bar sits right under it
  const nav=document.querySelector('nav');
  const set=()=>document.documentElement.style.setProperty('--navh',(nav?.offsetHeight||64)+'px');
  set();const ro=new ResizeObserver(set);if(nav)ro.observe(nav);return()=>ro.disconnect()},[]);
 useEffect(()=>{if(!sure)return;const t=setTimeout(()=>setSure(false),3000);return()=>clearTimeout(t)},[sure]);
 useEffect(()=>{if(!lines.length)setSure(false)},[lines.length]);

 const list=menu.filter(m=>tab==='All'||m.cat===tab);
 const hasUsual=Object.keys(usual).length>0&&count===0;

 // custom pickup slots: every 15 min, at least 20 min from now, until 15 min before closing
 const slots:number[]=[];
 if(now!==null)for(let m=Math.max(Math.ceil((now+20)/15)*15,BRAND.open*60);m<=BRAND.close*60-15;m+=15)slots.push(m);
 const custom=mode==='custom';
 const slotOk=slot!==null&&slots.includes(slot);
 const pickup=custom&&slotOk?`At ${fmt(slot as number)}`:mode;
 const quick=QUICK.find(q=>q[0]===mode);
 const ready=custom
  ?(slotOk?`Ready at ${fmt(slot as number)}`:slots.length?'Choose a time below':'No more pickup slots today')
  :quick&&quick[1]&&now!==null?`Ready around ${fmt((now+quick[1])%1440)}`:"We'll start on it straight away";

 const clean=phone.replace(/[\s-]/g,'');const phoneOk=PHONE_OK.test(clean);
 const canPay=stage==='idle'&&lines.length>0&&phoneOk&&(!custom||slotOk);

 // kitchen note: one line only (the kitchen screen splits sauces from notes on " | ")
 const onNote=(e:React.ChangeEvent<HTMLTextAreaElement>)=>setNotes(e.target.value.replace(/\s*\n+\s*/g,' ').replace(/\s\|\s/g,' / '));
 const hasIdea=(p:string)=>notes.toLowerCase().includes(p.toLowerCase());
 const toggleIdea=(p:string)=>setNotes(n=>{
  const i=n.toLowerCase().indexOf(p.toLowerCase());
  if(i>=0)return (n.slice(0,i)+n.slice(i+p.length)).replace(/^[\s.,]+/,'').replace(/\s*\.\s*\./g,'.').replace(/\s{2,}/g,' ').trim();
  const next=n.trim()?`${n.trim().replace(/[.\s]+$/,'')}. ${p}`:p;
  return next.length>NOTE_MAX?n:next;
 });

 const pay=async()=>{
  if(!canPay)return;
  setErr('');setAmt(total);setStage('sending');
  const e=await checkout({phone:clean,pickup,notes:notes.trim()},()=>setStage('sent'));
  if(e){setStage('idle');setErr(e)}
 };

 return <div className="od">
  <div className="od-main">
   <div className="od-head">
    <p className="od-eye">Order ahead</p>
    <h1>What are you having?</h1>
    <p className="od-sub">Tap to add, pay with M-Pesa and we&apos;ll have it ready.</p>
    {hasUsual&&<button type="button" className="od-usual" onClick={()=>setAll(usual)}>↻ Order your usual again</button>}
   </div>

   <div className="od-tabbar"><div className="od-tabs" role="group" aria-label="Menu categories">{CATS.map(t=><button key={t} type="button" aria-pressed={tab===t} className={tab===t?'on':''} onClick={()=>setTab(t)}>{t}</button>)}</div></div>
   {!loaded&&<p className="od-empty">Loading the menu…</p>}

   <ul className="od-list">{list.map(m=><li key={m.id} className={'od-row'+(m.soldOut?' out':'')+(cart[m.id]?' in':'')}>
    <div className="od-thumb"><Pic id={m.id} sizes="112px" alt="" emoji={m.emoji}/>{BEST.includes(m.id)&&!m.soldOut&&<i>Popular</i>}</div>
    <div className="od-info"><h3>{m.name}</h3><p>{m.desc}</p><span className="od-price">{kes(m.price)}</span></div>
    {m.soldOut?<span className="od-soldout">Sold out</span>:cart[m.id]
     ?<div className="od-q"><button type="button" aria-label={'Remove one '+m.name} onClick={()=>dec(m.id)}>−</button><b key={cart[m.id]} aria-live="polite">{cart[m.id]}</b><button type="button" aria-label={'Add one '+m.name} onClick={()=>add(m.id)}>+</button></div>
     :<button type="button" className="od-add" aria-label={'Add '+m.name} onClick={()=>add(m.id)}>Add</button>}
   </li>)}</ul>
  </div>

  <aside id="summary" className="od-sum" aria-label="Your order">
   <div className="od-blk">
    <h2><span>01</span>Your order</h2>
    {!lines.length&&<p className="od-empty">Nothing yet. Add something tasty and it will show up here.</p>}
    {gone.length>0&&<p role="alert" className="od-warn">Just sold out: {gone.map(m=>m.name).join(', ')}. Left out of your total.
     <button type="button" style={{...textBtn,marginLeft:6}} onClick={()=>gone.forEach(m=>remove(m.id))}>Remove</button></p>}
    {lines.length>0&&<div className="od-lines">{lines.map(m=><div className="od-line" key={m.id}>
     <span>{cart[m.id]} × {m.name}{sauces[m.id]&&<em> ({sauces[m.id]})</em>}</span>
     <b>{kes(m.price*cart[m.id])}</b>
     <button type="button" style={xBtn} aria-label={'Remove '+m.name+' from your order'} title="Remove item" onClick={()=>remove(m.id)}>✕</button></div>)}
     <button type="button" style={{...textBtn,opacity:sure?1:.8,fontWeight:sure?700:400}}
      onClick={()=>{if(sure){clear();setSure(false)}else setSure(true)}}>{sure?'Tap again to clear everything':'Clear order'}</button>
    </div>}
    <div className="od-total"><span>Total</span><b>{kes(total)}</b></div>
   </div>

   <div className="od-blk">
    <h3 className="od-lbl"><span>02</span>Pickup time</h3>
    <div className="od-chips">
     {QUICK.map(([label])=><button key={label} type="button" aria-pressed={mode===label} className={mode===label?'on':''} onClick={()=>setMode(label)}>{label}</button>)}
     <button type="button" aria-pressed={custom} className={custom?'on':''} onClick={()=>setMode('custom')}>Pick a time</button>
    </div>
    {custom&&slots.length>0&&<div className="od-slots">{slots.map(m=><button key={m} type="button" aria-pressed={slot===m} className={slot===m?'on':''} onClick={()=>setSlot(m)}>{fmt(m)}</button>)}</div>}
    <p className="od-ready">{ready}</p>
   </div>

   <div className="od-blk">
    <h3 className="od-lbl"><span>03</span>Pay with M-Pesa</h3>

    <label className="od-flabel" htmlFor="od-phone">M-Pesa number</label>
    <input id="od-phone" className={'od-field'+(phone&&!phoneOk?' bad':'')} inputMode="tel" autoComplete="tel" enterKeyHint="next"
     placeholder="e.g. 0712 345 678" value={phone} onChange={e=>setPhone(e.target.value)}
     onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();noteRef.current?.focus()}}}/>
    {phone&&!phoneOk?<p className="od-hint err">Enter a valid number, e.g. 0712 345 678</p>:<p className="od-hint">We&apos;ll send the payment prompt to this number.</p>}

    <label className="od-flabel" htmlFor="od-note">Note for the kitchen <small>(optional)</small></label>
    <textarea id="od-note" ref={noteRef} className="od-field od-notebox" rows={2} maxLength={NOTE_MAX} enterKeyHint="done" autoCapitalize="sentences"
     placeholder="e.g. No onions. Extra sauce." value={notes} onChange={onNote}
     onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}}}/>
    <div className="od-ideas" role="group" aria-label="Quick notes">{IDEAS.map(p=>
     <button key={p} type="button" aria-pressed={hasIdea(p)} className={hasIdea(p)?'on':''}
      disabled={!hasIdea(p)&&notes.length+p.length+2>NOTE_MAX} onClick={()=>toggleIdea(p)}>{p}</button>)}</div>
    <p className="od-hint od-count"><span>The kitchen sees this on your order.</span><span>{notes.length}/{NOTE_MAX}</span></p>

    <button type="button" className="btn od-go" disabled={!canPay} onClick={pay}>{lines.length?`Pay ${kes(total)} with M-Pesa`:'Pay with M-Pesa'}</button>
    {err&&<p role="alert" className="od-hint err">{err}</p>}
    <p className="od-secure">You&apos;ll confirm with your M-Pesa PIN on your phone.</p>
   </div>
  </aside>

  {count>0&&<a className="od-bar" href="#summary"><span>View order · {count} {count===1?'item':'items'}</span><b>{kes(total)}</b></a>}

  {stage!=='idle'&&<div className="od-pay" role="alertdialog" aria-modal="true" aria-labelledby="od-t">
   <div className={'od-stage'+(stage==='sent'?' od-sent':'')}>
    <div className="od-orb">
     {[0,1,2].map(k=><i key={k} style={{'--k':k} as React.CSSProperties}/>)}
     <div className="od-core">
      <svg className="od-ph" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>
      <svg className="od-tick" viewBox="0 0 52 52" aria-hidden><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-16"/></svg>
     </div>
     {stage==='sent'&&<span className="od-burst" aria-hidden>{Array.from({length:14},(_,i)=><i key={i} style={{'--a':`${i*(360/14)}deg`} as React.CSSProperties}/>)}</span>}
    </div>
    <div className="od-txt" key={stage}>
     <h2 id="od-t">{stage==='sending'?'Sending your M-Pesa prompt':'Check your phone'}</h2>
     <p>{stage==='sending'?`Requesting ${kes(amt)} from ${clean}`:"Enter your M-Pesa PIN to complete payment. We'll take you to your order tracker next."}</p>
    </div>
    {stage==='sending'&&<div className="od-load" aria-hidden><i/></div>}
    {stage==='sent'&&<div className="od-pin" aria-hidden><small>M-PESA</small><b>{kes(amt)}</b>
     <div>{[0,1,2,3].map(n=><i key={n} style={{'--n':n} as React.CSSProperties}/>)}</div></div>}
   </div>
  </div>}
 </div>;}