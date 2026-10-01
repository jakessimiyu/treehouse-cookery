'use client';
import {useEffect,useRef,useState} from 'react';
type O={no:number;status:string;pickup:string;notes:string;createdAt:number;paidAt?:number;items:{id:string;name:string;qty:number}[]};
const COLS=[['PAID','New','PREPARING','Start'],['PREPARING','Preparing','READY','Mark ready'],['READY','Ready','COMPLETED','Handed over']];
export default function Kitchen(){
 const [key,setKey]=useState('');const [orders,setOrders]=useState<O[]>([]);const [now,setNow]=useState(Date.now());const beep=useRef<HTMLAudioElement>(null);
 useEffect(()=>{setKey(localStorage.getItem('sk')||prompt('Staff key')||'');const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(!key)return;localStorage.setItem('sk',key);
  fetch('/api/orders',{headers:{'x-staff-key':key}}).then(r=>r.ok?r.json():[]).then(setOrders);
  const es=new EventSource('/api/kitchen/stream?key='+encodeURIComponent(key)); // real time, no refresh
  es.onmessage=e=>{const o:O=JSON.parse(e.data);setOrders(p=>[o,...p.filter(x=>x.no!==o.no)]);if(o.status==='PAID')beep.current?.play().catch(()=>{})};
  return()=>es.close()},[key]);
 const move=(no:number,status:string)=>fetch('/api/orders/'+no,{method:'PATCH',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify({status})});
 return <div className="board">{COLS.map(([st,label,next,act])=><div className="col" key={st}><h2>{label}</h2>
  {orders.filter(o=>o.status===st).map(o=>{const m=Math.floor((now-(o.paidAt||o.createdAt))/60000);
   return <div key={o.no} className={'ticket'+(m>=10&&st!=='READY'?' late':'')}><h3>#{o.no}</h3><small>{m} min waiting, pickup {o.pickup}</small>
   <ul>{o.items.map(i=><li key={i.id}><b>{i.qty}×</b> {i.name}</li>)}</ul>{o.notes&&<p><b>Note:</b> {o.notes}</p>}
   <button className="btn" onClick={()=>move(o.no,next)}>{act}</button></div>})}</div>)}
  <audio ref={beep} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="/></div>;}