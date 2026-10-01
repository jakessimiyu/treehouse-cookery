'use client';
import {useEffect,useRef} from 'react';
// One global engine: scroll reveals, parallax, magnetic buttons, progress bar.
export default function Motion(){
 const bar=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  let par:HTMLElement[]=[],raf=0,sraf=0;
  const tick=()=>{raf=0;const vh=innerHeight,max=document.documentElement.scrollHeight-vh;
   if(bar.current)bar.current.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;
   if(reduce)return;
   const rs=par.map(el=>el.parentElement!.getBoundingClientRect()); // read all, then write all
   par.forEach((el,i)=>{const p=rs[i];if(p.bottom<0||p.top>vh)return;
    el.style.transform=`translate3d(0,${(p.top+p.height/2-vh/2)*Number(el.dataset.par)}px,0) scale(1.15)`})};
  const on=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const scan=()=>{sraf=0;
   document.querySelectorAll('.tx-rv:not(.in),.tx-stg:not(.in),.tx-mask:not(.in)').forEach(n=>reduce?n.classList.add('in'):io.observe(n));
   par=[...document.querySelectorAll<HTMLElement>('[data-par]')];on()};
  const mo=new MutationObserver(()=>{if(!sraf)sraf=requestAnimationFrame(scan)});
  mo.observe(document.body,{childList:true,subtree:true});scan();
  addEventListener('scroll',on,{passive:true});addEventListener('resize',on);

  let cur:HTMLElement|null=null;
  const rst=(t:HTMLElement)=>{t.style.setProperty('--mx','0px');t.style.setProperty('--my','0px')};
  const mv=(e:PointerEvent)=>{
   const t=e.target instanceof Element?e.target.closest<HTMLElement>('[data-mag]'):null;
   if(cur&&cur!==t)rst(cur);cur=t;if(!t)return;
   const r=t.getBoundingClientRect();
   t.style.setProperty('--mx',(e.clientX-r.left-r.width/2)*.25+'px');
   t.style.setProperty('--my',(e.clientY-r.top-r.height/2)*.35+'px')};
  if(fine&&!reduce)addEventListener('pointermove',mv,{passive:true});

  return()=>{io.disconnect();mo.disconnect();removeEventListener('scroll',on);removeEventListener('resize',on);
   removeEventListener('pointermove',mv);cancelAnimationFrame(raf);cancelAnimationFrame(sraf)}},[]);
 return <div ref={bar} className="tx-prog" aria-hidden/>;}