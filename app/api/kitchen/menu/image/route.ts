import {staffOk} from '@/lib/staff';
import {getItem,bumpImage} from '@/lib/menu';
import {bucket,sniff} from '@/lib/menuImages';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX=1_500_000; // the admin page resizes photos to a few hundred KB before sending
const fail=(error:string,status=400)=>Response.json({ok:false,error},{status,headers:{'Cache-Control':'no-store'}});

// staff only: upload or replace one dish photo (multipart: id + file)
export async function POST(req:Request){
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const bk=bucket();
 if(!bk)return fail('Photo storage is not set up yet (the MENU_IMAGES bucket).',503);
 const form=await req.formData().catch(()=>null);
 const id=String(form?.get('id')||'');
 const file=form?.get('file');
 if(!form||!id||!file||typeof file==='string')return fail('Choose a photo first.');
 if(file.size>MAX)return fail('That photo is too large.');
 try{
  if(!(await getItem(id)))return fail('That dish was not found.',404);
  const buf=await file.arrayBuffer();
  const type=sniff(new Uint8Array(buf,0,Math.min(16,buf.byteLength)));
  if(!type)return fail('Use a JPG, PNG or WebP photo.');
  await bk.put('menu/'+id,buf,{httpMetadata:{contentType:type}});
  const img=await bumpImage(id);
  if(img===null)return fail('That dish was not found.',404);
  return Response.json({ok:true,img},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('menu image upload failed',e);
  return Response.json({error:'Temporarily unavailable'},{status:503});
 }
}