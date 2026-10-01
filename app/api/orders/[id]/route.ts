import {s,emit,okStaff,Status} from '@/lib/store';
const flow:Status[]=['PAID','PREPARING','READY','COMPLETED'];
const PAY_WINDOW=180000; // M-Pesa prompt is treated as failed after 3 minutes
export const dynamic='force-dynamic';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){ // public tracking by order number
 const {id}=await params;
 const o=s.orders.find(x=>x.no===Number(id));
 if(!o)return new Response('Not found',{status:404});
 const payStart=o.payStart??o.createdAt;
 if(o.status==='PENDING_PAYMENT'&&Date.now()-payStart>PAY_WINDOW)o.status='PAYMENT_FAILED';
 const ahead=(o.status==='PAID'||o.status==='PREPARING')
  ?s.orders.filter(x=>(x.status==='PAID'||x.status==='PREPARING')&&(x.paidAt??0)<(o.paidAt??0)).length:0;
 return Response.json({no:o.no,status:o.status,items:o.items,total:o.total,createdAt:o.createdAt,paidAt:o.paidAt,payStart,pickup:o.pickup,ahead});}

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(!okStaff(r))return new Response('Unauthorized',{status:401});
 const {id}=await params;
 const o=s.orders.find(x=>x.no===Number(id));
 if(!o)return new Response('Not found',{status:404});
 const {status}=await r.json();
 if(status==='CANCELLED'&&o.status!=='COMPLETED')o.status='CANCELLED';
 else if(flow.indexOf(status)>0&&flow.indexOf(status)===flow.indexOf(o.status)+1)o.status=status; // legal forward moves only
 else return new Response('Invalid transition',{status:409});
 emit(o);return Response.json(o);}