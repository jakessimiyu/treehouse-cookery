import {getShop,setShop,setHours,shopState,DEFAULT_SHOP} from '@/lib/shop';
import type {Mode,Hours} from '@/lib/shop';
import {cleanHours} from '@/lib/hours';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const NO_STORE={'Cache-Control':'no-store'};

// public: the website hero and footer read this
export async function GET(){
 try{return Response.json(shopState(await getShop()),{headers:NO_STORE})}
 catch(e){
  console.error('shop get failed',e);
  // database down: fall back to the normal opening hours so the site still shows something sensible
  return Response.json(shopState(DEFAULT_SHOP),{headers:NO_STORE});
 }
}

// staff only: the kitchen and admin pages change it
export async function POST(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const b=await req.json().catch(()=>null);
 if(!b||typeof b!=='object')return Response.json({error:'Bad request'},{status:400});

 let mode:Mode|undefined;
 if(b.mode!==undefined){
  if(b.mode!=='auto'&&b.mode!=='open'&&b.mode!=='closed')return Response.json({error:'Bad request'},{status:400});
  mode=b.mode;
 }
 let hours:Hours|null|undefined;
 if('hours' in b){
  if(b.hours===null)hours=null;
  else{
   const h=cleanHours(b.hours);
   if(!h)return Response.json({error:'Those opening hours are not valid.'},{status:400});
   hours=h;
  }
 }
 if(mode===undefined&&hours===undefined)return Response.json({error:'Bad request'},{status:400});

 try{
  if(mode)await setShop(mode,typeof b.note==='string'?b.note.trim().slice(0,60):'');
  if(hours!==undefined)await setHours(hours);
  return Response.json(shopState(await getShop()),{headers:NO_STORE});
 }catch(e){
  console.error('shop set failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}