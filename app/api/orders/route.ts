import {createOrder,setCheckout,failPayment,markPaid,Line} from '@/lib/orders';
import {listMenu} from '@/lib/menu';
import {stkPush,normalizePhone} from '@/lib/mpesa';
import {limited} from '@/lib/leads';
import {randomUUID} from 'crypto';
import {getCloudflareContext} from '@opennextjs/cloudflare';
export const runtime='nodejs';
export const dynamic='force-dynamic';

type MenuItem={id:string;name:string;price:number};

export async function POST(req:Request){
 if(limited(req.headers.get('x-forwarded-for')||'local'))return Response.json({error:'Too many requests. Try again later.'},{status:429});
 const b=await req.json().catch(()=>null);
 if(!b)return Response.json({error:'Bad request'},{status:400});

 const phone=normalizePhone(String(b.phone||''));
 if(!phone)return Response.json({error:'Enter a valid Safaricom number'},{status:400});

 const raw:{id:string;qty:number}[]=Array.isArray(b.items)?b.items:[];
 if(raw.length<1||raw.length>30)return Response.json({error:'Your cart is empty'},{status:400});

 // prices, availability and removals always come from the database, never from the client
 let menu:MenuItem[];let sold:Set<string>;
 try{
  const all=await listMenu(true);
  menu=all.filter(m=>!m.removed);
  sold=new Set(all.filter(m=>m.soldOut).map(m=>m.id));
 }catch(e){console.error('menu check failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}

 const items:Line[]=[];
 for(const r of raw){
  const m=menu.find(x=>x.id===String(r.id));
  const qty=Number(r.qty);
  if(!m)return Response.json({error:'An item in your order is no longer on the menu. Please refresh the page.'},{status:409});
  if(sold.has(m.id))return Response.json({error:`Sorry, ${m.name} is sold out today. Please remove it from your order.`},{status:409});
  if(!Number.isInteger(qty)||qty<1||qty>50)return Response.json({error:`Please check the quantity for ${m.name}.`},{status:400});
  items.push({id:m.id,name:m.name,qty,price:m.price});
 }
 const total=items.reduce((t,l)=>t+l.price*l.qty,0);

 // the customer must be charged exactly what their screen showed
 if(b.total!==undefined&&Number(b.total)!==total)
  return Response.json({error:'Some prices have just changed. We have updated your cart, so please check the new total and try again.',code:'PRICE_CHANGED'},{status:409});

 const key=String(req.headers.get('idempotency-key')||b.key||randomUUID());
 const notes=String(b.notes||'').slice(0,300);
 const pickup=String(b.pickup||'ASAP').slice(0,40);

 let no:number;
 try{
  const {order,created}=await createOrder({key,phone,items,total,notes,pickup});
  no=order.no;
  if(!created)return Response.json({no,status:order.status}); // same key: never send a second prompt
 }catch(e){console.error('create order failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}

 let res:Awaited<ReturnType<typeof stkPush>>;
 try{
  res=await stkPush(phone,total,String(no));
 }catch(e){
  console.error('stk push failed',e);
  await failPayment({no}).catch(()=>{}); // customer can use the retry button
  return Response.json({no,status:'PAYMENT_FAILED',error:"We couldn't send the M-Pesa prompt. Please try again."},{status:502});
 }

 // Simulated payments mark an order PAID with no real money, so they only run when explicitly allowed.
 if(res.simulated&&process.env.ALLOW_SIMULATED_PAYMENTS!=='1'){
  console.error('simulated payment blocked: ALLOW_SIMULATED_PAYMENTS is not set',no);
  await failPayment({no}).catch(()=>{});
  return Response.json({no,status:'PAYMENT_FAILED',error:"We couldn't send the M-Pesa prompt. Please try again."},{status:502});
 }

 // The prompt is out. From here the order must never be marked failed, or a real payment could be lost.
 // setCheckout is "insert ... on conflict do nothing", so retrying it is safe.
 let linked=false;
 for(let i=0;i<3&&!linked;i++){
  try{await setCheckout(no,res.CheckoutRequestID);linked=true}
  catch(e){
   console.error('setCheckout failed',i+1,no,res.CheckoutRequestID,e);
   if(i<2)await new Promise(r=>setTimeout(r,300));
  }
 }
 if(!linked)console.error('CHECKOUT NOT LINKED: reconcile manually',{no,checkoutRequestId:res.CheckoutRequestID});

 if(res.simulated){ // demo mode only
  const sim=async()=>{await new Promise(r=>setTimeout(r,4000));await markPaid({no},'SIM'+Date.now())};
  try{getCloudflareContext().ctx.waitUntil(sim().catch(console.error))} // survives after the response on Workers
  catch{sim().catch(console.error)}
 }
 return Response.json({no,status:'PENDING_PAYMENT'},{status:201});
}