'use client';
import {useEffect,useState} from 'react';

type S={open:boolean;mode:string;text:string};

// variant "pill" = outlined badge (hero), "text" = plain line (footer)
export default function ShopStatus({variant='pill',className}:{variant?:'pill'|'text';className?:string}){
 const [s,setS]=useState<S|null>(null);

 useEffect(()=>{
  let dead=false;
  const load=()=>{
   if(document.hidden)return;
   fetch('/api/shop',{cache:'no-store'}).then(r=>r.json())
    .then(j=>{if(!dead&&typeof j?.open==='boolean')setS(j)}).catch(()=>{});
  };
  load();
  const t=setInterval(load,30000);
  document.addEventListener('visibilitychange',load);
  return()=>{dead=true;clearInterval(t);document.removeEventListener('visibilitychange',load)};
 },[]);

 if(!s)return <span aria-hidden style={{display:'inline-block',height:variant==='pill'?38:20}}/>;

 const dot:React.CSSProperties={width:10,height:10,borderRadius:'50%',flex:'none',
  background:s.open?'#22c55e':'#9ca3af',boxShadow:s.open?'0 0 0 4px rgba(34,197,94,.22)':'none'};
 const base:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:10,
  fontFamily:'var(--label),system-ui,sans-serif',fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',whiteSpace:'nowrap'};
 const style:React.CSSProperties=variant==='pill'
  ?{...base,fontSize:13,padding:'9px 18px',borderRadius:999,border:'1px solid rgba(255,255,255,.35)'}
  :{...base,fontSize:13};

 return <span className={className} style={style} role="status" aria-live="polite"><i style={dot}/>{s.text}</span>;
}