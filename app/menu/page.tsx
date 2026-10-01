'use client';
import {useEffect,useRef,useState} from 'react';
import {useCart,Item} from '@/lib/Cart';
import MenuRow from '@/components/MenuRow';
import MoodPicker from '@/components/MoodPicker';
import CateringTeaser from '@/components/CateringTeaser';
import Reveal from '@/components/Reveal';
const CATS=['Chicken','Chips','Shawarma','Burgers','Biryani','Snacks','Drinks','Combos'];
const LINE:Record<string,string>={Chicken:'Crunch you can hear.',Chips:'Not a side. A main character.',Shawarma:'Wrapped tight, loaded properly.',Burgers:'Stacked, smashed, unapologetic.',Biryani:'Slow-cooked. Fragrant. Loaded.',Snacks:'Small bites, big cravings.',Drinks:'Cold, thick, fizzy.',Combos:'Solo, couples, squads, teams.'};
const slug=(c:string)=>'c-'+c.toLowerCase();
const Mag=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function MenuPage(){
 const {menu,loaded,usual,count,setAll,setOpen}=useCart();
 const [q,setQ]=useState('');const [fs,setFs]=useState<string[]>([]);const [sort,setSort]=useState('menu');
 const [active,setActive]=useState(CATS[0]);const [sOpen,setSOpen]=useState(false);
 const bar=useRef<HTMLDivElement>(null);const tabs=useRef<HTMLDivElement>(null);const inp=useRef<HTMLInputElement>(null);const lock=useRef(0);
 const needle=q.trim().toLowerCase();
 const flat=!!needle||fs.length>0||sort!=='menu';
 let items:Item[]=menu.filter(m=>(!needle||(m.name+' '+m.desc+' '+(m.ing||[]).join(' ')).toLowerCase().includes(needle))
  &&(!fs.length||fs.some(f=>(m.tags||[]).includes(f))));
 if(sort==='low')items=[...items].sort((a,b)=>a.price-b.price);if(sort==='high')items=[...items].sort((a,b)=>b.price-a.price);
 const cats=CATS.filter(c=>menu.some(m=>m.cat===c));
 const hasUsual=count===0&&Object.keys(usual).length>0;
 const usualText=menu.filter(m=>usual[m.id]).map(m=>`${usual[m.id]}× ${m.name}`).slice(0,3).join(', ');
 const clear=()=>{setQ('');setFs([]);setSort('menu');setSOpen(false)};
 const seeAll=(t:string)=>{setFs([t]);setSort('menu');setQ('');setSOpen(false); // from the mood picker
  setTimeout(()=>document.getElementById('mn-results')?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'}),80)};

 useEffect(()=>{ // measure sticky offsets so scrolling lands exactly under the nav + category bar
  const nav=document.querySelector('nav');
  const set=()=>{const r=document.documentElement.style;
   r.setProperty('--navh',(nav?.offsetHeight||64)+'px');r.setProperty('--barh',(bar.current?.offsetHeight||56)+'px')};
  set();const ro=new ResizeObserver(set);if(nav)ro.observe(nav);if(bar.current)ro.observe(bar.current);
  return()=>ro.disconnect()},[]);
 useEffect(()=>{ // scroll-spy: highlight the category in view
  if(!loaded||flat)return;
  const off=(document.querySelector('nav')?.offsetHeight||64)+(bar.current?.offsetHeight||56)+8;
  const io=new IntersectionObserver(es=>{if(Date.now()<lock.current)return;
   for(const e of es)if(e.isIntersecting)setActive((e.target as HTMLElement).dataset.cat||CATS[0])},{rootMargin:`-${off}px 0px -60% 0px`});
  document.querySelectorAll('.mn-sec').forEach(s=>io.observe(s));return()=>io.disconnect()},[loaded,flat]);
 useEffect(()=>{const t=tabs.current;const el=t?.querySelector<HTMLElement>('[aria-current="true"]'); // keep the active tab centred on phones
  if(t&&el)t.scrollTo({left:el.offsetLeft-t.clientWidth/2+el.clientWidth/2,behavior:'smooth'})},[active]);
 useEffect(()=>{if(sOpen)inp.current?.focus()},[sOpen]);

 const goto=(c:string)=>{setActive(c);lock.current=Date.now()+900;
  const go=()=>document.getElementById(slug(c))?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
  if(flat){clear();setTimeout(go,60)}else go()};

 return <>
 <Reveal/>
 <header className="mn-head"><div className="mn-wrap">
  <div><small>The menu</small>
   <h1>Made to order. <em>Ready when you are.</em></h1>
   <p>{loaded?`${menu.length} dishes`:'Our dishes'}, cooked fresh. Tap any dish to see what&apos;s inside, then add it in one tap.</p></div>
  <ul className="mn-facts"><li><b>Order ahead</b><span>From your phone</span></li><li><b>Pay with M-Pesa</b><span>One prompt, no cash</span></li><li><b>Skip the queue</b><span>Collect with your number</span></li></ul>
 </div></header>

 <MoodPicker menu={menu} onSeeAll={seeAll}/>

 <div className="mn-bar" ref={bar}><div className="mn-wrap mn-barin">
  <div className="mn-tabs" ref={tabs} role="group" aria-label="Menu categories">
   {cats.map(c=><button key={c} type="button" aria-current={!flat&&active===c?'true':undefined} onClick={()=>goto(c)}>{c}</button>)}</div>
  <button type="button" className="mn-sbtn" aria-label="Search the menu" aria-expanded={sOpen} onClick={()=>setSOpen(o=>!o)}><Mag/></button>
  <div className={'mn-search'+(sOpen||q?' open':'')}><Mag/>
   <input ref={inp} type="search" aria-label="Search the menu" placeholder="Search chicken, cheese, wrap…" value={q}
    onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){setQ('');setSOpen(false)}}}/></div>
 </div></div>

 <div className="mn-wrap mn-tools">
  <label className="mn-sort"><span className="sr">Sort dishes</span><select value={sort} onChange={e=>setSort(e.target.value)}>
   <option value="menu">Menu order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
 </div>

 {hasUsual&&<div className="mn-wrap"><button type="button" className="mn-usual" onClick={()=>{setAll(usual);setOpen(true)}}>↻ Order your usual again<small>{usualText}</small></button></div>}

 {!loaded&&<div className="mn-wrap mn-skel" aria-hidden><i/><i/><i/><i/><i/></div>}

 {loaded&&flat&&<>
  <div id="mn-results" className="mn-wrap mn-sum"><p aria-live="polite">{items.length} {items.length===1?'dish':'dishes'}{needle&&<> for “{q.trim()}”</>}{fs.length>0&&<span className="mn-cap"> · {fs.join(', ')}</span>}</p><button type="button" onClick={clear}>Clear all</button></div>
  <section className="mn-wrap mn-flat">{items.length?<ul className="mn-list">{items.map(it=><li key={it.id}><MenuRow it={it}/></li>)}</ul>
   :<div className="mn-none"><p>Nothing matches that.</p><button type="button" onClick={clear}>Clear filters</button></div>}</section></>}

 {loaded&&!flat&&cats.map((c,n)=>{const list=menu.filter(m=>m.cat===c);
  return <section key={c} id={slug(c)} data-cat={c} className="mn-sec"><div className="mn-wrap mn-secin">
   <div className="mn-sec-head"><small>{String(n+1).padStart(2,'0')}</small><h2>{c}</h2><p>{LINE[c]}</p></div>
   <ul className="mn-list">{list.map(it=><li key={it.id}><MenuRow it={it}/></li>)}</ul></div></section>})}

 <div className="mn-teaser"><CateringTeaser/></div>
 </>;}