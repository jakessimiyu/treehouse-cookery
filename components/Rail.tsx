'use client';
import {useEffect,useRef,useState} from 'react';
const Arr=({flip}:{flip?:boolean})=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={flip?{transform:'rotate(180deg)'}:undefined} aria-hidden><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
export default function Rail({title,cls='',id,base='tx-rail',children}:{title:string;cls?:string;id?:string;base?:string;children:React.ReactNode}){
 const tr=useRef<HTMLDivElement>(null),thumb=useRef<HTMLElement>(null);
 const [end,setEnd]=useState<[boolean,boolean]>([true,false]);
 useEffect(()=>{
  const el=tr.current!,th=thumb.current!;let raf=0;
  const upd=()=>{raf=0;const max=el.scrollWidth-el.clientWidth;
   if(max<=2){th.style.width='100%';th.style.transform='none';setEnd(s=>s[0]&&s[1]?s:[true,true]);return}
   const r=el.clientWidth/el.scrollWidth,p=el.scrollLeft/max;
   th.style.width=r*100+'%';th.style.transform=`translateX(${p*(1-r)/r*100}%)`;
   const a=el.scrollLeft<4,b=el.scrollLeft>max-4;setEnd(s=>s[0]===a&&s[1]===b?s:[a,b])};
  const on=()=>{if(!raf)raf=requestAnimationFrame(upd)};
  el.addEventListener('scroll',on,{passive:true});
  const ro=new ResizeObserver(on);ro.observe(el);
  const mo=new MutationObserver(on);mo.observe(el,{childList:true});on();
  // mouse drag-to-scroll (touch keeps native swipe)
  let sx=0,sl=0,down=false,moved=false;
  const pd=(e:PointerEvent)=>{if(e.pointerType!=='mouse'||e.button!==0||(e.target as Element).closest('button,a,input,select,textarea'))return;down=true;moved=false;sx=e.clientX;sl=el.scrollLeft};
  const pm=(e:PointerEvent)=>{if(!down)return;const dx=e.clientX-sx;if(!moved&&Math.abs(dx)>6){moved=true;el.classList.add('drag')}if(moved)el.scrollLeft=sl-dx};
  const pu=()=>{if(!down)return;down=false;el.classList.remove('drag')};
  const ck=(e:Event)=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}};
  el.addEventListener('pointerdown',pd);addEventListener('pointermove',pm);addEventListener('pointerup',pu);el.addEventListener('click',ck,true);
  return()=>{el.removeEventListener('scroll',on);ro.disconnect();mo.disconnect();cancelAnimationFrame(raf);
   el.removeEventListener('pointerdown',pd);removeEventListener('pointermove',pm);removeEventListener('pointerup',pu);el.removeEventListener('click',ck,true)}},[]);
 const go=(d:number)=>tr.current?.scrollBy({left:d*tr.current.clientWidth*.8,behavior:'smooth'});
 return <section id={id} className={base+' '+cls}>
  <div className="tx-rhead"><h2 className="tx-rv">{title}</h2>
   <div className="tx-arrows"><button aria-label="Scroll left" disabled={end[0]} onClick={()=>go(-1)}><Arr flip/></button>
    <button aria-label="Scroll right" disabled={end[1]} onClick={()=>go(1)}><Arr/></button></div></div>
  <div ref={tr} className="tx-track tx-stg tx-drag" tabIndex={0} role="region" aria-label={title}>{children}</div>
  <div className="tx-rprog" aria-hidden><i ref={thumb}/></div></section>;}