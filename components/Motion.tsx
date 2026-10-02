'use client';
import {useEffect,useRef} from 'react';
// Rich motion = desktop + mouse + no reduced-motion. Phones/tablets do nothing here.
export default function Motion(){
 const bar=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const rich=matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
  if(!rich)return;
  const root=document.documentElement;root.classList.add('mo');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  let par:HTMLElement[]=[],raf=0,timer=0,max=1;
  const tick=()=>{raf=0;const vh=innerHeight;
   if(bar.current)bar.current.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;
   const rs=par.map(el=>el.parentElement!.getBoundingClientRect());
   par.forEach((el,i)=>{const p=rs[i];if(p.bottom<0||p.top>vh)return;
    el.style.transform=`translate3d(0,${(p.top+p.height/2-vh/2)*Number(el.dataset.par)}px,0) scale(1.15)`})};
  const on=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const scan=()=>{timer=0;max=root.scrollHeight-innerHeight;
   document.querySelectorAll('.tx-rv:not(.in),.tx-stg:not(.in),.tx-mask:not(.in)').forEach(n=>io.observe(n));
   par=[...document.querySelectorAll<HTMLElement>('[data-par]')];on()};
  const mo=new MutationObserver(()=>{clearTimeout(timer);timer=window.setTimeout(scan,150)});
  mo.observe(document.getElementById('main')||document.body,{childList:true,subtree:true});
  scan();addEventListener('scroll',on,{passive:true});addEventListener('resize',scan);

  let cur:HTMLElement|null=null;
  const rst=(t:HTMLElement)=>{t.style.setProperty('--mx','0px');t.style.setProperty('--my','0px')};
  const mv=(e:PointerEvent)=>{
   const t=e.target instanceof Element?e.target.closest<HTMLElement>('[data-mag]'):null;
   if(cur&&cur!==t)rst(cur);cur=t;if(!t)return;
   const r=t.getBoundingClientRect();
   t.style.setProperty('--mx',(e.clientX-r.left-r.width/2)*.25+'px');
   t.style.setProperty('--my',(e.clientY-r.top-r.height/2)*.35+'px')};
  addEventListener('pointermove',mv,{passive:true});

  return()=>{root.classList.remove('mo');io.disconnect();mo.disconnect();
   removeEventListener('scroll',on);removeEventListener('resize',scan);removeEventListener('pointermove',mv);
   cancelAnimationFrame(raf);clearTimeout(timer)}},[]);
 return <div ref={bar} className="tx-prog" aria-hidden/>;}