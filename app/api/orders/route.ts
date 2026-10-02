import {createOrder,setCheckout,failPayment,markPaid,Line} from '@/lib/orders';
import {s} from '@/lib/store';
import {stkPush,normalizePhone} from '@/lib/mpesa';
import {limited} from '@/lib/leads';
import {randomUUID} from 'crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// ASSUMPTION: s.menu is an array of {id,name,price,soldOut?}. Adjust the field names if yours differ.
type MenuItem={id:string;name:string;price:number;soldOut?:boolean};

export async function POST(req:Request){
 if(limited(req.headers.get('x-forwarded-for')||'local'))return Response.json({error:'Too many requests. Try again later.'},{status:429});
 const b=await req.json().catch(()=>null);
 if(!b)return Response.json({error:'Bad request'},{status:400});

 const phone=normalizePhone(String(b.phone||''));
 if(!phone)return Response.json({error:'Enter a valid Safaricom number'},{status:400});

 // prices always come from the server's menu, never from the client
 const menu=s.menu as unknown as MenuItem[];
 const raw:{id:string;qty:number}[]=Array.isArray(b.items)?b.items:[];
 if(raw.length<1||raw.length>30)return Response.json({error:'Your cart is empty'},{status:400});
 const items:Line[]=[];
 for(const r of raw){
  const m=menu.find(x=>x.id===String(r.id));
  const qty=Number(r.qty);
  if(!m||m.soldOut||!Number.isInteger(qty)||qty<1||qty>50)return Response.json({error:`"${r?.id}" is unavailable`},{status:400});
  items.push({id:m.id,name:m.name,qty,price:m.price});
 }
 const total=items.reduce((t,l)=>t+l.price*l.qty,0);

 const key=String(req.headers.get('idempotency-key')||b.key||randomUUID());
 const notes=String(b.notes||'').slice(0,300);
 const pickup=String(b.pickup||'ASAP').slice(0,40);

 let no:number;
 try{
  const {order,created}=await createOrder({key,phone,items,total,notes,pickup});
  no=order.no;
  if(!created)return Response.json({no,status:order.status}); // same key: never send a second prompt
 }catch(e){console.error('create order failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}

 try{
  const res=await stkPush(phone,total,String(no));
  await setCheckout(no,res.CheckoutRequestID);
  if(res.simulated)setTimeout(()=>{markPaid({no},'SIM'+Date.now()).catch(console.error)},4000); // demo mode
 }catch(e){
  console.error('stk push failed',e);
  await failPayment({no}).catch(()=>{}); // customer can use the retry button
  return Response.json({no,status:'PAYMENT_FAILED',error:"We couldn't send the M-Pesa prompt. Please try again."},{status:502});
 }
 return Response.json({no,status:'PENDING_PAYMENT'},{status:201});
}