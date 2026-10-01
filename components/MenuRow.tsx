'use client';
import {useState} from 'react';
import {useCart,kes,Item} from '@/lib/Cart';
import {Pic,BEST} from '@/components/Dish';
const SAUCES=['Garlic','Chilli','BBQ','Cheese'];
const SAUCE_CATS=['Chicken','Chips','Snacks','Shawarma'];

export default function MenuRow({it}:{it:Item}){
 const {cart,add,dec}=useCart();const qty=cart[it.id]||0;
 const [open,setOpen]=useState(false);const [sauce,setSauce]=useState('');
 const canSauce=SAUCE_CATS.includes(it.cat)&&!it.soldOut;const pid='mr-'+it.id;
 return <article className={'mn-row'+(open?' open':'')+(it.soldOut?' out':'')}>
  <button type="button" className="mn-main" aria-expanded={open} aria-controls={pid} onClick={()=>setOpen(o=>!o)}>
   <span className="mn-img"><Pic id={it.id} alt="" emoji={it.emoji} sizes="128px"/>{BEST.includes(it.id)&&!it.soldOut&&<i>Popular</i>}</span>
   <span className="mn-txt"><span className="mn-name">{it.name}</span><span className="mn-desc">{it.desc}</span><span className="mn-price">{kes(it.price)}</span></span>
  </button>
  <div className="mn-act">
   {it.soldOut?<span className="mn-sold">Sold out</span>:qty?
    <div className="mn-q"><button type="button" aria-label={'Remove one '+it.name} onClick={()=>dec(it.id)}>−</button><b key={qty} aria-live="polite">{qty}</b>
     <button type="button" aria-label={'Add one '+it.name} onClick={()=>add(it.id,sauce)}>+</button></div>
    :<button type="button" className="mn-add" aria-label={'Add '+it.name} onClick={()=>add(it.id,sauce)}>Add</button>}
  </div>
  <div id={pid} className="mn-more" inert={!open}><div className="mn-moreinner"><div className="mn-pad">
   {(it.ing||[]).length>0&&<p className="mn-ing"><span>What&apos;s inside</span>{(it.ing||[]).map(g=><i key={g}>{g}</i>)}</p>}
   {canSauce&&<div className="mn-sauce" role="group" aria-label="Choose a sauce"><span>Sauce</span>
    {SAUCES.map(s=><button type="button" key={s} aria-pressed={sauce===s} onClick={()=>setSauce(sauce===s?'':s)}>{s}</button>)}</div>}
  </div></div></div>
 </article>;}