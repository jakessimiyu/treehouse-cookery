'use client';
import {useEffect,useState} from 'react';import {BRAND} from './config';
export default function OpenNow(){
 const [o,setO]=useState<boolean|null>(null);
 useEffect(()=>{const h=Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hour12:false,timeZone:'Africa/Nairobi'}).format(new Date()));
  setO(h>=BRAND.open&&h<BRAND.close)},[]);
 if(o===null)return null;
 return <p className={'tx-open'+(o?' on':'')}><i/>{o?`Open now · until ${BRAND.close-12}pm`:`Closed · opens ${BRAND.open}am`}</p>;}