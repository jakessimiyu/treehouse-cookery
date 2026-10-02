import {getOrder,publicOrder,failPayment,transition,acceptOrder,Status} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Public tracking (unchanged)
export async function GET(_:Request,{params}:{params:Promise<{no:string}>}){
 const no=Number((await params).no);
 if(!Number.isInteger(no))return Response.json({error:'Not found'},{status:404});
 try{
  let o=await getOrder(no);
  if(!o)return Response.json({error:'Not found'},{status:404});
  if(o.status==='PENDING_PAYMENT'&&Date.now()-o.payStart>200_000){await failPayment({no});o=(await getOrder(no))||o}
  return Response.json(await publicOrder(o),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Temporarily unavailable'},{status:503})}
}

// Kitchen buttons (staff only)
async function change(r:Request,{params}:{params:Promise<{no:string}>}){
 if(!staffOk(r))return new Response('Unauthorized',{status:401});
 const no=Number((await params).no);
 const body=await r.json().catch(()=>({}));
 const accept=body?.action==='accept';
 const status=body?.to??body?.status; // accept either field name
 if(!Number.isInteger(no)||(!accept&&typeof status!=='string'))
  return Response.json({ok:false,error:'Bad request'},{status:400});
 try{
  const res=accept?await acceptOrder(no):await transition(no,status as Status);
  if(res.ok)return Response.json({ok:true,order:res.order});
  return Response.json({ok:false,error:res.error,order:res.order},{status:res.error==='Order not found'?404:409});
 }catch(e){
  console.error('kitchen update failed',e);
  return Response.json({ok:false,error:'Temporarily unavailable'},{status:503});
 }
}
export {change as PATCH,change as POST,change as PUT};