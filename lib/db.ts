import {Pool,PoolClient,QueryResultRow} from 'pg';
import {createHash} from 'crypto';

type G={__pg?:Pool;__pgReady?:Promise<void>;__pgSchema?:string;__pgFailAt?:number};
const g=globalThis as unknown as G;
const url=process.env.DATABASE_URL;
const FAIL_COOLDOWN_MS=30_000; // after a failed connect, don't retry for 30s (protects the pooler's auth circuit breaker)

export const pool=g.__pg??(g.__pg=(()=>{
 const p=new Pool({
  connectionString:url,max:5,idleTimeoutMillis:10_000,connectionTimeoutMillis:8_000,
  ssl:!url||/localhost|127\.0\.0\.1/.test(url)?undefined:{rejectUnauthorized:false}});
 p.on('error',e=>console.error('pg idle client error',e.message)); // a dropped idle connection must not crash the process
 return p;
})());

const SCHEMA=`
create sequence if not exists order_no_seq start 1042;
create table if not exists orders(
 no integer primary key default nextval('order_no_seq'),
 idem_key text not null unique,
 phone text not null,
 items jsonb not null,
 total integer not null,
 notes text not null default '',
 pickup text not null default 'ASAP',
 status text not null default 'PENDING_PAYMENT'
  check(status in('PENDING_PAYMENT','PAID','PREPARING','READY','COMPLETED','CANCELLED','PAYMENT_FAILED')),
 receipt text unique,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 pay_start timestamptz not null default now(),
 paid_at timestamptz,
 preparing_at timestamptz,
 ready_at timestamptz,
 completed_at timestamptz
);
alter table orders add column if not exists accepted_at timestamptz;
create index if not exists orders_status_idx on orders(status);
create table if not exists checkouts(
 checkout_id text primary key,
 order_no integer not null references orders(no),
 at timestamptz not null default now()
);
create table if not exists order_events(
 id bigserial primary key,
 order_no integer not null references orders(no),
 from_status text,
 to_status text not null,
 actor text not null default 'system',
 at timestamptz not null default now()
);
create index if not exists order_events_no_idx on order_events(order_no);
create table if not exists payment_orphans(
 id bigserial primary key,
 checkout_id text,
 receipt text,
 raw jsonb,
 at timestamptz not null default now()
);`;
const SCHEMA_ID=createHash('sha1').update(SCHEMA).digest('hex');

async function migrate(){
 if(!url)throw new Error('DATABASE_URL is not set');
 const c=await pool.connect();
 try{await c.query('begin');await c.query('select pg_advisory_xact_lock(7421)');await c.query(SCHEMA);await c.query('commit')}
 catch(e){await c.query('rollback').catch(()=>{});throw e}
 finally{c.release()}
}

const ready=():Promise<void>=>{
 // schema text changed (e.g. after a hot reload): forget the old "already migrated" result
 if(g.__pgSchema!==SCHEMA_ID){g.__pgSchema=SCHEMA_ID;g.__pgReady=undefined;g.__pgFailAt=undefined}
 if(g.__pgReady)return g.__pgReady;
 if(Date.now()-(g.__pgFailAt??0)<FAIL_COOLDOWN_MS)return Promise.reject(new Error('Database unavailable, retrying shortly'));
 return g.__pgReady=migrate().catch(e=>{
  console.error('database migration failed',e);
  g.__pgReady=undefined;g.__pgFailAt=Date.now();
  throw e;
 });
};

export async function q<T extends QueryResultRow>(text:string,params:unknown[]=[]):Promise<T[]>{
 await ready();return (await pool.query<T>(text,params)).rows;
}
export async function tx<T>(fn:(c:PoolClient)=>Promise<T>):Promise<T>{
 await ready();const c=await pool.connect();
 try{await c.query('begin');const r=await fn(c);await c.query('commit');return r}
 catch(e){await c.query('rollback').catch(()=>{});throw e}
 finally{c.release()}
}