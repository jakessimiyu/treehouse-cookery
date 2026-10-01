import {s,pay} from '@/lib/store';import {stkPush} from '@/lib/mpesa';import {limited} from '@/lib/leads';
const tries=new Map<number,number>();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(limited(req.headers.get('x-forwarded-for')||'local'))return Response.json({error:'Too many requests. Try again later.'},{status:429});
 const o=s.orders.find(x=>x.no===Number(id));
 if(!o)return Response.json({error:'Order not found'},{status:404});
 if(o.status!=='PAYMENT_FAILED')return Response.json({error:'This order does not need a new payment prompt.'},{status:409});
 const n=(tries.get(o.no)||0)+1;
 if(n>3)return Response.json({error:'Too many attempts. Please place a new order.'},{status:429});
 tries.set(o.no,n);
 try{const res=await stkPush(o.phone,o.total,`${o.no}-${n}`);
  o.checkoutId=res.CheckoutRequestID;o.status='PENDING_PAYMENT';o.payStart=Date.now();
  if(res.simulated)setTimeout(()=>pay(o),4000); // demo mode
 }catch{return Response.json({error:"We couldn't send the M-Pesa prompt. Please try again."},{status:502})}
 return Response.json({status:o.status});}