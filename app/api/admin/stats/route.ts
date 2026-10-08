import {withConn} from '@/lib/db';
import type {QueryResultRow} from 'pg';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const EAT=3*3600000,DAY=86400000;
const PAID_SET=`('PAID','PREPARING','READY','COMPLETED')`;
type Line={id:string;name:string;qty:number;price:number};
const ms=(d:Date|null)=>d?d.getTime():null;

export async function GET(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 // "today" runs from midnight Nairobi time
 const start=new Date(Math.floor((Date.now()+EAT)/DAY)*DAY-EAT);
 const prev=new Date(start.getTime()-DAY);
 try{
  // one connection shared by every query below (pg queues them on that single connection)
  const [today,yest,status,speed,served,hourly,top,live,recent]=await withConn(c=>{
   const q=<T extends QueryResultRow>(text:string,params:unknown[]=[])=>c.query<T>(text,params).then(r=>r.rows);
   return Promise.all([
    q<{orders:number;revenue:number}>(`select count(*)::int as orders,coalesce(sum(total),0)::int as revenue from orders where paid_at>=$1 and status in ${PAID_SET}`,[start]),
    q<{orders:number;revenue:number}>(`select count(*)::int as orders,coalesce(sum(total),0)::int as revenue from orders where paid_at>=$1 and paid_at<$2 and status in ${PAID_SET}`,[prev,start]),
    q<{status:string;n:number}>(`select status,count(*)::int as n from orders where created_at>=$1 group by status`,[start]),
    q<{n:number;cook:number;total:number}>(
     `select count(*)::int as n,
       coalesce(avg(extract(epoch from (ready_at-preparing_at))),0)::float as cook,
       coalesce(avg(extract(epoch from (ready_at-paid_at))),0)::float as total
      from orders where ready_at>=$1 and preparing_at is not null and paid_at is not null`,[start]),
    q<{n:number}>(`select count(*)::int as n from orders where completed_at>=$1`,[start]),
    q<{h:number;n:number;revenue:number}>(
     `select extract(hour from (paid_at at time zone 'Africa/Nairobi'))::int as h,count(*)::int as n,coalesce(sum(total),0)::int as revenue
      from orders where paid_at>=$1 and status in ${PAID_SET} group by 1 order by 1`,[start]),
    q<{name:string;qty:number;revenue:number}>(
     `select it->>'name' as name,sum((it->>'qty')::int)::int as qty,sum((it->>'qty')::int*(it->>'price')::int)::int as revenue
      from orders o,jsonb_array_elements(o.items) it
      where o.paid_at>=$1 and o.status in ${PAID_SET}
      group by 1 order by 2 desc limit 8`,[start]),
    q<{no:number;status:string;items:Line[];total:number;pickup:string;paid_at:Date|null;accepted_at:Date|null;preparing_at:Date|null;ready_at:Date|null}>(
     `select no,status,items,total,pickup,paid_at,accepted_at,preparing_at,ready_at
      from orders where status in ('PAID','PREPARING','READY') order by paid_at nulls last limit 60`),
    q<{no:number;status:string;items:Line[];total:number;pickup:string;created_at:Date}>(
     `select no,status,items,total,pickup,created_at from orders where created_at>=$1 order by no desc limit 40`,[start]),
   ]);
  });

  const statuses:Record<string,number>={};
  status.forEach(r=>{statuses[r.status]=r.n});
  return Response.json({
   serverTime:Date.now(),since:start.getTime(),
   today:today[0],yesterday:yest[0],statuses,
   cookSec:speed[0].cook,totalSec:speed[0].total,readyCount:speed[0].n,served:served[0].n,
   hourly,top,
   live:live.map(o=>({no:o.no,status:o.status,items:o.items,total:o.total,pickup:o.pickup,
    paidAt:ms(o.paid_at),acceptedAt:ms(o.accepted_at),preparingAt:ms(o.preparing_at),readyAt:ms(o.ready_at)})),
   recent:recent.map(o=>({no:o.no,status:o.status,items:o.items,total:o.total,pickup:o.pickup,createdAt:o.created_at.getTime()})),
  },{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('admin stats failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}