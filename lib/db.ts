import {Client,QueryResultRow} from 'pg';
import {getCloudflareContext} from '@opennextjs/cloudflare';

export type Conn=Client;

const CONNECT_MS=5_000,QUERY_MS=10_000;
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));

// Hyperdrive if bound, otherwise DATABASE_URL (Supabase transaction pooler).
function target(){
 try{
  const h=(getCloudflareContext().env as unknown as {HYPERDRIVE?:{connectionString:string}}).HYPERDRIVE;
  if(h?.connectionString)return{url:h.connectionString,hyper:true};
 }catch{/* not inside a Cloudflare request (e.g. plain next dev) */}
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error('DATABASE_URL is not set');
 return{url,hyper:false};
}

const close=(c:Client)=>Promise.race([c.end().catch(()=>{}),sleep(1000)]);

// A connection belongs to ONE request. Never cache it. Retrying only the connect step is safe: no SQL has been sent yet.
async function open():Promise<Client>{
 const {url,hyper}=target();
 const local=/localhost|127\.0\.0\.1/.test(url);
 for(let attempt=0;;attempt++){
  const c=new Client({connectionString:url,connectionTimeoutMillis:CONNECT_MS,query_timeout:QUERY_MS,
   ssl:hyper||local?undefined:{rejectUnauthorized:false}});
  c.on('error',e=>console.error('pg client error',e.message));
  try{await c.connect();return c}
  catch(e){
   await close(c);
   if(attempt>=1)throw e;
   console.warn('pg connect failed, retrying once',(e as Error).message);
   await sleep(200);
  }
 }
}

// One connection for everything inside fn (use for routes that run several queries).
export async function withConn<T>(fn:(c:Conn)=>Promise<T>):Promise<T>{
 const c=await open();
 try{return await fn(c)}finally{await close(c)}
}

export const q=<T extends QueryResultRow>(text:string,params:unknown[]=[]):Promise<T[]>=>
 withConn(c=>c.query<T>(text,params).then(r=>r.rows));

export const tx=<T>(fn:(c:Conn)=>Promise<T>):Promise<T>=>withConn(async c=>{
 await c.query('begin; set local statement_timeout=8000; set local lock_timeout=5000');
 try{const r=await fn(c);await c.query('commit');return r}
 catch(e){await Promise.race([c.query('rollback').catch(()=>{}),sleep(2000)]);throw e}
});