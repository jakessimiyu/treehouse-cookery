// Server-only. Never import from client components.
const base=()=>process.env.MPESA_ENV==='production'?'https://api.safaricom.co.ke':'https://sandbox.safaricom.co.ke';
async function token(){
 const a=Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
 const r=await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`,{headers:{Authorization:`Basic ${a}`}});
 if(!r.ok)throw new Error('mpesa auth');return (await r.json()).access_token as string;}
export function normalizePhone(p:string){const d=p.replace(/\D/g,'');if(/^0[17]\d{8}$/.test(d))return '254'+d.slice(1);if(/^254[17]\d{8}$/.test(d))return d;return null;}
export async function stkPush(phone:string,amount:number,ref:string):Promise<{CheckoutRequestID:string;simulated?:boolean}>{
 if(!process.env.MPESA_CONSUMER_KEY)return {CheckoutRequestID:'SIM-'+ref,simulated:true}; // dev without credentials
 const ts=new Date().toISOString().replace(/\D/g,'').slice(0,14),sc=process.env.MPESA_SHORTCODE!;
 const pw=Buffer.from(sc+process.env.MPESA_PASSKEY+ts).toString('base64');
 const r=await fetch(`${base()}/mpesa/stkpush/v1/processrequest`,{method:'POST',headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json'},
  body:JSON.stringify({BusinessShortCode:sc,Password:pw,Timestamp:ts,TransactionType:'CustomerPayBillOnline',Amount:amount,PartyA:phone,PartyB:sc,PhoneNumber:phone,CallBackURL:process.env.MPESA_CALLBACK_URL,AccountReference:ref,TransactionDesc:'Order '+ref})});
 const j=await r.json();if(j.ResponseCode!=='0')throw new Error(j.errorMessage||'stk failed');return j;}