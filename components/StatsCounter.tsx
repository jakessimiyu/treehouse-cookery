'use client';
import {useEffect,useRef,useState} from 'react';
const STATS:[number,string,string][]=[[12000,'+','Orders served'],[4.8,'','Average rating'],[7,' min','Typical prep time'],[19,'','Items on the menu']]; // SAMPLE numbers, replace with real ones
export default function StatsCounter(){
 const ref=useRef<HTMLUListElement>(null);const [p,setP]=useState(0);
 useEffect(()=>{const el=ref.current;if(!el)return;let raf=0;
  const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;io.disconnect();
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){setP(1);return}
   const t0=performance.now();
   const step=(t:number)=>{const k=Math.min(1,(t-t0)/1800);setP(k===1?1:1-Math.pow(2,-10*k));if(k<1)raf=requestAnimationFrame(step)};
   raf=requestAnimationFrame(step)},{threshold:.4});
  io.observe(el);return()=>{io.disconnect();cancelAnimationFrame(raf)}},[]);
 return <ul ref={ref} className="tx-stats tx-stg">{STATS.map(([n,suf,l])=>{const v=n*p;
  return <li key={l}><b><span aria-hidden>{Number.isInteger(n)?Math.round(v).toLocaleString('en-US'):v.toFixed(1)}{suf}</span>
   <span className="tx-sr">{n.toLocaleString('en-US')}{suf}</span></b><span>{l}</span></li>})}</ul>;}