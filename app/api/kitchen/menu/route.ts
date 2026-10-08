import {s} from '@/lib/store';
import {menuNow,setSoldOut,clearSoldOut} from '@/lib/availability';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const NO_STORE={'Cache-Control':'no-store'};

// staff only: the menu with today's sold-out flags
export async function GET(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 try{return Response.json(await menuNow(),{headers:NO_STORE})}
 catch(e){console.error('kitchen menu failed',e);return Response.json({error:'Temporarily unavailable'},{status:503})}
}

// staff only: mark one item sold out / available, or reset everything
export async function POST(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const b=await req.json().catch(()=>null);
 try{
  if(b?.action==='reset'){
   await clearSoldOut();
   return Response.json({ok:true},{headers:NO_STORE});
  }
  const id=String(b?.id||'');
  if(!s.menu.some(m=>m.id===id)||typeof b?.soldOut!=='boolean')return Response.json({error:'Bad request'},{status:400});
  await setSoldOut(id,b.soldOut);
  return Response.json({ok:true,id,soldOut:b.soldOut},{headers:NO_STORE});
 }catch(e){
  console.error('kitchen menu update failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}