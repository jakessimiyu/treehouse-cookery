'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
export type Item={id:string;name:string;desc:string;price:number;cat:string;emoji:string;tags?:string[];ing?:string[];soldOut:boolean};
export const kes=(n:number)=>'KSh '+n.toLocaleString();
type Qty=Record<string,number>;
type Ctx={menu:Item[];loaded:boolean;cart:Qty;sauces:Record<string,string>;lines:Item[];gone:Item[];total:number;count:number;usual:Qty;
 open:boolean;setOpen:(b:boolean)=>void;bump:number;busy:boolean;add:(id:string,sauce?:string)=>void;dec:(id:string)=>void;setAll:(c:Qty)=>void;
 checkout:(o:{phone:string;pickup:string;notes:string},onSent?:()=>void)=>Promise<string|null>};
const C=createContext<Ctx|null>(null);
export const useCart=()=>{const c=useContext(C);if(!c)throw new Error('CartProvider missing');return c};

export function CartProvider({children,initialMenu=[]}:{children:React.ReactNode;initialMenu?:Item[]}){
 const r=useRouter();
 const [menu,setMenu]=useState<Item[]>(initialMenu);const [loaded,setLoaded]=useState(initialMenu.length>0);
 const [cart,setCart]=useState<Qty>({});const [sauces,setSauces]=useState<Record<string,string>>({});
 const [open,setOpen]=useState(false);const [bump,setBump]=useState(0);const [busy,setBusy]=useState(false);
 const [last,setLast]=useState<Qty>({});const [ready,setReady]=useState(false);

 useEffect(()=>{const f=()=>{if(document.hidden)return;
   fetch('/api/menu').then(x=>x.json()).then((m:Item[])=>{if(Array.isArray(m)){setMenu(p=>JSON.stringify(p)===JSON.stringify(m)?p:m);setLoaded(true)}}).catch(()=>{})};
  f();const t=setInterval(f,30000);document.addEventListener('visibilitychange',f);
  return()=>{clearInterval(t);document.removeEventListener('visibilitychange',f)}},[]); // sold-out syncs within 30s
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('cart')||'null');if(s){setCart(s.cart||{});setSauces(s.sauces||{})}
  setLast(JSON.parse(localStorage.getItem('last')||'{}'))}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('cart',JSON.stringify({cart,sauces}))}catch{}},[cart,sauces,ready]);

 const add=(id:string,sauce?:string)=>{setCart(c=>({...c,[id]:(c[id]||0)+1}));if(sauce)setSauces(s=>({...s,[id]:sauce}));setBump(b=>b+1);navigator.vibrate?.(12)};
 const dec=(id:string)=>setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)-1)}));
 const lines=menu.filter(m=>cart[m.id]>0&&!m.soldOut);
 const gone=menu.filter(m=>cart[m.id]>0&&m.soldOut);
 const total=lines.reduce((a,m)=>a+m.price*cart[m.id],0);const count=lines.reduce((a,m)=>a+cart[m.id],0);
 const usual:Qty=Object.fromEntries(Object.entries(last).filter(([id,n])=>n>0&&menu.some(m=>m.id===id&&!m.soldOut)));

 async function checkout({phone,pickup,notes}:{phone:string;pickup:string;notes:string},onSent?:()=>void){
  setBusy(true);
  try{
   const sig=JSON.stringify(lines.map(m=>[m.id,cart[m.id]]))+phone; // new cart => new idempotency key
   let key=sessionStorage.getItem('ck');if(!key||sessionStorage.getItem('cksig')!==sig){key=crypto.randomUUID();sessionStorage.setItem('ck',key);sessionStorage.setItem('cksig',sig)}
   const sn=lines.filter(m=>sauces[m.id]).map(m=>`${m.name}: ${sauces[m.id]}`).join('; ');
   const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({key,phone,pickup,notes:[sn,notes].filter(Boolean).join(' | '),items:lines.map(m=>({id:m.id,qty:cart[m.id]}))})});
   const j=await res.json();if(!res.ok)return j.error||'Something went wrong. Try again.';
   onSent?.();await new Promise(x=>setTimeout(x,onSent?3000:0)); // lets the order page finish its animation
   sessionStorage.removeItem('ck');sessionStorage.removeItem('cksig');
   try{localStorage.setItem('last',JSON.stringify(cart));localStorage.setItem('phone',phone)}catch{}
   setLast(cart);setCart({});setSauces({});setOpen(false);r.push('/track/'+j.no);return null;
  }catch{return 'No connection. Check your internet and try again.'}finally{setBusy(false)}}

 return <C.Provider value={{menu,loaded,cart,sauces,lines,gone,total,count,usual,open,setOpen,bump,busy,add,dec,setAll:setCart,checkout}}>{children}</C.Provider>;}