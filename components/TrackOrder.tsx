'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';
export default function TrackOrder(){
 const [n,setN]=useState('');const r=useRouter();
 return <form className="fx-track" onSubmit={e=>{e.preventDefault();const d=n.replace(/\D/g,'');if(d)r.push('/track/'+d)}}>
  <div><h3>Already ordered?</h3><label htmlFor="fxo">Track your order</label></div>
  <div className="fx-tf"><input id="fxo" inputMode="numeric" placeholder="Order number, e.g. 1042" value={n} onChange={e=>setN(e.target.value)}/>
   <button className="btn">Track</button></div></form>;}