import {L,STATUS,Kind} from '@/lib/leads';import {okStaff} from '@/lib/store';
export async function PATCH(req:Request,{params}:{params:Promise<{kind:string;id:string}>}){
 if(!okStaff(req))return new Response('Unauthorized',{status:401});
 const {kind,id}=await params;if(kind!=='reservations'&&kind!=='catering')return new Response('Not found',{status:404});
 const lead=L[kind as Kind].find(l=>l.id===Number(id));if(!lead)return new Response('Not found',{status:404});
 const {status}=await req.json();if(!STATUS[kind as Kind].includes(status))return new Response('Bad status',{status:400});
 lead.status=status;return Response.json(lead);}