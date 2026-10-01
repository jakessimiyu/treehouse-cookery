'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {useRouter} from 'next/navigation';
type R={no:number;ts:number};
const LABEL:Record<string,string>={PENDING_PAYMENT:'Awaiting payment',PAID:'Confirmed',PREPARING:'Preparing',READY:'Ready',COMPLETED:'Complete',CANCELLED:'Cancelled',PAYMENT_FAILED:'Payment failed'};
const LIVE=['PENDING_PAYMENT','PAID','PREPARING','READY'];
export default function TrackIndex(){
 const r=useRouter();const [n,setN]=useState('');const [recent,setRecent]=useState<R[]>([]);const [st,setSt]=useState<Record<number,string>>({});
 useEffect(()=>{document.title='Track your order | Treehouse';
  try{const l:R[]=JSON.parse(localStorage.getItem('myOrders')||'[]');setRecent(l);
   l.forEach(o=>fetch('/api/orders/'+o.no,{cache:'no-store'}).then(x=>x.ok?x.json():null).then(j=>{if(j?.status)setSt(s=>({...s,[o.no]:j.status}))}).catch(()=>{}))}catch{}},[]);
 const active=recent.find(o=>LIVE.includes(st[o.no]||''));
 const go=(e:React.FormEvent)=>{e.preventDefault();const d=n.replace(/\D/g,'');if(d)r.push('/track/'+d)};
 return <>
  <header className="tx-mhead"><h1>Track your <em>order</em></h1><p>Enter your order number to see where it is.</p></header>
  <div className="tf">
   {active&&<Link className="tf-active" href={'/track/'+active.no}>
    <span><small>Active order</small><b>#{active.no}</b></span><span className="tf-pill">{LABEL[st[active.no]]} →</span></Link>}
   <form className="tf-form" onSubmit={go}>
    <label htmlFor="tfn">Order number</label>
    <div><input id="tfn" inputMode="numeric" placeholder="e.g. 1042" value={n} onChange={e=>setN(e.target.value)}/>
     <button className="btn" disabled={!n.replace(/\D/g,'')}>Track order</button></div></form>
   {recent.length>0&&<div className="tf-recent"><h2>Recent on this device</h2>
    <ul>{recent.map(o=><li key={o.no}><Link href={'/track/'+o.no}>
     <span>Order #{o.no}<small>{new Date(o.ts).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Africa/Nairobi'})}</small></span>
     {st[o.no]&&<span className={'tf-pill'+(LIVE.includes(st[o.no])?' live':'')}>{LABEL[st[o.no]]||st[o.no]}</span>}</Link></li>)}</ul></div>}
  </div></>;}