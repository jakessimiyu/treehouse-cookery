'use client';
import {PACKAGES,kes} from '@/lib/catering';

export default function CateringPackages(){
 const choose=(id:string)=>{
  window.dispatchEvent(new CustomEvent('catering:select-package',{detail:id}));
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('quote')?.scrollIntoView({behavior:still?'auto':'smooth',block:'start'});
 };

 return <div className="ct-pk">
  {PACKAGES.map(p=><article key={p.id} className={'ct-pkc'+(p.feat?' f':'')}>
   {p.feat&&<span className="ct-flag">Most popular</span>}
   <h3>{p.name}</h3>
   <p className="ct-tag">{p.tagline}</p>
   <div className="ct-price"><b>{kes(p.per)}</b><small>per person</small></div>
   <ul>{p.inc.map(x=><li key={x}>{x}</li>)}</ul>
   <button type="button" className="ct-pick" onClick={()=>choose(p.id)}>Choose {p.name}</button>
  </article>)}
 </div>;
}