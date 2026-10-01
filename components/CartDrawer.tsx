'use client';
import {useEffect,useState} from 'react';import {usePathname} from 'next/navigation';
import {useCart,kes} from '@/lib/Cart';
const UPSELL=['soda','milkshake','brownie'];
export default function CartDrawer(){
 const {menu,cart,sauces,lines,gone,total,count,open,setOpen,bump,busy,add,dec,checkout}=useCart();
 const path=usePathname();const [phone,setPhone]=useState('');const [err,setErr]=useState('');
 useEffect(()=>{try{setPhone(localStorage.getItem('phone')||'')}catch{}},[]);
 useEffect(()=>{document.body.style.overflow=open?'hidden':'';
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};addEventListener('keydown',k);
  return()=>{removeEventListener('keydown',k);document.body.style.overflow=''}},[open,setOpen]);
 const ups=count>0?UPSELL.map(id=>menu.find(m=>m.id===id)).filter(m=>!!m&&!m.soldOut&&!cart[m.id]).slice(0,3):[];
 return <>
 {count>0&&path!=='/order'&&<button key={bump} className="tx-fab" onClick={()=>setOpen(true)} aria-label={`Open your order, ${count} items`}>🛒 {count} · {kes(total)}</button>}
 {open&&<div className="tx-ov" onClick={()=>setOpen(false)}/>}
 <aside className={'tx-drawer'+(open?' open':'')} role="dialog" aria-label="Your order" aria-hidden={!open}>
  <button className="tx-x" onClick={()=>setOpen(false)}>Close</button><h2>Your order</h2>
  {!lines.length&&<p>Nothing yet. Tap Add on anything that looks good.</p>}
  {gone.length>0&&<p role="alert" className="tx-warn">Just sold out: {gone.map(m=>m.name).join(', ')}. Left out of your total.</p>}
  {lines.map(m=><div className="tx-line" key={m.id}><span>{cart[m.id]} × {m.name}{sauces[m.id]&&<em> ({sauces[m.id]})</em>}</span>
   <div className="tx-q"><button aria-label={'Remove one '+m.name} onClick={()=>dec(m.id)}>−</button><button aria-label={'Add one '+m.name} onClick={()=>add(m.id)}>+</button></div></div>)}
  {ups.length>0&&<div className="tx-up"><small>Add something?</small>{ups.map(m=>m&&<button key={m.id} onClick={()=>add(m.id)}>{m.emoji} {m.name} +{kes(m.price)}</button>)}</div>}
  <div className="tx-total">TOTAL: {kes(total)}</div>
  <input aria-label="M-Pesa number" inputMode="tel" autoComplete="tel" placeholder="M-Pesa number, 07…" value={phone} onChange={e=>setPhone(e.target.value)}/>
  <button className="btn tx-pay" disabled={busy||!phone||!lines.length} onClick={async()=>{setErr('');setErr((await checkout({phone,pickup:'ASAP',notes:''}))||'')}}>{busy?'Sending M-Pesa prompt…':'CHECKOUT →'}</button>
  {err&&<p role="alert" style={{color:'#ffb4a8'}}>{err}</p>}
 </aside></>;}