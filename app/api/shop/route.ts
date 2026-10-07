import {getShop,setShop,shopState,DEFAULT_SHOP,Mode} from '@/lib/shop';
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

// staff only: the kitchen page changes it
export async function POST(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const b=await req.json().catch(()=>null);
 const mode=b?.mode as Mode;
 if(mode!=='auto'&&mode!=='open'&&mode!=='closed')return Response.json({error:'Bad request'},{status:400});
 const note=typeof b?.note==='string'?b.note.trim().slice(0,60):'';
 try{
  await setShop(mode,note);
  return Response.json(shopState(await getShop()),{headers:NO_STORE});
 }catch(e){
  console.error('shop set failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}