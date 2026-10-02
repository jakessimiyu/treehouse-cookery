import {getOrderByCheckout,markPaid,failPayment} from '@/lib/orders';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const ACK=()=>Response.json({ResultCode:0,ResultDesc:'Accepted'});

// Daraja posts here. Payment is confirmed ONLY here, matched by CheckoutRequestID and amount.
export async function POST(r:Request){
 try{
  const raw=await r.json();
  const cb=raw?.Body?.stkCallback;if(!cb)return ACK();
  const id=String(cb.CheckoutRequestID);
  if(cb.ResultCode===0){
   const meta:{Name:string;Value:unknown}[]=cb.CallbackMetadata?.Item||[];
   const get=(n:string)=>meta.find(i=>i.Name===n)?.Value;
   const o=await getOrderByCheckout(id);
   if(o&&Number(get('Amount'))<o.total){console.error('mpesa underpayment',o.no,get('Amount'),o.total);return ACK()}
   // unknown checkout -> markPaid stores it in payment_orphans
   await markPaid({checkoutId:id},String(get('MpesaReceiptNumber')),raw);
  }else{
   await failPayment({checkoutId:id});
  }
 }catch(e){console.error('mpesa callback failed',e)}
 return ACK();
}