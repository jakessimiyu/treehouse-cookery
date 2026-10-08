import {q} from './db';
import {s} from './store';
import type {Item} from './store';

// the sold-out list lives in the database so it survives restarts and is shared by every screen
// (the sold_out table is created by db/schema.sql, not at request time)

// midnight tonight in Nairobi (UTC+3, no daylight saving)
export function endOfToday(){
 const EAT=3*3600000,DAY=86400000;
 return new Date(Math.floor((Date.now()+EAT)/DAY)*DAY-EAT+DAY);
}

export async function soldOutIds():Promise<Set<string>>{
 const r=await q<{item_id:string}>(`select item_id from sold_out where expires_at>now()`);
 return new Set(r.map(x=>x.item_id));
}

export async function setSoldOut(id:string,sold:boolean){
 if(sold)await q(
  `insert into sold_out(item_id,expires_at) values($1,$2)
   on conflict(item_id) do update set set_at=now(),expires_at=excluded.expires_at`,[id,endOfToday()]);
 else await q(`delete from sold_out where item_id=$1`,[id]);
}

export async function clearSoldOut(){
 await q(`delete from sold_out`);
}

// the full menu with today's availability applied
export async function menuNow():Promise<Item[]>{
 const set=await soldOutIds();
 return s.menu.map(m=>({...m,soldOut:set.has(m.id)}));
}