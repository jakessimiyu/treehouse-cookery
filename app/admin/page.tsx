'use client';
import {useCallback,useEffect,useState} from 'react';
type M={id:string;name:string;price:number;soldOut:boolean};
type O={status:string;total:number;items:{name:string;qty:number}[]};
type Lead={id:number;ref:string;status:string;createdAt:number;data:Record<string,string|number>};
const ST={reservations:['NEW','CONFIRMED','COMPLETED','CANCELLED'],catering:['NEW','QUOTED','CONFIRMED','DONE','DECLINED']};
export default function Admin(){
 const [key,setKey]=useState('');const [tab,setTab]=useState('Overview');
 const [menu,setMenu]=useState<M[]>([]);const [orders,setOrders]=useState<O[]>([]);const [res,setRes]=useState<Lead[]>([]);const [cat,setCat]=useState<Lead[]>([]);
 const load=useCallback((k:string)=>{const h={'x-staff-key':k};const j=(u:string)=>fetch(u,{headers:h}).then(r=>r.ok?r.json():[]);
  fetch('/api/menu').then(r=>r.json()).then(setMenu);j('/api/orders').then(setOrders);j('/api/leads/reservations').then(setRes);j('/api/leads/catering').then(setCat)},[]);
 useEffect(()=>{const k=localStorage.getItem('sk')||prompt('Staff key')||'';setKey(k);localStorage.setItem('sk',k);load(k);
  const t=setInterval(()=>load(k),15000);return()=>clearInterval(t)},[load]);
 const paid=orders.filter(o=>!['PENDING_PAYMENT','PAYMENT_FAILED','CANCELLED'].includes(o.status));
 const rev=paid.reduce((a,o)=>a+o.total,0);
 const pop:Record<string,number>={};paid.forEach(o=>o.items.forEach(i=>pop[i.name]=(pop[i.name]||0)+i.qty));
 const toggle=async(m:M)=>{await fetch('/api/admin/menu/'+m.id,{method:'PATCH',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify({soldOut:!m.soldOut})});load(key)};
 const setStatus=async(kind:'reservations'|'catering',id:number,status:string)=>{await fetch(`/api/leads/${kind}/${id}`,{method:'PATCH',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify({status})});load(key)};
 const nRes=res.filter(l=>l.status==='NEW').length,nCat=cat.filter(l=>l.status==='NEW').length;
 const sel=(kind:'reservations'|'catering',l:Lead)=><select aria-label={'Status for '+l.ref} value={l.status} onChange={e=>setStatus(kind,l.id,e.target.value)}>{ST[kind].map(s=><option key={s}>{s}</option>)}</select>;
 const tel=(p:string|number)=><a href={'tel:+'+p}>+{p}</a>;
 return <section style={{maxWidth:'80rem'}}><h1 style={{fontSize:'2rem'}}>Admin</h1>
 <div className="tx-tabs">{[['Overview','Overview'],['Reservations',`Reservations${nRes?` (${nRes} new)`:''}`],['Catering',`Catering${nCat?` (${nCat} new)`:''}`]].map(([t,l])=>
  <button key={t} className={tab===t?'on':''} onClick={()=>setTab(t)}>{l}</button>)}</div>
 {tab==='Overview'&&<><p><b>{paid.length}</b> orders, <b>KES {rev.toLocaleString()}</b> revenue, average <b>KES {paid.length?Math.round(rev/paid.length):0}</b>. Top sellers: {Object.entries(pop).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,q])=>`${n} (${q})`).join(', ')||'none yet'}</p>
  <h2 style={{fontSize:'1.4rem'}}>Menu availability</h2><table><tbody>{menu.map(m=><tr key={m.id}><td>{m.name}</td><td>KES {m.price}</td><td><button className="btn" onClick={()=>toggle(m)}>{m.soldOut?'Mark available':'Mark sold out'}</button></td></tr>)}</tbody></table></>}
 {tab==='Reservations'&&<div style={{overflowX:'auto'}}><table><thead><tr><th>Ref</th><th>When</th><th>Guests</th><th>Contact</th><th>Requests</th><th>Status</th></tr></thead><tbody>
  {res.map(l=><tr key={l.id}><td>{l.ref}</td><td>{l.data.date} {l.data.time}</td><td>{l.data.guests}</td><td>{l.data.name}<br/>{tel(l.data.phone)}</td><td>{l.data.requests||'-'}</td><td>{sel('reservations',l)}</td></tr>)}
  {!res.length&&<tr><td colSpan={6}>No reservations yet.</td></tr>}</tbody></table></div>}
 {tab==='Catering'&&<div style={{overflowX:'auto'}}><table><thead><tr><th>Ref</th><th>Event</th><th>Date</th><th>People</th><th>Contact</th><th>Details</th><th>Status</th></tr></thead><tbody>
  {cat.map(l=><tr key={l.id}><td>{l.ref}</td><td>{l.data.eventType}<br/><small>{l.data.interest}, {l.data.fulfilment}</small></td><td>{l.data.date}</td><td>{l.data.guests}</td>
   <td>{l.data.name}{l.data.company?` (${l.data.company})`:''}<br/>{tel(l.data.phone)}{l.data.email&&<><br/>{l.data.email}</>}</td>
   <td>{l.data.venue&&<>{l.data.venue}<br/></>}{l.data.budget&&<>Budget: {l.data.budget}<br/></>}{l.data.details}</td><td>{sel('catering',l)}</td></tr>)}
  {!cat.length&&<tr><td colSpan={7}>No catering enquiries yet.</td></tr>}</tbody></table></div>}
 </section>;}