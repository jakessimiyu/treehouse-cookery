'use client';
import {OCC} from '@/lib/occasions';

const Arrow=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;

export default function OccasionExplorer(){
 const go=(o:(typeof OCC)[number])=>{
  window.dispatchEvent(new CustomEvent('catering:select-event',{detail:o.type}));
  window.dispatchEvent(new CustomEvent('catering:select-package',{detail:o.pkg}));
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('quote')?.scrollIntoView({behavior:still?'auto':'smooth',block:'start'})};
 // mouse only: write cursor position / tilt to CSS variables (no re-render)
 const move=(e:React.PointerEvent<HTMLUListElement>)=>{
  if(e.pointerType!=='mouse')return;
  const b=(e.target as Element).closest<HTMLElement>('.oc-b');if(!b)return;
  const r=b.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  b.style.setProperty('--mx',x+'px');b.style.setProperty('--my',y+'px');
  b.style.setProperty('--ry',((x/r.width-.5)*6).toFixed(2)+'deg');
  b.style.setProperty('--rx',((.5-y/r.height)*6).toFixed(2)+'deg')};
 const reset=(e:React.PointerEvent<HTMLButtonElement>)=>{
  const s=e.currentTarget.style;s.setProperty('--rx','0deg');s.setProperty('--ry','0deg')};
 return <ul className="oc" onPointerMove={move}>
  {OCC.map((o,n)=><li key={o.id}>
   <button type="button" className="oc-b" onClick={()=>go(o)} onPointerLeave={reset}>
    <span className="oc-n" aria-hidden>{String(n+1).padStart(2,'0')}</span>
    <span className="oc-a" aria-hidden><i><Arrow/></i><i><Arrow/></i></span>
    <span className="oc-t">{o.title}</span>
   </button></li>)}
 </ul>;}