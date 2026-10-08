'use client';
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';
import {useCart,kes,Item} from '@/lib/Cart';
import {Dish,Pic} from '@/components/Dish';
import OpenNow from '@/components/OpenNow';import StatsCounter from '@/components/StatsCounter';import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';import CateringTeaser from '@/components/CateringTeaser';
import Rail from '@/components/Rail';
const CRAVE=['Crispy','Spicy','Cheesy','Filling','Quick','Sweet'];
const REP:Record<string,string>={Crispy:'fried-chicken',Spicy:'hot-wings',Cheesy:'burger-double',Filling:'chicken-biryani',Quick:'masala-chips',Sweet:'milkshake'};
const dl=(s:string)=>({'--d':s}) as React.CSSProperties;

export default function Home(){
 const {menu,loaded,add}=useCart();
 const [crave,setCrave]=useState('');const [added,setAdded]=useState(false);
 const [pick,setPick]=useState<Item|null>(null);const [rolling,setRolling]=useState(false);const [ticker,setTicker]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const spin=useRef<ReturnType<typeof setInterval>|undefined>(undefined);
 useEffect(()=>()=>{clearTimeout(timer.current);clearInterval(spin.current)},[]);

 const by=(ids:string[])=>ids.map(id=>menu.find(m=>m.id===id)).filter((m):m is Item=>!!m);
 const cat=(c:string)=>menu.filter(m=>m.cat===c);
 const match=(c:string)=>menu.filter(m=>(m.tags||[]).includes(c.toLowerCase()));
 const bir=menu.find(m=>m.id==='chicken-biryani');
 const rail=(title:string,items:Item[],cls:string,id?:string)=>items.length?
  <Rail title={title} cls={cls} id={id}>{items.map(it=><Dish key={it.id} it={it}/>)}</Rail>:null;
 const picks=crave?match(crave):[];
 const addBir=()=>{if(!bir)return;add(bir.id);setAdded(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setAdded(false),1400)};
 const choose=(c:string)=>{setCrave(crave===c?'':c);setPick(null)};
 const roll=()=>{
  if(rolling)return;
  const base=(crave?match(crave):menu).filter(m=>!m.soldOut);
  if(!base.length)return;
  const pool=base.length>1?base.filter(m=>m.id!==pick?.id):base;
  const target=pool[Math.floor(Math.random()*pool.length)];
  setRolling(true);setPick(null);let n=0;
  clearInterval(spin.current);
  spin.current=setInterval(()=>{
   setTicker(base[Math.floor(Math.random()*base.length)].name);
   if(++n>=8){clearInterval(spin.current);setRolling(false);setPick(target)}
  },90);
 };

 return <>
 <header className="tx-hero">
  <div className="tx-heroimg"><div className="tx-parwrap" data-par="-.12"><Pic id="hero" sizes="100vw" alt="Crispy chicken and loaded chips" eager/></div></div>
  <div className="tx-hi" style={dl('.1s')}><OpenNow/></div>
  <h1 className="tx-h1"><span><i>GOOD FOOD.</i></span><span><i>BAD DECISIONS.</i></span></h1>
  <p className="tx-sub tx-hi" style={dl('.8s')}>Crispy, loaded, ready in minutes. Order here, pay with M-Pesa, walk past the queue.</p>
  <div className="tx-cta tx-hi" style={dl('.95s')}>
   <Link className="btn" data-mag href="/order">ORDER NOW</Link>
   <Link className="btn tx-ghost" data-mag href="/menu">EXPLORE MENU</Link></div>
  <div className="tx-cue" aria-hidden><span>SCROLL</span><i/></div>
 </header>

 <section className="tx-crave"><h2 className="tx-rv">WHAT ARE YOU CRAVING?</h2>
  <div className="tx-tiles">{CRAVE.map(c=>{const n=match(c).length;
   return <button key={c} type="button" className={'tx-tile'+(crave===c?' on':'')} aria-pressed={crave===c} disabled={loaded&&!n} onClick={()=>choose(c)}>
    <Pic id={REP[c]} sizes="(min-width:1000px) 200px, (min-width:600px) 33vw, 50vw" alt=""/>
    <span className="tx-tl"><b>{c}</b>{loaded&&<small>{n} {n===1?'dish':'dishes'}</small>}</span></button>})}</div>
  <button type="button" className={'btn tx-ghost dk tx-surprise'+(rolling?' rolling':'')} onClick={roll} disabled={!loaded}>{rolling?ticker:pick?'Roll again':'Surprise me'}</button>
  <div aria-live="polite">
   {pick&&<div className="tx-spot tx-fade" key={pick.id}><p className="tx-hint">{crave?`A ${crave.toLowerCase()} pick for you`:'Today’s pick for you'}</p><Dish it={pick}/></div>}
   {!pick&&!rolling&&!crave&&<p className="tx-hint">Pick a craving, or let us choose for you.</p>}
   {!pick&&!rolling&&crave&&(picks.length
    ?<div className="tx-track tx-fade" key={crave}>{picks.map(it=><Dish key={it.id} it={it}/>)}</div>
    :<p className="tx-hint">Nothing matches that today. Try another.</p>)}
  </div>
 </section>

 {!loaded&&<div className="tx-skel" aria-hidden><i/><i/><i/><i/></div>}
 {rail('PEOPLE ARE OBSESSED WITH',by(['fried-chicken','loaded-chips','shawarma-chicken','burger-double','milkshake']),'tx-s1','obsessed')}
 {bir&&<section className="tx-sig tx-mask"><div className="tx-sigimg"><div className="tx-parwrap" data-par=".1"><Pic id={bir.id} sizes="100vw" alt={bir.name}/></div></div>
  <svg className="tx-stamp" viewBox="0 0 120 120" aria-hidden><defs><path id="tx-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
   <text><textPath href="#tx-ring" textLength="286" lengthAdjust="spacing">SLOW-COOKED ✦ FRAGRANT ✦ LOADED ✦ </textPath></text></svg>
  <div className="tx-sigtxt tx-rv"><h2>THE CHICKEN BIRYANI</h2><p>Slow-cooked. Fragrant. Loaded.</p><b>{kes(bir.price)}</b>
   {bir.soldOut?<span>Sold out today</span>:<button className="tx-add big" onClick={addBir} aria-live="polite">{added?'ADDED ✓':'ADD TO ORDER'}</button>}</div></section>}
 {rail('CHICKEN FIX',cat('Chicken'),'tx-s2')}
 {rail('WRAPPED & LOADED',[...cat('Shawarma'),...by(['wrap'])],'tx-s3')}
 {rail("FRIES DON'T HAVE TO BE BORING",cat('Chips'),'tx-s4')}
 {rail('COMBOS: SOLO, COUPLES, SQUADS, TEAMS',cat('Combos'),'tx-s5','combos')}

 <section className="tx-cta2"><h2 className="tx-rv">HUNGRY YET?</h2>
  <div className="tx-cta"><Link className="btn" data-mag href="/order">START YOUR ORDER</Link><Link className="btn tx-ghost" data-mag href="/menu">SEE THE FULL MENU</Link></div></section>

 <HowItWorks/><StatsCounter/><Testimonials/><CateringTeaser/>
 </>;}