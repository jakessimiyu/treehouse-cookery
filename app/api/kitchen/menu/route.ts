import {listMenu,getItem,createItem,updateItem,setRemoved,parseFields} from '@/lib/menu';
import type {Fields} from '@/lib/menu';
import {setSoldOut,clearSoldOut} from '@/lib/availability';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const NO_STORE={'Cache-Control':'no-store'};
const fail=(error:string,status=400)=>Response.json({ok:false,error},{status,headers:NO_STORE});
const gone=()=>fail('That dish was not found. If the menu has not been moved to the database yet, run npm run db:migrate.',404);

// staff only: the menu with today's sold-out flags. ?all=1 also lists removed dishes (admin).
export async function GET(req:Request){
 if(!staffOk(req)) return new Response('Unauthorized',{status:401});
 try{
  const all=new URL(req.url).searchParams.get('all')==='1';
  return Response.json(await listMenu(all),{headers:NO_STORE});
 }catch(e){
  console.error('KITCHEN MENU ERROR:', e); // <--- Add this line
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}

// staff only: sold out / available, reset, add, edit, remove, restore
export async function POST(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const b=(await req.json().catch(()=>null)) as Record<string,unknown>|null;
 if(!b||typeof b!=='object')return fail('Bad request');
 try{
  const action=typeof b.action==='string'?b.action:'';

  if(action==='reset'){await clearSoldOut();return Response.json({ok:true},{headers:NO_STORE})}

  if(action==='create'){
   const p=parseFields(b,true);if('error' in p)return fail(p.error);
   const item=await createItem(p.f as Fields);
   return Response.json({ok:true,item},{status:201,headers:NO_STORE});
  }

  const id=String(b.id||'');

  if(action==='update'){
   const p=parseFields(b,false);if('error' in p)return fail(p.error);
   if(!Object.keys(p.f).length)return fail('Nothing to change.');
   const item=await updateItem(id,p.f);
   if(!item)return gone();
   return Response.json({ok:true,item},{headers:NO_STORE});
  }

  if(action==='remove'||action==='restore'){
   if(!(await setRemoved(id,action==='remove')))return gone();
   return Response.json({ok:true,id,removed:action==='remove'},{headers:NO_STORE});
  }

  // default: sold-out switch for one dish
  if(typeof b.soldOut!=='boolean')return fail('Bad request');
  if(!(await getItem(id)))return fail('Bad request');
  await setSoldOut(id,b.soldOut);
  return Response.json({ok:true,id,soldOut:b.soldOut},{headers:NO_STORE});
 }catch(e){
  console.error('kitchen menu update failed',e);
  if((e as {code?:string}).code==='42P01')return fail('The menu table is not set up yet. Run npm run db:migrate.',503);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}