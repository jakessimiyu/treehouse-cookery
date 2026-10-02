import type {PoolClient} from 'pg';
import {q,tx} from './db';

export type Status='PENDING_PAYMENT'|'PAID'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED'|'PAYMENT_FAILED';
export type Line={id:string;name:string;qty:number;price:number};
export type Order={no:number;status:Status;items:Line[];total:number;notes:string;pickup:string;receipt?:string;version:number;
 createdAt:number;payStart:number;paidAt?:number;acceptedAt?:number;preparingAt?:number;readyAt?:number;completedAt?:number};
type Row={no:number;items:Line[];total:number;notes:string;pickup:string;status:Status;receipt:string|null;version:number;
 created_at:Date;pay_start:Date;paid_at:Date|null;accepted_at:Date|null;preparing_at:Date|null;ready_at:Date|null;completed_at:Date|null};
type By={no?:number;checkoutId?:string};

const ms=(d:Date|null)=>d?d.getTime():undefined;
export const toOrder=(r:Row):Order=>({no:r.no,status:r.status,items:r.items,total:r.total,notes:r.notes,pickup:r.pickup,
 receipt:r.receipt??undefined,version:r.version,createdAt:r.created_at.getTime(),payStart:r.pay_start.getTime(),
 paidAt:ms(r.paid_at),acceptedAt:ms(r.accepted_at),preparingAt:ms(r.preparing_at),readyAt:ms(r.ready_at),completedAt:ms(r.completed_at)});

const find=async(c:PoolClient,by:By)=>(await c.query<Row>(
 `select * from orders where ($1::int is not null and no=$1)
   or ($2::text is not null and no=(select order_no from checkouts where checkout_id=$2))
  limit 1 for update`,[by.no??null,by.checkoutId??null])).rows[0];
const log=(c:PoolClient,no:number,from:string|null,to:string,actor:string)=>
 c.query('insert into order_events(order_no,from_status,to_status,actor) values($1,$2,$3,$4)',[no,from,to,actor]);

/* ---------- customer side ---------- */

// Idempotent: the same key always returns the same order, never a duplicate.
export async function createOrder(i:{key:string;phone:string;items:Line[];total:number;notes:string;pickup:string}){
 return tx(async c=>{
  const ins=await c.query<Row>(
   `insert into orders(idem_key,phone,items,total,notes,pickup) values($1,$2,$3::jsonb,$4,$5,$6)
    on conflict(idem_key) do nothing returning *`,[i.key,i.phone,JSON.stringify(i.items),i.total,i.notes,i.pickup]);
  if(ins.rows[0]){await log(c,ins.rows[0].no,null,'PENDING_PAYMENT','customer');return{order:toOrder(ins.rows[0]),created:true}}
  const ex=await c.query<Row>('select * from orders where idem_key=$1',[i.key]);
  return{order:toOrder(ex.rows[0]),created:false};
 });
}

// Remember every payment prompt sent for an order, so a late callback from an older prompt still finds it.
export const setCheckout=(no:number,checkoutId:string)=>
 q('insert into checkouts(checkout_id,order_no) values($1,$2) on conflict do nothing',[checkoutId,no]);

export async function getOrder(no:number){
 const r=await q<Row>('select * from orders where no=$1',[no]);return r[0]?toOrder(r[0]):null;
}
export async function getOrderByCheckout(checkoutId:string){
 const r=await q<Row>('select o.* from orders o join checkouts c on c.order_no=o.no where c.checkout_id=$1',[checkoutId]);
 return r[0]?toOrder(r[0]):null;
}
export async function getPhone(no:number){
 const r=await q<{phone:string}>('select phone from orders where no=$1',[no]);return r[0]?.phone;
}

// What the customer's tracking page receives (no phone number, no receipt).
export async function publicOrder(o:Order){
 let ahead=0;
 if(o.paidAt&&(o.status==='PAID'||o.status==='PREPARING')){
  const r=await q<{n:number}>(`select count(*)::int as n from orders where status in ('PAID','PREPARING') and paid_at<$1`,[new Date(o.paidAt)]);
  ahead=r[0].n;
 }
 return{no:o.no,status:o.status,items:o.items,total:o.total,createdAt:o.createdAt,paidAt:o.paidAt,payStart:o.payStart,pickup:o.pickup,ahead};
}

/* ---------- payment side (the only code that can mark an order paid) ---------- */

type PayResult={found:boolean;duplicate?:boolean;order?:Order};
export async function markPaid(by:By,receipt:string,raw?:unknown):Promise<PayResult>{
 try{
  return await tx(async c=>{
   const cur=await find(c,by);
   if(!cur){ // money arrived for an order we cannot find: keep the evidence instead of dropping it
    await c.query('insert into payment_orphans(checkout_id,receipt,raw) values($1,$2,$3::jsonb)',[by.checkoutId??null,receipt,JSON.stringify(raw??null)]);
    return{found:false};
   }
   // Money is real, so a late payment also revives an expired or cancelled order. It re-enters the kitchen as a fresh, unaccepted order.
   if(!['PENDING_PAYMENT','PAYMENT_FAILED','CANCELLED'].includes(cur.status))return{found:true,duplicate:true,order:toOrder(cur)};
   const u=await c.query<Row>(
    `update orders set status='PAID',paid_at=now(),accepted_at=null,preparing_at=null,ready_at=null,completed_at=null,receipt=$2,version=version+1
     where no=$1 returning *`,[cur.no,receipt]);
   await log(c,cur.no,cur.status,'PAID','payment');
   return{found:true,duplicate:false,order:toOrder(u.rows[0])};
  });
 }catch(e){
  if((e as {code?:string}).code==='23505')return{found:true,duplicate:true}; // same receipt delivered twice
  throw e;
 }
}

export async function failPayment(by:By){
 return tx(async c=>{
  const cur=await find(c,by);if(!cur||cur.status!=='PENDING_PAYMENT')return null;
  const u=await c.query<Row>(`update orders set status='PAYMENT_FAILED',version=version+1 where no=$1 returning *`,[cur.no]);
  await log(c,cur.no,cur.status,'PAYMENT_FAILED','payment');return toOrder(u.rows[0]);
 });
}

export async function retryPayment(no:number){
 return tx(async c=>{
  const cur=await find(c,{no});if(!cur||cur.status!=='PAYMENT_FAILED')return null;
  const u=await c.query<Row>(`update orders set status='PENDING_PAYMENT',pay_start=now(),version=version+1 where no=$1 returning *`,[no]);
  await log(c,no,cur.status,'PENDING_PAYMENT','customer');return toOrder(u.rows[0]);
 });
}

/* ---------- kitchen side ---------- */

// target status -> which statuses it may come from. Forward moves, plus one-step undo. Staff can never set payment states.
// "set" is optional extra columns to update alongside status and version.
const RULES:Partial<Record<Status,{from:Status[];set?:string}>>={
 PREPARING:{from:['PAID','READY'],set:'accepted_at=coalesce(accepted_at,now()),preparing_at=coalesce(preparing_at,now()),ready_at=null'},
 READY:{from:['PREPARING','COMPLETED'],set:'ready_at=now(),completed_at=null'},
 COMPLETED:{from:['READY'],set:'completed_at=now()'},
 PAID:{from:['PREPARING'],set:'preparing_at=null'},
 CANCELLED:{from:['PENDING_PAYMENT','PAID','PREPARING','READY']},
};

export async function transition(no:number,to:Status){
 const rule=RULES[to];
 if(!rule)return{ok:false as const,error:'Not allowed'};
 return tx(async c=>{
  const cur=await find(c,{no}); // row lock: two screens pressing at once are serialised
  if(!cur)return{ok:false as const,error:'Order not found'};
  if(cur.status===to)return{ok:true as const,order:toOrder(cur)}; // another screen already did this: not an error
  if(!rule.from.includes(cur.status))return{ok:false as const,order:toOrder(cur),error:`Order is already ${cur.status}`};
  const u=await c.query<Row>(`update orders set status=$2,version=version+1${rule.set?','+rule.set:''} where no=$1 returning *`,[no,to]);
  await log(c,no,cur.status,to,'staff');
  return{ok:true as const,order:toOrder(u.rows[0])};
 });
}

// "Accept" silences the new-order alarm on every kitchen screen without starting the cooking clock.
// It is stored on the order, so a refresh or a second screen can never bring the alarm back.
export async function acceptOrder(no:number){
 return tx(async c=>{
  const cur=await find(c,{no});
  if(!cur)return{ok:false as const,error:'Order not found'};
  if(['PREPARING','READY','COMPLETED'].includes(cur.status)||cur.accepted_at)return{ok:true as const,order:toOrder(cur)}; // nothing to do
  if(cur.status!=='PAID')return{ok:false as const,order:toOrder(cur),error:`Order is ${cur.status}`};
  const u=await c.query<Row>(`update orders set accepted_at=now(),version=version+1 where no=$1 returning *`,[no]);
  await log(c,no,'PAID','PAID','staff'); // wakes the other screens
  return{ok:true as const,order:toOrder(u.rows[0])};
 });
}

export async function maxEventId(){
 const r=await q<{m:number}>('select coalesce(max(id),0)::int as m from order_events');return r[0].m;
}

// Full picture for a kitchen screen: everything active plus the last few completed.
export async function listKitchen(){
 const lastEventId=await maxEventId(); // read first, so no event can fall between this snapshot and the stream
 const rows=await q<Row>(`(select * from orders where status in ('PAID','PREPARING','READY'))
  union all (select * from orders where status='COMPLETED' order by completed_at desc limit 25)`);
 return{orders:rows.map(toOrder),lastEventId,serverTime:Date.now()};
}

export async function eventsAfter(id:number){
 const rows=await q<Row&{eid:number}>(
  `select e.id::int as eid,o.* from order_events e join orders o on o.no=e.order_no where e.id>$1 order by e.id limit 200`,[id]);
 const last=new Map<number,{eid:number;order:Order}>();
 for(const r of rows)last.set(r.no,{eid:r.eid,order:toOrder(r)});
 return{events:[...last.values()].sort((a,b)=>a.eid-b.eid),maxId:rows.length?rows[rows.length-1].eid:id};
}