import {HOURS} from '@/components/config';

export type Mode='auto'|'open'|'closed';

const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fh=(h:number)=>`${h%12||12}${h<12?'am':'pm'}`;

// the day of the week and minutes since midnight, in Nairobi time
export function nairobiNow(){
 const p=new Intl.DateTimeFormat('en-US',{weekday:'short',hour:'numeric',minute:'numeric',hour12:false,timeZone:'Africa/Nairobi'}).formatToParts(new Date());
 const get=(t:string)=>p.find(x=>x.type===t)?.value||'';
 return{day:Math.max(0,SHORT.indexOf(get('weekday'))),min:(Number(get('hour'))%24)*60+Number(get('minute'))};
}

export function inHours(day:number,min:number){
 const h=HOURS[day];
 return !!h&&min>=h[0]*60&&min<h[1]*60;
}

// "opens 12pm" / "opens tomorrow 12pm" / "opens Monday 12pm"
function nextOpen(day:number,min:number){
 for(let i=0;i<8;i++){
  const d=(day+i)%7,h=HOURS[d];
  if(!h)continue;
  if(i===0&&min>=h[0]*60)continue; // today's opening time has already passed
  return i===0?`opens ${fh(h[0])}`:i===1?`opens tomorrow ${fh(h[0])}`:`opens ${DAY_NAMES[d]} ${fh(h[0])}`;
 }
 return '';
}

// the text and open/closed flag shown on the website
export function shopText(mode:Mode,note:string){
 const {day,min}=nairobiNow();
 const hours=inHours(day,min);
 const open=mode==='open'?true:mode==='closed'?false:hours;
 let text:string;
 if(open){
  const h=HOURS[day];
  text=hours&&h?`Open now · until ${fh(h[1])}`:'Open now';
 }else if(mode==='closed'){
  text=note?`Closed · ${note}`:'Closed for now';
 }else{
  const n=nextOpen(day,min);
  text=n?`Closed · ${n}`:'Closed';
 }
 return{open,text};
}