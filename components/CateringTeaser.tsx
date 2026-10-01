import Link from 'next/link';import {BRAND} from './config';
import {Pic} from '@/components/Dish';
const L=['Corporate lunch boxes','Meetings and conferences','Parties and private events'];
export default function CateringTeaser(){
 const wa=`https://wa.me/${BRAND.wa}?text=${encodeURIComponent('Hi, I would like a catering quote for ')}`;
 return <section id="catering" className="tx-ct"><div className="ct-card tx-rv">
  <div className="ct-img"><Pic id="hero" alt="" emoji="🍗"/></div>
  <div className="ct-body">
   <p className="ct-eye"><i aria-hidden/>Catering</p>
   <h2>Feeding a crowd?<br/>We bring the <em>feast.</em></h2>
   <p className="ct-p">Team lunches, meetings, conferences and private events. Hot, on time and priced per head.</p>
   <ul className="ct-chips">{L.map(t=><li key={t}>{t}</li>)}</ul>
   <div className="ct-btns"><Link className="btn" data-mag href="/catering">Request a quote</Link>
    <Link className="btn tx-ghost" data-mag href="/catering">See packages</Link>
    <a className="ct-wa" href={wa} target="_blank" rel="noreferrer noopener">or WhatsApp us <span aria-hidden>↗</span></a></div>
  </div></div></section>;}