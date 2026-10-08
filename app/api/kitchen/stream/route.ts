import {eventsAfter,maxEventId} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

const FAIL_RETRY_MS=15_000,POLL_MS=2_000,LIFETIME_MS=50_000,LOOKBACK=30,MAX_FAILS=3;

export async function GET(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const raw=req.headers.get('last-event-id')||new URL(req.url).searchParams.get('after');
 const enc=new TextEncoder();
 const stream=new ReadableStream({async start(ctrl){
  const send=(s:string)=>{try{ctrl.enqueue(enc.encode(s))}catch{}};
  const sleep=(ms:number)=>new Promise<void>(r=>{
   const done=()=>{clearTimeout(t);req.signal.removeEventListener('abort',done);r()};
   const t=setTimeout(done,ms);req.signal.addEventListener('abort',done);
  });
  const t0=Date.now();let beat=0,fails=0,dbDown=false;
  let cursor:number|null=raw&&!Number.isNaN(Number(raw))?Number(raw):null;
  let skipUpTo=-1;            // fresh connect with no cursor: don't replay history, the screen just did a full load
  const sent=new Set<number>(); // event ids already sent on THIS stream (lookback re-reads would otherwise repeat them)
  send('retry: 2000\n\n');
  while(!req.signal.aborted&&Date.now()-t0<LIFETIME_MS){
   try{
    if(cursor===null){cursor=await maxEventId();skipUpTo=cursor}
    const ev=await eventsAfter(cursor,LOOKBACK); // one short-lived connection, released before we sleep
    fails=0;
    for(const e of ev.events){
     if(e.eid<=skipUpTo||sent.has(e.eid))continue;
     sent.add(e.eid);
     send(`id: ${Math.max(e.eid,cursor)}\ndata: ${JSON.stringify(e.order)}\n\n`); // Last-Event-ID stays monotonic
    }
    cursor=Math.max(cursor,ev.maxId);
    for(const id of sent)if(id<cursor-LOOKBACK*2)sent.delete(id);
   }catch(e){
    fails++;console.error('kitchen stream poll failed',fails,e);
    if(fails>=MAX_FAILS){
     dbDown=true;
     send(`retry: ${FAIL_RETRY_MS}\nevent: db-error\ndata: ${JSON.stringify({message:'Database unavailable',retryMs:FAIL_RETRY_MS,t:Date.now()})}\n\n`);
     break;
    }
   }
   if(Date.now()-beat>10_000){send(`event: ping\ndata: ${JSON.stringify({t:Date.now(),c:cursor})}\n\n`);beat=Date.now()}
   await sleep(fails?Math.min(POLL_MS*(fails+1),6_000):POLL_MS);
  }
  if(!dbDown&&!req.signal.aborted)send('event: reconnect\ndata: 1\n\n');
  try{ctrl.close()}catch{}
 }});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'}});
}