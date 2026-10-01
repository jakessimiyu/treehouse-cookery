import {s,pay} from '@/lib/store';
// Daraja posts here. Payment is confirmed ONLY here, matched by CheckoutRequestID and amount.
export async function POST(r:Request){
 const cb=(await r.json())?.Body?.stkCallback;if(!cb)return Response.json({ResultCode:0});
 const o=s.orders.find(x=>x.checkoutId===cb.CheckoutRequestID);
 if(o){ if(cb.ResultCode===0){
   const meta:{Name:string;Value:unknown}[]=cb.CallbackMetadata?.Item||[];const get=(n:string)=>meta.find(i=>i.Name===n)?.Value;
   if(Number(get('Amount'))>=o.total)pay(o,String(get('MpesaReceiptNumber')));
  } else if(o.status==='PENDING_PAYMENT')o.status='PAYMENT_FAILED'; }
 return Response.json({ResultCode:0,ResultDesc:'Accepted'});}