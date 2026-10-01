'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';import {BRAND} from './config';
export default function Visit(){
 const [n,setN]=useState('');const r=useRouter();
 return <section id="visit" className="tx-visit"><div><h2 className="tx-rv">COME HUNGRY.</h2>
  <p>{BRAND.address}</p><p>{BRAND.hoursText}</p><p><a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a></p>
  <a className="btn" href={BRAND.maps} target="_blank" rel="noreferrer">Get directions</a></div>
  <form className="tx-lookup" onSubmit={e=>{e.preventDefault();if(n)r.push('/track/'+n.replace(/\D/g,''))}}>
   <h3>Already ordered?</h3><label htmlFor="ono">Track your order</label>
   <div><input id="ono" inputMode="numeric" placeholder="Order number, e.g. 1042" value={n} onChange={e=>setN(e.target.value)}/><button className="btn">Track</button></div></form></section>;}