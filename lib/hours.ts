import {HOURS} from '@/components/config';

export type Mode='auto'|'open'|'closed';
export type Hours=([number,number]|null)[];
export const DEFAULT_HOURS:Hours=HOURS;

export const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const fh=(h:number)=>{const x=((h%24)+24)%24;return `${x%12||12}${x<12?'am':'pm'}`};

// the day of the week and minutes since midnight, in Nairobi time
export function nairobiNow(){
 const p=new Intl.DateTimeFormat('en-US',{weekday:'short',hour:'numeric',minute:'numeric',hour12:false,timeZone:'Africa/Nairobi'}).formatToParts(new Date());
 const get=(t:string)=>p.find(x=>x.type===t)?.value||'';
 return{day:Math.max(0,SHORT.indexOf(get('weekday'))),min:(Number(get('hour'))%24)*60+Number(get('minute'))};
}

export function inHours(hours:Hours,day:number,min:number){
 const h=hours[day];
 return !!h&&min>=h[0]*60&&min<h[1]*60;
}

// "opens 12pm" / "opens tomorrow 12pm" / "opens Monday 12pm"
function nextOpen(hours:Hours,day:number,min:number){
 for(let i=0;i<8;i++){
  const d=(day+i)%7,h=hours[d];
  if(!h)continue;
  if(i===0&&min>=h[0]*60)continue; // today's opening time has already passed
  return i===0?`opens ${fh(h[0])}`:i===1?`opens tomorrow ${fh(h[0])}`:`opens ${DAY_NAMES[d]} ${fh(h[0])}`;
 }
 return '';
}

// the text and open/closed flag shown on the website
export function shopText(mode:Mode,note:string,hours:Hours=DEFAULT_HOURS){
 const {day,min}=nairobiNow();
 const inside=inHours(hours,day,min);
 const open=mode==='open'?true:mode==='closed'?false:inside;
 let text:string;
 if(open){
  const h=hours[day];
  text=inside&&h?`Open now · until ${fh(h[1])}`:'Open now';
 }else if(mode==='closed'){
  text=note?`Closed · ${note}`:'Closed for now';
 }else{
  const n=nextOpen(hours,day,min);
  text=n?`Closed · ${n}`:'Closed';
 }
 return{open,text};
}

// accepts only a valid week: 7 days, each null (closed) or [open 0-23, close 1-24] with close after open
export function cleanHours(x:unknown):Hours|null{
 if(!Array.isArray(x)||x.length!==7)return null;
 const out:Hours=[];
 for(const d of x){
  if(d===null){out.push(null);continue}
  if(!Array.isArray(d)||d.length!==2)return null;
  const [o,c]=d;
  if(!Number.isInteger(o)||!Number.isInteger(c)||o<0||o>23||c<1||c>24||c<=o)return null;
  out.push([o,c]);
 }
 return out;
}