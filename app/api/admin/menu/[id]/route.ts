import {s,okStaff} from '@/lib/store';
export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(!okStaff(r))return new Response('Unauthorized',{status:401});
 const {id}=await params;const b=await r.json();const it=s.menu.find(m=>m.id===id);
 if(!it)return new Response('Not found',{status:404});
 if(typeof b.soldOut==='boolean')it.soldOut=b.soldOut;
 if(Number.isInteger(b.price)&&b.price>0)it.price=b.price;
 return Response.json(it);}