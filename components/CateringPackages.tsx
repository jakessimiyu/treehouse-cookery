'use client';
import {PACKAGES,kes} from '@/lib/catering';
export default function CateringPackages(){
 const choose=(id:string)=>{window.dispatchEvent(new CustomEvent('catering:select-package',{detail:id}));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('quote')?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})};
 return <div className="ct-pk">{PACKAGES.map(p=><article key={p.id} className={'ct-pkc tx-rv'+(p.feat?' f':'')}>
  {p.feat&&<span className="ct-flag">Most requested</span>}
  <h3>{p.name}</h3><p className="ct-tag">{p.tagline}</p>
  <p className="ct-price"><small>from</small><b>{kes(p.per)}</b><small>per person</small></p>
  <ul>{p.inc.map(i=><li key={i}>{i}</li>)}</ul>
  <button type="button" className="ct-pick" onClick={()=>choose(p.id)}>Request this package</button></article>)}</div>;}