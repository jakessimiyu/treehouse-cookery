'use client';
import Link from 'next/link';import {usePathname} from 'next/navigation';import {useEffect,useState} from 'react';
const P=({d}:{d:string})=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d}/></svg>;
const TABS:[string,string,string][]=[
 ['Home','/','M3 11l9-8 9 8M5 10v10h14V10'],
 ['Menu','/menu','M4 6h16M4 12h16M4 18h10'],
 ['Order','/order','M6 8h12l-1 12H7L6 8zM9 8a3 3 0 016 0'],
 ['Catering','/catering','M3 18h18M5 18a7 7 0 0114 0M12 8V6']];
const MORE:[string,string][]=[['Our Story','/story'],['Visit','/visit']];
export default function BottomNav(){
 const path=usePathname()||'/';const [more,setMore]=useState(false);
 useEffect(()=>setMore(false),[path]);
 useEffect(()=>{if(!more)return;
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setMore(false)};
  const c=(e:Event)=>{if(!(e.target as Element).closest('.tx-bn'))setMore(false)};
  addEventListener('keydown',k);addEventListener('pointerdown',c);
  return()=>{removeEventListener('keydown',k);removeEventListener('pointerdown',c)}},[more]);
 const on=(h:string)=>h==='/'?path==='/':path===h||path.startsWith(h+'/');
 const moreOn=MORE.some(([,h])=>on(h));
 return <nav className="tx-bn" aria-label="Main">
  {more&&<div className="bn-more" role="menu">{MORE.map(([t,h])=><Link key={h} href={h} role="menuitem" aria-current={on(h)?'page':undefined}>{t}</Link>)}</div>}
  {TABS.map(([t,h,d])=><Link key={h} href={h} className={on(h)?'on':''} aria-current={on(h)?'page':undefined}><P d={d}/><span>{t}</span></Link>)}
  <button type="button" className={moreOn||more?'on':''} aria-expanded={more} aria-haspopup="menu" onClick={()=>setMore(m=>!m)}>
   <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>More</span></button>
 </nav>;}