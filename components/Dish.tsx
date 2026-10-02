'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {useCart,kes,Item} from '@/lib/Cart';
export const BEST=['fried-chicken','loaded-chips','shawarma-chicken','burger-double'];
const SAUCES=['Garlic','Chilli','BBQ','Cheese'];

// Photos live in /public, named after the item id with spaces (e.g. "fried chicken.webp"). Emoji shows if a file is missing.
export function Pic({id,alt,emoji,eager,sizes='(min-width:900px) 280px, 72vw'}:{id:string;alt:string;emoji:string;eager?:boolean;sizes?:string}){
 const [bad,setBad]=useState(false);
 return <div className="tx-pic">{bad?<span className="tx-emo" aria-hidden>{emoji}</span>:
  <Image src={`/${encodeURIComponent(id.replace(/-/g,' '))}.webp`} alt={alt} fill sizes={sizes} priority={eager} onError={()=>setBad(true)} style={{objectFit:'cover'}}/>}</div>;}

export function Dish({it}:{it:Item}){
 const {cart,add,dec}=useCart();const qty=cart[it.id]||0;
 const [open,setOpen]=useState(false);const [sauce,setSauce]=useState('');const ref=useRef<HTMLDivElement>(null);
 const [flash,setFlash]=useState(false);const ft=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(ft.current),[]);
 const tilt=(e:React.PointerEvent)=>{if(e.pointerType!=='mouse')return;const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  el.style.transform=`perspective(700px) rotateY(${x*12}deg) rotateX(${-y*12}deg) scale(1.04)`;};
 const quick=(e:React.MouseEvent)=>{e.stopPropagation();add(it.id,sauce);setFlash(true);clearTimeout(ft.current);ft.current=setTimeout(()=>setFlash(false),1200)};
 const canSauce=['Chicken','Chips','Snacks','Shawarma'].includes(it.cat);
 return <article className={'tx-dish'+(open?' open':'')+(it.soldOut?' out':'')}>
  <div ref={ref} className="tx-tilt" role="button" tabIndex={0} aria-expanded={open} aria-label={`${it.name}, show details`}
   onPointerMove={tilt} onPointerLeave={()=>{if(ref.current)ref.current.style.transform=''}}
   onClick={()=>setOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(o=>!o)}}}>
   <Pic id={it.id} alt={it.name} emoji={it.emoji}/>{BEST.includes(it.id)&&!it.soldOut&&<span className="tx-badge">Bestseller</span>}
   {!it.soldOut&&<button type="button" className={'tx-quick'+(flash?' ok':'')} tabIndex={-1} aria-hidden onClick={quick} onKeyDown={e=>e.stopPropagation()}>{flash?'Added ✓':qty?`Add another · ${qty}`:'Order now +'}</button>}</div>
  <div className="tx-info"><h3>{it.name}</h3><p>{it.desc}</p>
   <ul className="tx-ing">{(it.ing||[]).map((g,n)=><li key={g} style={{transitionDelay:n*70+'ms'}}>{g}</li>)}</ul>
   {canSauce&&open&&<div className="tx-sauce">{SAUCES.map(s=><button type="button" key={s} className={sauce===s?'on':''} onClick={()=>setSauce(sauce===s?'':s)}>{s}</button>)}</div>}
   <div className="tx-buy"><b className="tx-price">{kes(it.price)}</b>
    {it.soldOut?<span>Sold out</span>:qty?
     <div className="tx-q"><button type="button" aria-label={'Remove one '+it.name} onClick={()=>dec(it.id)}>−</button><b>{qty}</b><button type="button" aria-label={'Add one '+it.name} onClick={()=>add(it.id,sauce)}>+</button></div>
     :<button type="button" className="tx-add" onClick={()=>add(it.id,sauce)}>Add</button>}</div></div></article>;}