import Link from 'next/link';
import {BRAND,HOURS,GOOD_TO_KNOW} from '@/components/config';
import VisitInfo from '@/components/VisitInfo';
export const metadata={title:'Visit | Treehouse',description:'Address, opening hours, directions and how to get to Treehouse.'};
export default function VisitPage(){
 const ld={'@context':'https://schema.org','@type':'Restaurant',name:BRAND.name,address:BRAND.address,telephone:BRAND.phone,
  openingHoursSpecification:HOURS.flatMap((t,i)=>t?[{'@type':'OpeningHoursSpecification',dayOfWeek:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i],opens:`${String(t[0]).padStart(2,'0')}:00`,closes:`${String(t[1]).padStart(2,'0')}:00`}]:[])};
 return <>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
 <header className="tx-mhead"><h1>Come <em>hungry</em></h1><p>Everything you need to find us, and what to expect when you arrive.</p></header>

 <main className="vs-main">
  <VisitInfo/>
  <div className="vs-map"><iframe title={`Map showing ${BRAND.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
   src={`https://www.google.com/maps?q=${encodeURIComponent(BRAND.mapQuery)}&output=embed`}/></div>
 </main>

 <section className="vs-ways">
  <div><h3>Dine in</h3><p>Walk in, or <Link href="/reserve">reserve a table</Link> for groups and busy evenings.</p></div>
  <div><h3>Order ahead</h3><p><Link href="/order">Order online</Link>, pay with M-Pesa and collect with your order number. No queue.</p></div>
  <div><h3>Events and offices</h3><p>Planning for a crowd? See <Link href="/catering">catering</Link> and get a written quote.</p></div>
 </section>

 <section className="cq-sec gr"><h2>Good to know</h2>
  <div className="cq-faq">{GOOD_TO_KNOW.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

 <section className="cq-band"><div><h3>Not sure where to start?</h3><p>Call {BRAND.phone} and we&apos;ll point you the right way.</p></div>
  <div className="cq-bands"><a className="btn" href={`tel:${BRAND.phone}`}>Call us</a><Link className="btn tx-ghost" href="/menu">See the menu</Link></div></section>
 </>;}