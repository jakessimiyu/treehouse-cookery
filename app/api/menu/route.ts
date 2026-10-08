import {s} from '@/lib/store';
import {menuNow} from '@/lib/availability';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
 try{
  return Response.json(await menuNow(),{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  // database down: still show the menu rather than an empty page
  console.error('menu availability failed',e);
  return Response.json(s.menu,{headers:{'Cache-Control':'no-store'}});
 }
}