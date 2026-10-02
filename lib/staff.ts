import {timingSafeEqual} from 'crypto';

const same=(a:string,b:string)=>{
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length&&timingSafeEqual(x,y);
};

// Accepts the key from a header (normal calls) or ?key= (the live stream, since browsers can't set headers on EventSource).
export function staffOk(req:Request){
 const expected=process.env.STAFF_KEY||'';
 if(expected.length<8)return false; // refuse to run with a missing or weak key
 const h=req.headers.get('x-staff-key')||(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 const k=h||new URL(req.url).searchParams.get('key')||'';
 return k.length>0&&same(k,expected);
}