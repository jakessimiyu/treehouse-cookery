import {bucket} from '@/lib/menuImages';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Public: serves an uploaded dish photo. The ?v= version makes it safe to cache for a year.
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-z0-9-]{1,60}$/.test(id))return new Response('Not found',{status:404});
 const bk=bucket();
 if(!bk)return new Response('Not found',{status:404});
 try{
  const obj=await bk.get('menu/'+id);
  if(!obj)return new Response('Not found',{status:404});
  const versioned=new URL(req.url).searchParams.has('v');
  return new Response(obj.body,{headers:{
   'Content-Type':obj.httpMetadata?.contentType||'image/webp',
   'Cache-Control':versioned?'public, max-age=31536000, immutable':'public, max-age=300',
   'X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('menu image read failed',e);return new Response('Unavailable',{status:503})}
}