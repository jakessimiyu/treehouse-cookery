import pg from 'pg';
import {readFileSync} from 'node:fs';
const url=process.env.MIGRATE_DATABASE_URL||process.env.DATABASE_URL;
if(!url){console.error('Set DATABASE_URL (or MIGRATE_DATABASE_URL)');process.exit(1)}
const c=new pg.Client({connectionString:url,ssl:/localhost|127\.0\.0\.1/.test(url)?undefined:{rejectUnauthorized:false}});
await c.connect();
try{
 await c.query('begin');
 await c.query("set local lock_timeout='5s'"); // fail fast instead of queueing behind live traffic
 await c.query('select pg_advisory_xact_lock(7421)');
 await c.query(readFileSync(new URL('../db/schema.sql',import.meta.url),'utf8'));
 await c.query('commit');
 console.log('schema ok');
}catch(e){await c.query('rollback').catch(()=>{});console.error(e);process.exitCode=1}
finally{await c.end()}