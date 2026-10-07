import Link from 'next/link';
import OccasionExplorer from '@/components/OccasionExplorer';
import CateringPackages from '@/components/CateringPackages';
import CateringQuote from '@/components/CateringQuote';
import {FAQS,INCLUDED,MAX_GUESTS,MIN_GUESTS,WA_NUMBER} from '@/lib/catering';

export const metadata={
 title:'Catering — Treehouse',
 description:'Office lunch boxes, party platters and full hot buffets, delivered across Nairobi. Weddings, corporate days, birthdays and bulk orders. Request a quote.',
};

// EDIT: wording for the four steps. Keep it in line with how you actually work.
const STEPS:[string,string][]=[
 ['Tell us the number and the time','Date, guest count and the kind of food you have in mind. It takes about two minutes.'],
 ['Get a written quote','We reply with a tailored menu and one clear price, usually within one working day.'],
 ['Secure your date','Accept the quote and pay a deposit by M-Pesa. The balance is due on or before the event.'],
 ['We deliver and set up','Hot food arrives on time, the serving area is set up, and we clear down if your package includes it.'],
];

export default function CateringPage(){
 const wa=`https://wa.me/${WA_NUMBER}`;
 return <>
  <div className="ct-hero">
   <div className="ct-hero-in solo">
    <div className="ct-hero-t">
     <small>Treehouse catering</small>
     <h1>Feed the whole room,<em>hot and on time.</em></h1>
     <p>Office lunch boxes, party platters and full hot buffets across Nairobi. One written quote and one coordinator from first message to last plate.</p>
     <div className="ct-cta">
      <a href="#quote" className="btn">Request a quote</a>
      <a href={wa} target="_blank" rel="noopener" className="btn ct-ghost">Chat on WhatsApp</a>
     </div>
    </div>
   </div>
  </div>

  <ul className="ct-facts">
   <li><b>{MIN_GUESTS} to {MAX_GUESTS}</b><span>guests</span></li>
   <li><b>2 days</b><span>minimum notice</span></li>
   <li><b>M-Pesa</b><span>deposit to book</span></li>
   <li><b>Dietary needs</b><span>planned in advance</span></li>
  </ul>

  <div className="ct-sec">
   <div className="ct-h">
    <small>What we cater</small>
    <h2>Events we cater for</h2>
    <p>Pick yours and we will point you to the right package.</p>
   </div>
   <OccasionExplorer/>
  </div>

  <div className="ct-sec ct-grey">
   <div className="ct-h">
    <small>Packages</small>
    <h2>Three ways to feed a crowd</h2>
    <p>Every package is built from dishes on our menu. Pick a starting point and we will tailor it to your guests.</p>
   </div>
   <CateringPackages/>
  </div>

  <div className="ct-sec ct-dark">
   <div className="ct-h">
    <small>How it works</small>
    <h2>From first message to last plate</h2>
   </div>
   <ol className="ct-steps">
    {STEPS.map(([t,d],i)=><li key={t}><span>{String(i+1).padStart(2,'0')}</span><h3>{t}</h3><p>{d}</p></li>)}
   </ol>
  </div>

  <div className="ct-sec">
   <div className="ct-h">
    <small>What is included</small>
    <h2>You host, we handle the rest</h2>
   </div>
   <ul className="ct-inc">
    {INCLUDED.map(([t,d])=><li key={t}><h3>{t}</h3><p>{d}</p></li>)}
   </ul>
  </div>

  <div className="ct-form" id="quote">
   <div className="ct-formh">
    <div className="ct-h">
     <small>Request a quote</small>
     <h2>Tell us about your event</h2>
     <p>Three short steps. You will get a written quote, usually within one working day.</p>
    </div>
   </div>
   <CateringQuote/>
  </div>

  <div className="ct-sec">
   <div className="ct-h">
    <small>Good to know</small>
    <h2>Questions we get asked</h2>
   </div>
   <div className="ct-faq">
    {FAQS.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}
   </div>
  </div>

  <div className="ct-band">
   <div>
    <h3>Prefer to talk it through?</h3>
    <p>Message us on WhatsApp and we will plan it together.</p>
   </div>
   <div className="cq-bands">
    <a href={wa} target="_blank" rel="noopener" className="btn">WhatsApp us</a>
    <Link href="/menu" className="btn ct-ghost">See the menu</Link>
   </div>
  </div>
 </>;
}