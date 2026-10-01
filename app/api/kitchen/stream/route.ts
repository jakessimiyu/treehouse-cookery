import {s,Order} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(r:Request){
 if(new URL(r.url).searchParams.get('key')!==(process.env.STAFF_KEY||'dev'))return new Response('Unauthorized',{status:401});
 const enc=new TextEncoder();let h:(o:Order)=>void;let ping:ReturnType<typeof setInterval>;
 const stream=new ReadableStream({start(c){
  h=o=>c.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));s.bus.on('order',h);
  ping=setInterval(()=>c.enqueue(enc.encode(': ping\n\n')),20000);
  r.signal.addEventListener('abort',()=>{s.bus.off('order',h);clearInterval(ping);});}});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache'}});}