import {s} from '@/lib/store';
import {setSoldOut,soldOutIds} from '@/lib/availability';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(!staffOk(r))return new Response('Unauthorized',{status:401});
 const {id}=await params;
 const b=await r.json().catch(()=>({}));
 const it=s.menu.find(m=>m.id===id);
 if(!it)return new Response('Not found',{status:404});
 if(Number.isInteger(b.price)&&b.price>0)it.price=b.price; // prices stay in memory, as before
 try{
  if(typeof b.soldOut==='boolean')await setSoldOut(id,b.soldOut);
  const sold=(await soldOutIds()).has(id);
  return Response.json({...it,soldOut:sold});
 }catch(e){
  console.error('admin menu update failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}