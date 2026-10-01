import {L,Kind,CAPACITY,EVENT_TYPES,booked,limited} from '@/lib/leads';
import {okStaff} from '@/lib/store';import {normalizePhone} from '@/lib/mpesa';
import {SLOTS,today,addDays,mins,nowMin} from '@/lib/dates';
export const dynamic='force-dynamic';
const bad=(error:string,status=400)=>Response.json({error},{status});
const isKind=(k:string):k is Kind=>k==='reservations'||k==='catering';

export async function GET(req:Request,{params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;if(!isKind(kind))return bad('Not found',404);
 const u=new URL(req.url);const d=u.searchParams.get('date');
 if(kind==='reservations'&&d){ // public: which slots are full for this date and party size
  const g=Number(u.searchParams.get('guests'))||1;
  return Response.json({full:SLOTS.filter(t=>booked(d,t)+g>CAPACITY),left:Object.fromEntries(SLOTS.map(t=>[t,CAPACITY-booked(d,t)]))});}
 if(!okStaff(req))return bad('Unauthorized',401);
 return Response.json(L[kind].slice().reverse());}

export async function POST(req:Request,{params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;if(!isKind(kind))return bad('Not found',404);
 if(limited(req.headers.get('x-forwarded-for')||'local'))return bad('Too many requests. Please try again later.',429);
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid request');
 if(b.website)return Response.json({ref:'R-0000'}); // honeypot: pretend success to bots
 const str=(k:string,max=200)=>String(b[k]??'').trim().slice(0,max);
 const name=str('name',80),email=str('email',120),phone=normalizePhone(str('phone',20)),date=str('date',10),guests=Number(b.guests)|0;
 if(name.length<2)return bad('Please enter your name.');
 if(!phone)return bad('Enter a valid Kenyan phone number, e.g. 0712 345 678.');
 if(email&&!/^\S+@\S+\.\S+$/.test(email))return bad('That email address looks wrong.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return bad('Please choose a date.');
 const t=today();let data:Record<string,string|number>;
 if(kind==='reservations'){
  const time=str('time',5);
  if(!SLOTS.includes(time))return bad('Please choose a time.');
  if(date<t||date>addDays(t,60))return bad('Choose a date within the next 60 days.');
  if(date===t&&mins(time)<nowMin())return bad('That time has already passed.');
  if(guests<1||guests>20)return bad('For parties over 20, please use our catering form.');
  if(booked(date,time)+guests>CAPACITY)return bad('That time is full. Please pick another slot.',409);
  data={name,phone,email,date,time,guests,requests:str('requests',300)};
 }else{
  const eventType=str('eventType',40);
  if(!EVENT_TYPES.includes(eventType))return bad('Please choose an event type.');
  if(date<addDays(t,2))return bad('We need at least 2 days notice for catering.');
  if(guests<5||guests>2000)return bad('Catering starts at 5 people.');
  data={
   name,phone,email,date,guests,eventType,
   company:str('company',80),
   fulfilment:str('fulfilment',20),
   venue:str('venue',150),
   interest:str('interest',30),
   budget:str('budget',30),
   details:str('details',900), // was 600; add-ons, dietary needs and notes share this field
  };
 }
 const id=L[kind].length+1;const ref=(kind==='reservations'?'R-':'C-')+(1000+id);
 L[kind].push({id,ref,status:'NEW',createdAt:Date.now(),data});
 return Response.json({ref});}