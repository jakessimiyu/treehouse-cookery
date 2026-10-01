export const SLOTS=Array.from({length:24},(_,i)=>{const m=600+i*30;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}); // 10:00 to 21:30
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi'}).format(new Date());
export const addDays=(d:string,n:number)=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
export const mins=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3));
export const nowMin=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Nairobi',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
 const g=(t:string)=>Number(p.find(x=>x.type===t)?.value);return (g('hour')%24)*60+g('minute')};