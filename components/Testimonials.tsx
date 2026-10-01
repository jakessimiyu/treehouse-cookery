'use client';
import {useRef,useState} from 'react';
// SAMPLE TEXT. Replace with real customer reviews before launch.
const R=[['Best chicken on this side of town, and my order was ready before I got there.','Add a real name','Regular'],
 ['We order the office box every Friday. Nobody has ever complained.','Add a real name','Corporate customer'],
 ['Paying on M-Pesa and skipping the queue is a game changer.','Add a real name','Student']];
const MS=7000;
export default function Testimonials(){
 const [i,setI]=useState(0);const [dir,setDir]=useState(1);const [paused,setPaused]=useState(false);
 const x0=useRef(0);
 const go=(d:number)=>{setDir(d);setI(n=>(n+d+R.length)%R.length)};
 const jump=(n:number)=>{setDir(n>i?1:-1);setI(n)};
 const [q,name,role]=R[i];
 return <section className={'tx-tq'+(paused?' paused':'')} aria-roledescription="carousel" aria-label="Customer reviews"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}
  onTouchStart={e=>{x0.current=e.touches[0].clientX}}
  onTouchEnd={e=>{const d=e.changedTouches[0].clientX-x0.current;if(Math.abs(d)>50)go(d<0?1:-1)}}>
  <div className="tq-head"><h2 className="tx-rv">People talk.</h2>
   <div className="tx-arrows">
    <button type="button" aria-label="Previous review" onClick={()=>go(-1)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
    <button type="button" aria-label="Next review" onClick={()=>go(1)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div>
  <figure className="tq-fig" key={i} style={{'--y':dir>0?'.5em':'-.5em'} as React.CSSProperties}>
   <span className="tq-mark" aria-hidden>“</span>
   <blockquote><p aria-label={q}>{q.split(' ').map((w,n)=><span key={n}><span className="tq-w" aria-hidden style={{'--w':n} as React.CSSProperties}>{w}</span>{' '}</span>)}</p></blockquote>
   <figcaption><b>{name}</b><span>{role}</span></figcaption></figure>
  <div className="tq-segs">{R.map((_,n)=>
   <button key={n} type="button" className={n<i?'done':n===i?'now':''} aria-label={`Show review ${n+1}`} aria-current={n===i} onClick={()=>jump(n)}>
    <span className="tq-bar"><i style={{'--ms':MS+'ms'} as React.CSSProperties} onAnimationEnd={n===i?()=>go(1):undefined}/></span></button>)}
   <small aria-hidden>0{i+1} / 0{R.length}</small></div>
 </section>;}