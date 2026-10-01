import Link from 'next/link';import {BRAND} from './config';
import OpenNow from './OpenNow';import TrackOrder from './TrackOrder';
const PAGES:[string,string][]=[['Menu','/menu'],['Order','/order'],['Reserve','/reserve'],['Catering','/catering'],['Our Story','/story'],['Visit','/visit']];
export default function Footer(){
 const wa=`https://wa.me/${BRAND.wa}`;
 return <footer className="fx">
  <TrackOrder/>
  <div className="fx-top">
   <div className="fx-brand"><Link href="/" className="fx-logo">Treehouse<i>.</i></Link>
    <p>Crispy, loaded and ready when you arrive. Order ahead, pay with M-Pesa and walk past the queue.</p>
    <OpenNow/></div>
   <div className="fx-col" role="navigation" aria-label="Footer"><h3>Explore</h3>
    <ul>{PAGES.map(([t,h])=><li key={h}><Link href={h}>{t}</Link></li>)}</ul></div>
   <div className="fx-col" id="visit"><h3>Visit us</h3>
    <address>{BRAND.address}</address>
    <p>{BRAND.hoursText}</p>
    <a className="fx-map" href={BRAND.maps} target="_blank" rel="noreferrer noopener" aria-label="Get directions on the map">
     <svg viewBox="0 0 24 24" width="28" height="28" fill="var(--red)" aria-hidden><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
     <span>Get directions ↗</span></a></div>
   <div className="fx-col"><h3>Get in touch</h3>
    <p><a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a></p>
    <p><a href={wa} target="_blank" rel="noreferrer noopener">WhatsApp us ↗</a></p>
    <p>Pay securely with M-Pesa</p></div>
  </div>
  <div className="fx-bot"><span>© {new Date().getFullYear()} Treehouse. All rights reserved.</span>
   <a href="#main">Back to top ↑</a></div>
 </footer>;}