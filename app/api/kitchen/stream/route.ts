import {eventsAfter,maxEventId} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

const FAIL_RETRY_MS=15_000;

export async function GET(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const raw=req.headers.get('last-event-id')||new URL(req.url).searchParams.get('after');
 const enc=new TextEncoder();
 const stream=new ReadableStream({async start(ctrl){
  const send=(s:string)=>{try{ctrl.enqueue(enc.encode(s))}catch{}};
  const t0=Date.now();let beat=0;
  send('retry: 2000\n\n');
  try{
   // inside the try, so a down database is reported instead of throwing before the stream exists
   let cursor=raw&&!Number.isNaN(Number(raw))?Number(raw):await maxEventId();
   while(!req.signal.aborted&&Date.now()-t0<50_000){
    const ev=await eventsAfter(cursor);
    for(const e of ev.events)send(`id: ${e.eid}\ndata: ${JSON.stringify(e.order)}\n\n`);
    cursor=ev.maxId;
    if(Date.now()-beat>10_000){send(`event: ping\ndata: ${JSON.stringify({t:Date.now(),c:cursor})}\n\n`);beat=Date.now()}
    await new Promise(r=>setTimeout(r,1000));
   }
   send('event: reconnect\ndata: 1\n\n');
  }catch(e){
   console.error('kitchen stream failed',e);
   // tell the screen, and slow the browser's auto-reconnect so it stops hammering the pooler
   send(`retry: ${FAIL_RETRY_MS}\nevent: db-error\ndata: ${JSON.stringify({message:'Database unavailable',retryMs:FAIL_RETRY_MS,t:Date.now()})}\n\n`);
  }
  try{ctrl.close()}catch{}
 }});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'}});
}