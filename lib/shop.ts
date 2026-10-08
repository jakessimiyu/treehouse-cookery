import {q} from './db';
import {shopText,cleanHours,DEFAULT_HOURS} from './hours';
import type {Mode,Hours} from './hours';
export type {Mode,Hours};

export type Shop={mode:Mode;note:string;hours:Hours;custom:boolean;updatedAt:number};
export const DEFAULT_SHOP:Shop={mode:'auto',note:'',hours:DEFAULT_HOURS,custom:false,updatedAt:0};

export async function getShop():Promise<Shop>{
 const r=await q<{key:string;value:unknown;updated_at:Date}>(`select key,value,updated_at from settings where key in ('shop','hours')`);
 const shopRow=r.find(x=>x.key==='shop'),hoursRow=r.find(x=>x.key==='hours');
 const v=(shopRow?.value||{}) as {mode?:string;note?:string};
 const mode:Mode=v.mode==='open'||v.mode==='closed'?v.mode:'auto';
 const custom=cleanHours(hoursRow?.value);
 return{mode,note:String(v.note||'').slice(0,60),hours:custom||DEFAULT_HOURS,custom:!!custom,
  updatedAt:Math.max(shopRow?shopRow.updated_at.getTime():0,hoursRow?hoursRow.updated_at.getTime():0)};
}

export async function setShop(mode:Mode,note:string){
 await q(
  `insert into settings(key,value,updated_at) values('shop',$1::jsonb,now())
   on conflict(key) do update set value=excluded.value,updated_at=now()`,
  [JSON.stringify({mode,note:note.slice(0,60)})]);
}

// null = go back to the default hours from components/config
export async function setHours(h:Hours|null){
 if(h===null){await q(`delete from settings where key='hours'`);return}
 await q(
  `insert into settings(key,value,updated_at) values('hours',$1::jsonb,now())
   on conflict(key) do update set value=excluded.value,updated_at=now()`,
  [JSON.stringify(h)]);
}

// what the website and kitchen show
export function shopState(s:Shop){
 const t=shopText(s.mode,s.note,s.hours);
 return{open:t.open,mode:s.mode,note:s.note,text:t.text,hours:s.hours,custom:s.custom};
}