'use client';
import {useEffect,useRef,useState} from 'react';
// SAMPLE TEXT. Replace with real customer reviews before launch.
const R=[['The loaded fries never disappoints. It has become my go-to spot whenever I’m around.','James M.','Regular'],
 ['Ordering online is a game changer, especially when I’m rushing between classes.','Sharon W.','Student'],
 ['Our team loved it. Easy ordering, generous portions, and everything arrived exactly as ordered.','Daniel K.','Corporate Customer']];
const SLIDES=R.map(([q,name,role])=>({q,name,role,words:q.split(' ')}));
const MS=7000;
const css=(v:Record<string,string|number>)=>v as React.CSSProperties;

export default function Testimonials(){
 const [i,setI]=useState(0);const [dir,setDir]=useState(1);
 const [inView,setInView]=useState(false);const [hover,setHover]=useState(false);
 const [focus,setFocus]=useState(false);const [away,setAway]=useState(false);
 const root=useRef<HTMLElement>(null);const t0=useRef({x:0,y:0});
 const paused=!inView||hover||focus||away;

 useEffect(()=>{ // run only while the section is on screen and the tab is visible
  const el=root.current;if(!el)return;
  const io=new IntersectionObserver(([e])=>setInView(e.isIntersecting),{threshold:.3});
  io.observe(el);
  const vis=()=>setAway(document.hidden);
  document.addEventListener('visibilitychange',vis);
  return()=>{io.disconnect();document.removeEventListener('visibilitychange',vis)};
 },[]);

 const go=(d:number)=>{setDir(d);setI(n=>(n+d+R.length)%R.length)};
 const jump=(n:number)=>{setDir(n>i?1:-1);setI(n)};

 return <section ref={root} className={'tx-tq'+(paused?' paused':'')} aria-roledescription="carousel" aria-label="Customer reviews"
  onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true)}}
  onPointerLeave={e=>{if(e.pointerType==='mouse')setHover(false)}}
  onFocus={e=>{if(e.target.matches(':focus-visible'))setFocus(true)}}
  onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocus(false)}}
  onTouchStart={e=>{t0.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}}
  onTouchEnd={e=>{
   const dx=e.changedTouches[0].clientX-t0.current.x,dy=e.changedTouches[0].clientY-t0.current.y;
   if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1)}}>
  <div className="tq-head"><h2 className="tx-rv">People talk.</h2>
   <div className="tx-arrows">
    <button type="button" aria-label="Previous review" onClick={()=>go(-1)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
    <button type="button" aria-label="Next review" onClick={()=>go(1)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div>

  <div className="tq-stage" style={css({'--y':dir>0?'.5em':'-.5em'})}>
   {SLIDES.map((s,n)=><figure key={n} className={'tq-fig'+(n===i?' on':'')} aria-hidden={n!==i}>
    <span className="tq-mark" aria-hidden>“</span>
    <blockquote><p><span className="tx-sr">{s.q}</span>{s.words.map((w,k)=>
     <span key={k} aria-hidden><span className="tq-w" style={css({'--w':k})}>{w}</span>{' '}</span>)}</p></blockquote>
    <figcaption><b>{s.name}</b><span>{s.role}</span></figcaption>
   </figure>)}
  </div>

  <div className="tq-segs" style={css({'--ms':MS+'ms'})}>{R.map((_,n)=>
   <button key={n} type="button" className={n<i?'done':n===i?'now':''} aria-label={`Show review ${n+1}`} aria-current={n===i} onClick={()=>jump(n)}>
    <span className="tq-bar"><i onAnimationEnd={n===i?()=>go(1):undefined}/></span></button>)}
   <small aria-hidden>0{i+1} / 0{R.length}</small></div>
 </section>;}