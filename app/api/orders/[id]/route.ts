import {getOrder,publicOrder,failPayment,transition,Status} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const PAY_WINDOW=180_000; // M-Pesa prompt is treated as failed after 3 minutes

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){ // public tracking
 const no=Number((await params).id);
 if(!Number.isInteger(no))return new Response('Not found',{status:404});
 try{
  let o=await getOrder(no);
  if(!o)return new Response('Not found',{status:404});
  if(o.status==='PENDING_PAYMENT'&&Date.now()-o.payStart>PAY_WINDOW){await failPayment({no});o=(await getOrder(no))||o}
  return Response.json(await publicOrder(o),{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('order get failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}
}

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(!staffOk(r))return new Response('Unauthorized',{status:401});
 const no=Number((await params).id);
 const {status}=await r.json().catch(()=>({}));
 if(!Number.isInteger(no)||typeof status!=='string')return new Response('Bad request',{status:400});
 try{
  const res=await transition(no,status as Status);
  if(res.ok)return Response.json(res.order);
  return new Response(res.error,{status:res.error==='Order not found'?404:409});
 }catch(e){console.error('transition failed',e);return new Response('Temporarily unavailable',{status:503})}
}