export type Kind='reservations'|'catering';
export type Lead={id:number;ref:string;status:string;createdAt:number;data:Record<string,string|number>};
type S={reservations:Lead[];catering:Lead[];hits:Record<string,number[]>};
const g=globalThis as unknown as {__th_leads?:S};
export const L:S=(g.__th_leads??={reservations:[],catering:[],hits:{}});
export const STATUS:Record<Kind,string[]>={reservations:['NEW','CONFIRMED','COMPLETED','CANCELLED'],catering:['NEW','QUOTED','CONFIRMED','DONE','DECLINED']};
export const CAPACITY=40; // EDIT: seats available per 30-minute slot
import {EVENT_TYPES} from './catering';export {EVENT_TYPES};
export const booked=(date:string,time:string)=>L.reservations.filter(l=>l.status!=='CANCELLED'&&l.data.date===date&&l.data.time===time).reduce((a,l)=>a+Number(l.data.guests),0);
export function limited(ip:string){const now=Date.now();const h=(L.hits[ip]||[]).filter(t=>now-t<3600000);h.push(now);L.hits[ip]=h;return h.length>8}