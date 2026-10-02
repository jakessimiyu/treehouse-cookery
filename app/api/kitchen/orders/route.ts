import {listKitchen} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 try{
  return Response.json(await listKitchen(),{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('kitchen list failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}