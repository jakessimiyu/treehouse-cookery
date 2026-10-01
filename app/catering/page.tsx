import Link from 'next/link';
import {BRAND} from '@/components/config';
import {Pic} from '@/components/Dish';
import Reveal from '@/components/Reveal';
import OccasionExplorer from '@/components/OccasionExplorer';
import CateringPackages from '@/components/CateringPackages';
import CateringQuote from '@/components/CateringQuote';
import {OCCASIONS,INCLUDED,FAQS,MIN_GUESTS,MAX_GUESTS} from '@/lib/catering';
export const metadata={title:'Catering | Treehouse',description:'Lunch boxes, party platters and full spreads for offices, events and celebrations. Request a quote.'};

const Head=({eyebrow,title,lead}:{eyebrow:string;title:string;lead?:string})=>
 <div className="ct-h tx-rv"><small>{eyebrow}</small><h2>{title}</h2>{lead&&<p>{lead}</p>}</div>;

export default function CateringPage(){
 const wa=`https://wa.me/${BRAND.wa}`;
 return <>
 <Reveal/>
 <header className="ct-hero"><div className="ct-hero-in">
  <div className="ct-hero-t">
   <small>Catering</small>
   <h1>Feeding a crowd? <em>We show up.</em></h1>
   <p>Office lunches, events and celebrations. Hot food, on time, priced per person.</p>
   <div className="ct-cta"><a className="btn" href="#quote">Request a quote</a>
    <a className="btn ct-ghost" href={wa} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>
  </div>
  <div className="ct-hero-i"><Pic id="catering" alt="Treehouse catering spread" emoji="🍱" eager sizes="(min-width:900px) 40vw, 100vw"/>
   <div className="ct-badge"><b>Written quote</b><span>Usually within one working day</span></div></div>
 </div></header>

 <ul className="ct-facts">
  <li><b>{MIN_GUESTS} to {MAX_GUESTS}</b><span>guests</span></li>
  <li><b>Delivery</b><span>and setup</span></li>
  <li><b>Halal</b><span>and vegetarian</span></li>
  <li><b>1 day</b><span>quote time</span></li>
 </ul>

 <section className="ct-sec">
  <Head eyebrow="What we cater" title="Events we cook for" lead="Pick one to see what we bring."/>
  <OccasionExplorer/>
 </section>

 <section className="ct-sec ct-grey">
  <Head eyebrow="Packages" title="Three ways to feed a crowd" lead="Built from dishes on our menu. Pick a starting point and we'll tailor it to your guests."/>
  <CateringPackages/>
 </section>


 <section className="ct-sec">
  <Head eyebrow="What's included" title="You host, we handle the rest"/>
  <ul className="ct-inc">{INCLUDED.map(([t,d])=><li key={t} className="tx-rv"><h3>{t}</h3><p>{d}</p></li>)}</ul>
 </section>

 <section className="ct-form">
  <div className="ct-formh"><Head eyebrow="Request a quote" title="Tell us about your event" lead="Three short steps. You'll get a written quote, usually within one working day."/></div>
  <CateringQuote/>
 </section>

 <section className="ct-sec">
  <Head eyebrow="Good to know" title="Questions we get asked"/>
  <div className="ct-faq">{FAQS.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
 </section>

 <section className="ct-band"><div><h3>Prefer to talk it through?</h3><p>Message us or call {BRAND.phone} and we&apos;ll plan it together.</p></div>
  <div className="ct-cta"><a className="btn" href={wa} target="_blank" rel="noreferrer">WhatsApp us</a>
   <Link className="btn ct-ghost" href="/reserve">Book a table instead</Link></div></section>
 </>;}