import {markPaid} from '@/lib/orders';
import {staffOk} from '@/lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(process.env.NODE_ENV==='production')return new Response('Not found',{status:404});
 if(!staffOk(req))return new Response('Unauthorized',{status:401});
 const no=Number((await params).id);
 const r=await markPaid({no},'DEV'+Date.now());
 return Response.json(r);
}