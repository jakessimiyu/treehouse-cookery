import {q} from './db';
import {shopText} from './hours';
import type {Mode} from './hours';
export type {Mode};

export type Shop={mode:Mode;note:string;updatedAt:number};
export const DEFAULT_SHOP:Shop={mode:'auto',note:'',updatedAt:0};

// create the settings table the first time it is needed
let ensured:Promise<unknown>|null=null;
const ensure=()=>ensured??(ensured=q(
 `create table if not exists settings(key text primary key,value jsonb not null,updated_at timestamptz not null default now())`
).catch(e=>{ensured=null;throw e}));

export async function getShop():Promise<Shop>{
 await ensure();
 const r=await q<{value:{mode?:string;note?:string};updated_at:Date}>(`select value,updated_at from settings where key='shop'`);
 const v=r[0]?.value||{};
 const mode:Mode=v.mode==='open'||v.mode==='closed'?v.mode:'auto';
 return{mode,note:String(v.note||'').slice(0,60),updatedAt:r[0]?r[0].updated_at.getTime():0};
}

export async function setShop(mode:Mode,note:string){
 await ensure();
 await q(
  `insert into settings(key,value,updated_at) values('shop',$1::jsonb,now())
   on conflict(key) do update set value=excluded.value,updated_at=now()`,
  [JSON.stringify({mode,note:note.slice(0,60)})]);
}

// what the website and kitchen show
export function shopState(s:Shop){
 const t=shopText(s.mode,s.note);
 return{open:t.open,mode:s.mode,note:s.note,text:t.text};
}