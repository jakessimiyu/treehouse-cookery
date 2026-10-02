import {getOrder,getPhone,retryPayment,setCheckout,markPaid} from '@/lib/orders';
import {stkPush} from '@/lib/mpesa';import {limited} from '@/lib/leads';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const tries=new Map<number,number>();

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(limited(req.headers.get('x-forwarded-for')||'local'))return Response.json({error:'Too many requests. Try again later.'},{status:429});
 const no=Number(id);
 if(!Number.isInteger(no))return Response.json({error:'Order not found'},{status:404});
 try{
  const o=await getOrder(no);
  if(!o)return Response.json({error:'Order not found'},{status:404});
  if(o.status!=='PAYMENT_FAILED')return Response.json({error:'This order does not need a new payment prompt.'},{status:409});
  const n=(tries.get(no)||0)+1;
  if(n>3)return Response.json({error:'Too many attempts. Please place a new order.'},{status:429});
  tries.set(no,n);
  const phone=await getPhone(no);if(!phone)return Response.json({error:'Order not found'},{status:404});
  let res;
  try{res=await stkPush(phone,o.total,`${no}-${n}`)}
  catch{return Response.json({error:"We couldn't send the M-Pesa prompt. Please try again."},{status:502})}
  await setCheckout(no,res.CheckoutRequestID); // before the status flip, so an early callback still finds the order
  const u=await retryPayment(no);
  if(res.simulated)setTimeout(()=>{markPaid({no},'SIM'+Date.now()).catch(console.error)},4000); // demo mode
  return Response.json({status:u?.status??'PENDING_PAYMENT'});
 }catch(e){console.error('retry failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}
}