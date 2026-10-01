import {s,pay,okStaff,Order} from '@/lib/store';
import {stkPush,normalizePhone} from '@/lib/mpesa';
export const dynamic='force-dynamic';
export async function GET(r:Request){ if(!okStaff(r))return new Response('Unauthorized',{status:401});
 return Response.json(s.orders.slice().reverse());}
export async function POST(r:Request){
 const b=await r.json();const phone=normalizePhone(String(b.phone||''));
 if(!phone)return Response.json({error:'Enter a valid Safaricom number, e.g. 0712 345 678'},{status:400});
 const key=String(b.key||'');if(!key)return Response.json({error:'Missing key'},{status:400});
 const dup=s.orders.find(o=>o.key===key); // idempotency: resubmitting the same cart returns the same order
 if(dup)return Response.json({no:dup.no,status:dup.status});
 const lines:Order['items']=[];
 for(const l of b.items||[]){const m=s.menu.find(x=>x.id===l.id);
  if(!m||m.soldOut)return Response.json({error:`${m?.name||'An item'} is sold out`},{status:409});
  const qty=Math.min(20,Math.max(1,Number(l.qty)|0));lines.push({id:m.id,name:m.name,qty,price:m.price});} // prices come from the server only
 if(!lines.length)return Response.json({error:'Cart is empty'},{status:400});
 const total=lines.reduce((a,l)=>a+l.qty*l.price,0);
 const o:Order={id:s.orders.length+1,no:++s.seq,phone,items:lines,total,notes:String(b.notes||'').slice(0,200),pickup:String(b.pickup||'ASAP'),status:'PENDING_PAYMENT',key,createdAt:Date.now()};
 s.orders.push(o);
 try{const res=await stkPush(phone,total,String(o.no));o.checkoutId=res.CheckoutRequestID;
  if(res.simulated)setTimeout(()=>pay(o),4000); // demo mode: auto-confirm after 4s
 }catch{o.status='PAYMENT_FAILED';}
 return Response.json({no:o.no,status:o.status});}