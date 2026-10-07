'use client';
import {useEffect,useState} from 'react';
import {shopText} from '@/lib/hours';

type S={open:boolean;text:string};

// only used if the shop-status request fails: fall back to the normal opening hours
const local=():S=>shopText('auto','');

// Reads the open/closed state the kitchen controls. Used in the hero and the footer.
export default function OpenNow(){
 const [s,setS]=useState<S|null>(null);
 useEffect(()=>{
  let dead=false;
  const load=()=>{
   if(document.hidden)return;
   fetch('/api/shop',{cache:'no-store'}).then(r=>r.json())
    .then(j=>{if(!dead)setS(typeof j?.open==='boolean'&&typeof j?.text==='string'?j:local())})
    .catch(()=>{if(!dead)setS(p=>p??local())});
  };
  load();
  const t=setInterval(load,30000);
  document.addEventListener('visibilitychange',load);
  return()=>{dead=true;clearInterval(t);document.removeEventListener('visibilitychange',load)};
 },[]);
 if(s===null)return null;
 return <p className={'tx-open'+(s.open?' on':'')}><i/>{s.text}</p>;}