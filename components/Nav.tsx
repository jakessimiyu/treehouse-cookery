'use client';
import Link from 'next/link';import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';import NavCart from './NavCart';
export default function Nav({links}:{links:[string,string][]}){
 const path=usePathname();const [open,setOpen]=useState(false);
 useEffect(()=>{setOpen(false)},[path]);
 useEffect(()=>{
  document.documentElement.style.overflow=open?'hidden':'';document.body.classList.toggle('nav-open',open);
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};
  const mq=matchMedia('(min-width:900px)');const m=()=>{if(mq.matches)setOpen(false)};
  addEventListener('keydown',k);mq.addEventListener('change',m);
  return()=>{removeEventListener('keydown',k);mq.removeEventListener('change',m);
   document.documentElement.style.overflow='';document.body.classList.remove('nav-open')}},[open]);
 const on=(h:string)=>h==='/'?path==='/':path.startsWith(h);
 return <nav className="tx-nav" aria-label="Main">
  <b><Link href="/">Treehouse</Link></b>
  <div className="tx-links">{links.map(([t,h])=><Link key={h} href={h} aria-current={on(h)?'page':undefined}>{t}</Link>)}</div>
  <NavCart/>
  <button className="tx-burger" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="tx-sheet" onClick={()=>setOpen(!open)}><span/><span/></button>
  <div id="tx-sheet" className={'tx-sheet'+(open?' open':'')} aria-hidden={!open}>
   {links.map(([t,h],i)=><Link key={h} className="lk" href={h} style={{'--i':i} as React.CSSProperties} aria-current={on(h)?'page':undefined} tabIndex={open?0:-1}>{t}</Link>)}
   <Link className="btn" href="/order" style={{'--i':links.length} as React.CSSProperties} tabIndex={open?0:-1}>Order now</Link>
  </div></nav>;}