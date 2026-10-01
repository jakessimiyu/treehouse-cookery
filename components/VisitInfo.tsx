'use client';
import {useEffect,useState} from 'react';
import {BRAND,HOURS} from './config';
import {nowMin} from '@/lib/dates';
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const hr=(h:number)=>`${Math.floor(h)%12||12}${h%1?':30':''}${h<12||h>=24?'am':'pm'}`;

export default function VisitInfo(){
 const [day,setDay]=useState(-1);const [min,setMin]=useState(0);const [copied,setCopied]=useState(false);
 useEffect(()=>{const tick=()=>{setDay(DAYS.indexOf(new Intl.DateTimeFormat('en-GB',{weekday:'long',timeZone:'Africa/Nairobi'}).format(new Date())));setMin(nowMin())};
  tick();const id=setInterval(tick,60000);return()=>clearInterval(id)},[]);
 let status='';let open=false;
 if(day>=0){const t=HOURS[day];
  if(t&&min>=t[0]*60&&min<t[1]*60){open=true;status=`Open now · closes ${hr(t[1])}`}
  else if(t&&min<t[0]*60)status=`Closed · opens today at ${hr(t[0])}`;
  else{for(let i=1;i<=7;i++){const n=HOURS[(day+i)%7];if(n){status=`Closed · opens ${i===1?'tomorrow':DAYS[(day+i)%7]} at ${hr(n[0])}`;break}}}}
 async function copy(){try{await navigator.clipboard.writeText(BRAND.address);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{}}
 return <div className="vs-info">
  {status&&<p className={'tx-open vs-open'+(open?' on':'')} role="status"><i/>{status}</p>}
  <h2>Find us</h2>
  <address>{BRAND.address}</address>
  <div className="vs-btns">
   <a className="btn" href={BRAND.maps} target="_blank" rel="noreferrer">Open in Google Maps</a>
   <a className="btn tx-ghost dk" href={`https://waze.com/ul?q=${encodeURIComponent(BRAND.mapQuery)}&navigate=yes`} target="_blank" rel="noreferrer">Waze</a>
   <button className="btn tx-ghost dk" onClick={copy}>{copied?'Copied ✓':'Copy address'}</button>
  </div>
  <h2>Opening hours</h2>
  <table className="vs-hours"><tbody>{DAYS.map((d,i)=>{const t=HOURS[i];
   return <tr key={d} className={i===day?'today':''} aria-current={i===day?'date':undefined}><th scope="row">{d}</th><td>{t?`${hr(t[0])} to ${hr(t[1])}`:'Closed'}</td></tr>})}</tbody></table>
  <h2>Get in touch</h2>
  <p className="vs-contact"><a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a><br/>
   <a href={`https://wa.me/${BRAND.wa}`} target="_blank" rel="noreferrer">WhatsApp us</a><br/>
   <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></p>
 </div>;}