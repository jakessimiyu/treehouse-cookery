'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Logo from '@/components/Logo';

type Line={id:string;name:string;qty:number;price:number};
type Live={no:number;status:string;items:Line[];total:number;pickup:string;paidAt:number|null;acceptedAt:number|null;preparingAt:number|null;readyAt:number|null};
type Recent={no:number;status:string;items:Line[];total:number;pickup:string;createdAt:number};
type Stats={serverTime:number;since:number;today:{orders:number;revenue:number};yesterday:{orders:number;revenue:number};
 statuses:Record<string,number>;cookSec:number;totalSec:number;readyCount:number;served:number;
 hourly:{h:number;n:number;revenue:number}[];top:{name:string;qty:number;revenue:number}[];live:Live[];recent:Recent[]};
type MI={id:string;name:string;cat:string;price:number;emoji:string;soldOut:boolean;desc:string;tags:string[];ing:string[];img:number;removed:boolean};
type Form={name:string;desc:string;price:number;cat:string;tags:string[];ing:string[]};
type Day=[number,number]|null;
type Hours=Day[];
type Shop={mode:'auto'|'open'|'closed';note:string;open:boolean;text:string;hours:Hours;custom:boolean};
type Lead={id:number;ref:string;status:string;createdAt:number;data:Record<string,string|number>};
type Kind='reservations'|'catering';
type Tab='overview'|'menu'|'restaurant'|'reservations'|'catering';

const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ORDER=[1,2,3,4,5,6,0]; // show Monday first
const ST:Record<Kind,string[]>={reservations:['NEW','CONFIRMED','COMPLETED','CANCELLED'],catering:['NEW','QUOTED','CONFIRMED','DONE','DECLINED']};
const FINISHED=['COMPLETED','CANCELLED','DONE','DECLINED'];
const LEAD_TONE:Record<string,string>={NEW:'amber',QUOTED:'blue',CONFIRMED:'green',COMPLETED:'grey',DONE:'grey',CANCELLED:'dim',DECLINED:'dim'};
const LEAD_LABEL:Record<string,string>={NEW:'New',QUOTED:'Quoted',CONFIRMED:'Confirmed',COMPLETED:'Completed',DONE:'Done',CANCELLED:'Cancelled',DECLINED:'Declined'};
// the same categories and moods the website's menu and home pages are built around
const CATS=['Chicken','Chips','Shawarma','Burgers','Biryani','Snacks','Drinks','Combos'];
const TAGS=['crispy','spicy','cheesy','filling','quick','sweet'];
const kes=(n:number)=>'KSh '+Math.round(n).toLocaleString();
const clock=(ms:number)=>new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'Africa/Nairobi'})
 .replace(/\s?([AP])M/i,(_,x:string)=>' '+x.toLowerCase()+'m');
const dayTime=(ms:number)=>new Date(ms).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Nairobi'});
const dur=(ms:number)=>{const s=Math.max(0,Math.round(ms/1000));if(s<60)return s+'s';const m=Math.floor(s/60);
 if(m<60)return m+' min';return `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`};
const fh=(h:number)=>{const x=((h%24)+24)%24;return `${x%12||12}${x<12?'am':'pm'}`};
const lines=(items:Line[])=>items.map(i=>`${i.qty}× ${i.name}`).join(', ');
const LABEL:Record<string,string>={PENDING_PAYMENT:'Awaiting payment',PAID:'Paid',PREPARING:'Cooking',READY:'Ready',COMPLETED:'Done',CANCELLED:'Cancelled',PAYMENT_FAILED:'Payment failed'};
const TONE:Record<string,string>={PENDING_PAYMENT:'amber',PAID:'red',PREPARING:'blue',READY:'green',COMPLETED:'grey',CANCELLED:'grey',PAYMENT_FAILED:'grey'};
const str=(v:string|number|undefined)=>v===undefined||v===null||v===''?'':String(v);
const stat=(id:string)=>`/${encodeURIComponent(id.replace(/-/g,' '))}.webp`;

// Shrinks a phone photo before upload: honours the camera's rotation, caps the size, prefers WebP.
async function shrink(file:File):Promise<Blob>{
 let bmp:ImageBitmap;
 try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'})}
 catch{throw new Error('Could not read that photo. Try a JPG or PNG.')}
 const k=Math.min(1,1400/Math.max(bmp.width,bmp.height));
 const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
 const x=c.getContext('2d');if(!x)throw new Error('This browser cannot prepare photos.');
 x.drawImage(bmp,0,0,c.width,c.height);bmp.close();
 const out=(t:string)=>new Promise<Blob|null>(r=>c.toBlob(r,t,.85));
 let b=await out('image/webp');
 if(!b||b.type!=='image/webp')b=await out('image/jpeg');
 if(!b)throw new Error('Could not prepare the photo.');
 return b;
}

const CSS=`
.ad{position:fixed;inset:0;z-index:60;overflow-y:auto;overscroll-behavior:contain;background:#f4f5f7;color:#14181f;
 font-family:var(--body),system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;
 --ink:#14181f;--mut:#5b6573;--line:#e4e7ec;--red:#dc2626;--green:#16a34a;--amber:#d97706;--blue:#0284c7}
.ad *{box-sizing:border-box;min-width:0}
.ad button{font-family:inherit;cursor:pointer}
.ad button:focus-visible,.ad select:focus-visible,.ad input:focus-visible,.ad textarea:focus-visible,.ad a:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
.ad-head{position:sticky;top:0;z-index:10;background:#000;color:#fff;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.ad-head-in{max-width:1240px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.ad-brand{display:flex;align-items:center;gap:12px}
.ad-brand b{display:block;font-family:var(--display),Georgia,serif;font-size:22px;font-weight:400;line-height:1.1}
.ad-brand small{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#9ca3af}
.ad-head-r{display:flex;align-items:center;gap:12px}
.ad-clock{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums}
.ad-pill{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:8px 16px;font-size:15px;font-weight:700;background:#2a2f37;color:#fff}
.ad-pill i{width:10px;height:10px;border-radius:50%;background:#9ca3af}
.ad-pill.open{background:#14532d}.ad-pill.open i{background:#4ade80;box-shadow:0 0 0 4px rgba(74,222,128,.25)}
.ad-pill.closed{background:#7f1d1d}.ad-pill.closed i{background:#fca5a5}
.ad-tabs{max-width:1240px;margin:0 auto;padding:0 10px;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
.ad-tabs::-webkit-scrollbar{display:none}
.ad-tab{border:0;background:none;color:#9ca3af;font-size:16px;font-weight:700;padding:13px 18px;border-bottom:3px solid transparent;white-space:nowrap;display:flex;align-items:center;gap:8px}
.ad-tab.on{color:#fff;border-bottom-color:var(--red)}
.ad-tab em{font-style:normal;background:var(--red);color:#fff;border-radius:999px;font-size:12px;padding:2px 8px}
.ad-wrap{max-width:1240px;margin:0 auto;padding:16px 16px 90px;display:flex;flex-direction:column;gap:16px}
.ad-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 1px 2px rgba(20,24,31,.04)}
.ad-h{margin:0 0 14px;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px}
.ad-h small{font-size:13px;font-weight:600;color:var(--mut)}
.ad-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.ad-kpi{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px}
.ad-kpi span{display:block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.ad-kpi b{display:block;font-size:30px;line-height:1.15;margin:6px 0 2px;font-variant-numeric:tabular-nums}
.ad-kpi small{font-size:14px;color:var(--mut)}
.ad-kpi.hero{background:#14181f;border-color:#14181f;color:#fff}.ad-kpi.hero span,.ad-kpi.hero small{color:#aab2bd}
.ad-up{color:#4ade80}.ad-warn{color:var(--red)}
.ad-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px}
.ad-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ad-live{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ad-lcol h3{margin:0 0 8px;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:800;color:var(--mut);letter-spacing:.06em;text-transform:uppercase}
.ad-lcol h3 b{min-width:28px;text-align:center;border-radius:999px;color:#fff;font-size:14px;padding:2px 8px}
.ad-lcol.red h3 b{background:var(--red)}.ad-lcol.blue h3 b{background:var(--blue)}.ad-lcol.green h3 b{background:var(--green)}
.ad-lrow{border:1px solid var(--line);border-left:5px solid #94a3b8;border-radius:12px;padding:10px 12px;margin-bottom:8px;background:#fafbfc}
.ad-lcol.red .ad-lrow{border-left-color:var(--red)}.ad-lcol.blue .ad-lrow{border-left-color:var(--blue)}.ad-lcol.green .ad-lrow{border-left-color:var(--green)}
.ad-lrow.late{background:#fef2f2;border-color:#fca5a5}
.ad-lrow div{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.ad-lrow b{font-size:18px}.ad-lrow time{font-size:14px;font-weight:800;color:var(--mut);font-variant-numeric:tabular-nums}
.ad-lrow.late time{color:var(--red)}
.ad-lrow p{margin:4px 0 0;font-size:14px;color:#374151;line-height:1.35;overflow-wrap:anywhere}
.ad-none{padding:14px 4px;font-size:15px;color:#8b94a1}
.ad-chart{display:flex;align-items:flex-end;gap:6px;height:170px;padding-top:8px}
.ad-col{flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px}
.ad-bar{width:100%;max-width:34px;border-radius:8px 8px 3px 3px;background:#cbd2da;min-height:3px;transition:height .4s ease}
.ad-col.now .ad-bar{background:var(--red)}.ad-col.has .ad-bar{background:#14181f}.ad-col.now.has .ad-bar{background:var(--red)}
.ad-col small{font-size:11px;color:var(--mut)}.ad-col .n{font-size:12px;font-weight:800;min-height:15px}
.ad-top{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.ad-top li div{display:flex;justify-content:space-between;gap:8px;font-size:15px;font-weight:700}
.ad-top li small{display:block;color:var(--mut);font-weight:500}
.ad-meter{height:8px;border-radius:99px;background:#eceff3;margin-top:6px;overflow:hidden}
.ad-meter i{display:block;height:100%;background:var(--red);border-radius:99px;transition:width .4s ease}
.ad-log{display:flex;flex-direction:column}
.ad-lg{display:grid;grid-template-columns:70px 78px minmax(0,1fr) 100px 130px;gap:10px;align-items:center;padding:11px 4px;border-top:1px solid var(--line);font-size:15px}
.ad-lg:first-child{border-top:0}
.ad-lg .no{font-weight:800}.ad-lg .it{color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ad-lg .tt{font-weight:700;text-align:right}
.ad-chip{display:inline-block;text-align:center;border-radius:999px;font-size:13px;font-weight:800;padding:5px 12px;background:#e5e8ed;color:#334155}
.ad-chip.red{background:#fee2e2;color:#991b1b}.ad-chip.blue{background:#e0f2fe;color:#075985}.ad-chip.green{background:#dcfce7;color:#166534}.ad-chip.amber{background:#fef3c7;color:#92400e}.ad-chip.dim{background:#f1f2f4;color:#6b7482}
.ad-sum{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ad-sumchip{border-radius:999px;font-size:15px;font-weight:800;padding:8px 16px}
.ad-sumchip.in{background:#dcfce7;color:#166534}.ad-sumchip.out{background:#fee2e2;color:#991b1b}.ad-sumchip.gone{background:#e5e8ed;color:#334155}
.ad-tools{display:flex;gap:10px;flex-wrap:wrap}
.ad-q{flex:1 1 220px;padding:13px 14px;border-radius:12px;border:2px solid #cbd2da;font-size:16px;background:#fff;color:var(--ink)}
.ad-reset{border:2px solid #cbd2da;background:#fff;color:var(--ink);border-radius:12px;font-size:15px;font-weight:700;padding:0 18px;min-height:48px}
.ad-reset.sure{background:var(--red);border-color:var(--red);color:#fff}.ad-reset:disabled{opacity:.45}
.ad-cat{margin:18px 0 8px;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.ad-m{display:flex;align-items:center;gap:12px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:8px;transition:background .2s,border-color .2s}
.ad-m.out{background:#fef2f2;border-color:#fca5a5}
.ad-m .nm{flex:1 1 auto}
.ad-m .nm b{display:block;font-size:18px;line-height:1.25;overflow-wrap:anywhere}.ad-m.out .nm b{color:#7f1d1d;text-decoration:line-through}
.ad-m .nm small{color:var(--mut);font-size:14px}
.ad-badge{flex:none;border-radius:999px;font-size:13px;font-weight:800;padding:6px 12px}
.ad-badge.in{background:#dcfce7;color:#166534}.ad-badge.out{background:#fee2e2;color:#991b1b}
.ad-act{flex:none;min-width:148px;min-height:50px;border:0;border-radius:12px;font-size:16px;font-weight:800;color:#fff;padding:0 14px}
.ad-act.sold{background:var(--red)}.ad-act.avail{background:var(--green)}.ad-act:disabled{opacity:.5}
/* menu editor */
.ad-th{flex:none;width:56px;height:56px;border-radius:12px;background:#eceff3;overflow:hidden;display:grid;place-items:center;font-size:26px}
.ad-th img,.ad-ed-pic img{width:100%;height:100%;object-fit:cover;display:block}
.ad-m.out .ad-th{opacity:.55}
.ad-item{margin-bottom:8px}.ad-item .ad-m{margin-bottom:0}
.ad-ed-btn{flex:none;min-height:50px;border:2px solid #cbd2da;border-radius:12px;background:#fff;color:var(--ink);font-size:16px;font-weight:800;padding:0 18px}
.ad-ed-btn.on{background:#14181f;border-color:#14181f;color:#fff}
.ad-add{flex:none;min-height:48px;border:0;border-radius:12px;background:var(--red);color:#fff;font-size:16px;font-weight:800;padding:0 20px}
.ad-ed{display:grid;grid-template-columns:210px minmax(0,1fr);gap:20px;background:#fff;border:2px solid #14181f;border-radius:16px;padding:18px;margin:8px 0 14px}
.ad-ed-ph{display:flex;flex-direction:column;gap:10px}
.ad-ed-pic{aspect-ratio:1/1;border-radius:14px;background:#eceff3;overflow:hidden;display:grid;place-items:center;color:#8b94a1;font-size:14px;font-weight:600;text-align:center;padding:8px}
.ad-ed-f{display:flex;flex-direction:column;gap:14px}
.ad-fl{display:flex;flex-direction:column;gap:6px}
.ad-fl>span,.ad-lbl{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);display:flex;justify-content:space-between;gap:8px}
.ad-fl input,.ad-fl select,.ad-fl textarea{width:100%;padding:12px 13px;border-radius:12px;border:2px solid #cbd2da;font-size:16px;font-family:inherit;background:#fff;color:var(--ink)}
.ad-fl textarea{resize:vertical;min-height:76px;line-height:1.4}
.ad-fl2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ad-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.ad-chipx{display:inline-flex;align-items:center;gap:6px;border:2px solid #cbd2da;border-radius:999px;background:#fff;color:#374151;font-size:14px;font-weight:700;padding:6px 12px;min-height:38px}
.ad-chipx.on{background:#14181f;border-color:#14181f;color:#fff}
.ad-chipx b{font-size:16px;line-height:1;opacity:.7}
.ad-ing-in{flex:1 1 150px;min-width:120px;padding:8px 14px;border-radius:999px;border:2px dashed #cbd2da;font-size:15px;background:#fff;color:var(--ink);min-height:38px;font-family:inherit}
.ad-ed-foot{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px}
.ad-ed-foot .sp{flex:1 1 auto}
.ad-danger{border:2px solid #fca5a5;background:#fff;color:#991b1b;border-radius:12px;font-size:15px;font-weight:800;padding:0 16px;min-height:48px}
.ad-danger.sure{background:var(--red);border-color:var(--red);color:#fff}
.ad-rem{margin-top:22px;border-top:1px solid var(--line);padding-top:14px}
.ad-rem summary{cursor:pointer;font-weight:800;font-size:15px;color:var(--mut);min-height:36px}
.ad-rem .ad-m{margin-top:8px;opacity:.85}
.ad-big{display:flex;align-items:center;gap:14px;border-radius:16px;padding:16px 18px;margin-bottom:14px}
.ad-big i{width:16px;height:16px;border-radius:50%;flex:none}
.ad-big b{display:block;font-size:26px;line-height:1.1}.ad-big small{font-size:15px}
.ad-big.open{background:#dcfce7;color:#14532d}.ad-big.open i{background:var(--green);box-shadow:0 0 0 6px rgba(22,163,74,.2)}
.ad-big.closed{background:#fee2e2;color:#7f1d1d}.ad-big.closed i{background:var(--red)}
.ad-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ad-mode{border:2px solid #cbd2da;border-radius:14px;background:#fff;color:var(--ink);padding:12px 8px;min-height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}
.ad-mode b{font-size:17px}.ad-mode small{font-size:12px;color:var(--mut)}
.ad-mode.auto.on{background:#14181f;border-color:#14181f;color:#fff}
.ad-mode.open.on{background:var(--green);border-color:var(--green);color:#fff}
.ad-mode.closed.on{background:var(--red);border-color:var(--red);color:#fff}
.ad-mode.on small{color:rgba(255,255,255,.8)}
.ad-note{display:flex;gap:8px;margin-top:14px}
.ad-note input{flex:1 1 auto;padding:13px;border-radius:12px;border:2px solid #cbd2da;font-size:16px;background:#fff;color:var(--ink)}
.ad-btn{border:0;border-radius:12px;background:#14181f;color:#fff;font-size:16px;font-weight:700;padding:0 20px;min-height:48px}
.ad-btn:disabled{opacity:.4}.ad-btn.ghost{background:#fff;color:var(--ink);border:2px solid #cbd2da}
.ad-hint{margin:12px 0 0;font-size:14px;line-height:1.45;color:var(--mut)}
.ad-day{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)}
.ad-day:first-of-type{border-top:0}
.ad-dn{display:flex;align-items:center;gap:10px;flex:none;width:150px}
.ad-dn b{font-size:16px}
.ad-tg{flex:none;min-width:70px;min-height:38px;border:0;border-radius:999px;font-size:14px;font-weight:800;color:#fff;padding:0 12px}
.ad-tg.on{background:var(--green)}.ad-tg.off{background:#9ca3af}
.ad-times{display:flex;align-items:center;gap:8px;font-size:15px;color:var(--mut)}
.ad-sel{min-height:44px;border:2px solid #cbd2da;border-radius:10px;background:#fff;color:var(--ink);font-size:16px;font-weight:700;padding:0 8px}
.ad-off{font-size:15px;color:#8b94a1}
.ad-hrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
/* reservations and catering */
.ad-filter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.ad-fb{border:2px solid #cbd2da;background:#fff;color:var(--ink);border-radius:999px;font-size:15px;font-weight:700;padding:9px 18px}
.ad-fb.on{background:#14181f;border-color:#14181f;color:#fff}
.ad-leads{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.ad-lead{border:1px solid var(--line);border-left:6px solid #94a3b8;border-radius:16px;background:#fff;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 2px rgba(20,24,31,.04)}
.ad-lead.amber{border-left-color:var(--amber);box-shadow:0 0 0 2px #fde68a}
.ad-lead.blue{border-left-color:var(--blue)}.ad-lead.green{border-left-color:var(--green)}
.ad-lead.dim{opacity:.72}
.ad-lead-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ad-lead-top b{font-size:17px}.ad-lead-top small{display:block;font-size:13px;color:var(--mut);margin-top:2px}
.ad-lead h3{margin:0;font-size:22px;line-height:1.2}
.ad-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}
.ad-fact{background:#f4f5f7;border-radius:10px;padding:8px 10px}
.ad-fact span{display:block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.ad-fact b{display:block;font-size:16px;margin-top:2px}
.ad-contact{display:flex;flex-direction:column;gap:6px;font-size:16px}
.ad-contact strong{font-size:18px}
.ad-contact a{color:#1d4ed8;font-weight:700;text-decoration:none;overflow-wrap:anywhere}
.ad-call{display:inline-flex;align-items:center;justify-content:center;min-height:46px;border-radius:12px;background:#14181f;color:#fff !important;padding:0 18px;width:fit-content}
.ad-text{margin:0;font-size:15px;line-height:1.45;color:#374151;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;overflow-wrap:anywhere}
.ad-text b{display:block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#92400e;margin-bottom:2px}
.ad-sts{display:flex;gap:6px;flex-wrap:wrap}
.ad-st{flex:1 1 auto;min-height:44px;border:2px solid #cbd2da;border-radius:10px;background:#fff;color:#374151;font-size:14px;font-weight:700;padding:0 10px}
.ad-st.on.amber{background:#fef3c7;border-color:var(--amber);color:#92400e}
.ad-st.on.blue{background:#e0f2fe;border-color:var(--blue);color:#075985}
.ad-st.on.green{background:var(--green);border-color:var(--green);color:#fff}
.ad-st.on.grey{background:#14181f;border-color:#14181f;color:#fff}
.ad-st.on.dim{background:#6b7482;border-color:#6b7482;color:#fff}
.ad-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:80;background:#14181f;color:#fff;border-radius:999px;padding:14px 24px;font-size:16px;font-weight:700;box-shadow:0 8px 30px rgba(0,0,0,.3);max-width:calc(100% - 24px)}
.ad-gate{display:grid;place-items:center;padding:20px}
.ad-gate form{width:min(420px,100%);display:flex;flex-direction:column;gap:14px}
.ad-gate .badge{background:#000;border-radius:20px;padding:10px;margin:0 auto;line-height:0}
.ad-gate h1{margin:0;font-family:var(--display),Georgia,serif;font-size:34px;text-align:center}
.ad-gate p{margin:0;color:var(--mut);font-size:16px;text-align:center;line-height:1.4}
.ad-gate input{padding:16px;border-radius:12px;border:2px solid #cbd2da;font-size:18px;background:#fff;color:var(--ink)}
.ad-gate .err{color:#b91c1c;font-weight:700}
.ad-gate .go{min-height:58px;font-size:20px;font-weight:800;border:0;border-radius:14px;background:var(--red);color:#fff}
@media (max-width:980px){.ad-grid,.ad-grid2{grid-template-columns:1fr}}
@media (max-width:760px){
 .ad-live{grid-template-columns:1fr}
 .ad-lg{grid-template-columns:56px 1fr auto;grid-template-areas:"no it tt" "tm tm st";row-gap:4px}
 .ad-lg .no{grid-area:no}.ad-lg .it{grid-area:it;white-space:normal}.ad-lg .tt{grid-area:tt}
 .ad-lg .tm{grid-area:tm;color:var(--mut);font-size:13px}.ad-lg .st{grid-area:st;text-align:right}
 .ad-m{flex-wrap:wrap}.ad-act{min-width:0;flex:1 1 40%}.ad-ed-btn{flex:1 1 40%}
 .ad-ed{grid-template-columns:1fr;padding:14px}.ad-ed-ph{flex-direction:row;align-items:center;flex-wrap:wrap}.ad-ed-pic{width:110px;flex:none}
 .ad-modes{grid-template-columns:1fr}.ad-mode{flex-direction:row;justify-content:flex-start;gap:12px;min-height:64px;padding:10px 14px}
 .ad-day{flex-wrap:wrap}.ad-dn{width:auto}
 .ad-kpi b{font-size:26px}
 .ad-leads{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.ad *{transition:none !important}}
`;

// A dish photo: the uploaded one if there is one, then the file in /public, then the dish's emoji.
function Thumb({m}:{m:{id:string;img:number;emoji:string}}){
 const srcs=m.img>0?[`/api/img/${m.id}?v=${m.img}`,stat(m.id)]:[stat(m.id)];
 const [failed,setFailed]=useState(0);
 useEffect(()=>{setFailed(0)},[m.id,m.img]);
 const src=srcs[failed];
 return src
  // eslint-disable-next-line @next/next/no-img-element
  ?<img key={src} src={src} alt="" loading="lazy" onError={()=>setFailed(n=>n+1)}/>
  :<span aria-hidden>{m.emoji||'🍽️'}</span>;
}

// Add or edit one dish. Lives at module level so typing never loses focus when the page refreshes.
function DishEditor({item,onSave,onCancel,onRemove,onError}:{
 item:MI|null;onSave:(f:Form,file:File|null)=>Promise<boolean>;onCancel:()=>void;onRemove?:(m:MI)=>void;onError:(t:string)=>void}){
 const [name,setName]=useState(item?.name||'');
 const [price,setPrice]=useState(item?String(item.price):'');
 const [cat,setCat]=useState(item?.cat||'');
 const [desc,setDesc]=useState(item?.desc||'');
 const [ing,setIng]=useState<string[]>(item?.ing||[]);
 const [ingIn,setIngIn]=useState('');
 const [tags,setTags]=useState<string[]>(item?.tags||[]);
 const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState('');
 const [saving,setSaving]=useState(false);const [sure,setSure]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);

 useEffect(()=>{
  if(!file){setPreview('');return}
  const u=URL.createObjectURL(file);setPreview(u);
  return()=>URL.revokeObjectURL(u);
 },[file]);

 const p=Number(price);
 const valid=name.trim().length>=2&&Number.isInteger(p)&&p>=1&&p<=100000&&!!cat;
 const changed=!item||name.trim()!==item.name||p!==item.price||cat!==item.cat||desc.trim()!==item.desc
  ||JSON.stringify(ing)!==JSON.stringify(item.ing)||JSON.stringify([...tags].sort())!==JSON.stringify([...item.tags].sort())
  ||!!file||!!ingIn.trim();

 const addIng=()=>{
  const v=ingIn.trim().replace(/,+$/,'').slice(0,40);
  if(!v)return;
  if(ing.length<8&&!ing.some(x=>x.toLowerCase()===v.toLowerCase()))setIng([...ing,v]);
  setIngIn('');
 };
 const pick=(f:File|undefined)=>{
  if(!f)return;
  if(!f.type.startsWith('image/')){onError('Please choose a photo (JPG, PNG or WebP).');return}
  if(f.size>25_000_000){onError('That photo is too large. Choose one under 25 MB.');return}
  setFile(f);
 };
 const submit=async()=>{
  if(!valid||saving)return;
  const v=ingIn.trim().replace(/,+$/,'').slice(0,40);
  const finalIng=v&&ing.length<8&&!ing.some(x=>x.toLowerCase()===v.toLowerCase())?[...ing,v]:ing;
  setSaving(true);
  const ok=await onSave({name:name.trim(),desc:desc.trim(),price:p,cat,tags,ing:finalIng},file);
  setSaving(false);
  if(ok&&item){setFile(null);setIngIn('');setIng(finalIng)}
 };

 return <div className="ad-ed">
  <div className="ad-ed-ph">
   <div className="ad-ed-pic">
    {preview
     // eslint-disable-next-line @next/next/no-img-element
     ?<img src={preview} alt="New photo preview"/>
     :item?<Thumb m={item}/>:<span>No photo yet</span>}
   </div>
   <div>
    <button type="button" className="ad-btn ghost" onClick={()=>fileRef.current?.click()}>{file||item?.img?'Change photo':'Add photo'}</button>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{pick(e.target.files?.[0]);e.target.value=''}}/>
    <p className="ad-hint" style={{marginTop:8}}>Any phone photo works. It is resized automatically.</p>
   </div>
  </div>
  <div className="ad-ed-f">
   <label className="ad-fl"><span>Dish name</span>
    <input value={name} maxLength={60} placeholder="e.g. Peri-Peri Wings" onChange={e=>setName(e.target.value)}/></label>
   <div className="ad-fl2">
    <label className="ad-fl"><span>Price (KSh)</span>
     <input inputMode="numeric" value={price} placeholder="450" onChange={e=>setPrice(e.target.value.replace(/\D/g,'').slice(0,6))}/></label>
    <label className="ad-fl"><span>Category</span>
     <select value={cat} onChange={e=>setCat(e.target.value)}>
      <option value="" disabled>Choose…</option>
      {CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
   </div>
   <label className="ad-fl"><span>Description <em style={{fontStyle:'normal',fontWeight:600}}>{desc.length}/140</em></span>
    <textarea value={desc} maxLength={140} placeholder="One line that makes people hungry" onChange={e=>setDesc(e.target.value)}/></label>
   <div>
    <div className="ad-lbl">Ingredients <span>{ing.length}/8</span></div>
    <div className="ad-chips">
     {ing.map(g=><button key={g} type="button" className="ad-chipx on" onClick={()=>setIng(ing.filter(x=>x!==g))} aria-label={'Remove '+g}>{g}<b aria-hidden>×</b></button>)}
     {ing.length<8&&<input className="ad-ing-in" value={ingIn} placeholder="Type one, press Enter" maxLength={40}
      onChange={e=>setIngIn(e.target.value)} onBlur={addIng}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addIng()}}}/>}
    </div>
   </div>
   <div>
    <div className="ad-lbl">Moods (so it shows up in &quot;What are you craving?&quot;)</div>
    <div className="ad-chips">
     {TAGS.map(t=><button key={t} type="button" aria-pressed={tags.includes(t)} className={'ad-chipx'+(tags.includes(t)?' on':'')}
      onClick={()=>setTags(tags.includes(t)?tags.filter(x=>x!==t):[...tags,t])}>{t[0].toUpperCase()+t.slice(1)}</button>)}
    </div>
   </div>
   <div className="ad-ed-foot">
    <button type="button" className="ad-btn" disabled={!valid||!changed||saving} onClick={submit}>{saving?'Saving…':item?'Save changes':'Add to menu'}</button>
    <button type="button" className="ad-btn ghost" disabled={saving} onClick={onCancel}>{item?'Close':'Cancel'}</button>
    <span className="sp"/>
    {item&&onRemove&&<button type="button" className={'ad-danger'+(sure?' sure':'')} disabled={saving}
     onClick={()=>{if(!sure){setSure(true);setTimeout(()=>setSure(false),3000);return}onRemove(item)}}>{sure?'Tap again to remove':'Remove dish'}</button>}
   </div>
  </div>
 </div>;
}

export default function Admin(){
 const [key,setKey]=useState('');const [keyIn,setKeyIn]=useState('');const [started,setStarted]=useState(false);const [authErr,setAuthErr]=useState('');
 const [stats,setStats]=useState<Stats|null>(null);const [statsAt,setStatsAt]=useState(0);
 const [shop,setShop]=useState<Shop|null>(null);const [menu,setMenu]=useState<MI[]>([]);
 const [res,setRes]=useState<Lead[]|null>(null);const [cat,setCat]=useState<Lead[]|null>(null);
 const [showAll,setShowAll]=useState<Record<Kind,boolean>>({reservations:false,catering:false});
 const [tab,setTab]=useState<Tab>('overview');const [now,setNow]=useState(0);
 const [toast,setToast]=useState('');const tt=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [menuQ,setMenuQ]=useState('');const [menuBusy,setMenuBusy]=useState<Record<string,boolean>>({});const [confirmReset,setConfirmReset]=useState(false);
 const [adding,setAdding]=useState(false);const [editing,setEditing]=useState<string|null>(null);
 const inflight=useRef(0),leadFlight=useRef(0);
 const [note,setNote]=useState('');const [noteEdit,setNoteEdit]=useState(false);
 const [draft,setDraft]=useState<Hours|null>(null);const [dirty,setDirty]=useState(false);

 useEffect(()=>{try{setKeyIn(localStorage.getItem('sk')||'')}catch{}},[]);
 const flash=useCallback((text:string)=>{setToast(text);clearTimeout(tt.current);tt.current=setTimeout(()=>setToast(''),4500)},[]);

 const loadStats=useCallback(async()=>{
  if(!key)return;
  try{
   const r=await fetch('/api/admin/stats',{headers:{'x-staff-key':key},cache:'no-store'});
   if(r.status===401){setAuthErr('That staff key was not accepted.');setStarted(false);return}
   if(!r.ok)return;
   setStats(await r.json());setStatsAt(Date.now());
  }catch{}
 },[key]);
 const loadShop=useCallback(async()=>{
  try{const r=await fetch('/api/shop',{cache:'no-store'});const j=await r.json();if(typeof j?.open==='boolean'&&Array.isArray(j.hours))setShop(j)}catch{}
 },[]);
 const loadMenu=useCallback(async()=>{
  if(!key||inflight.current>0)return; // don't overwrite a change that is still being saved
  try{
   const r=await fetch('/api/kitchen/menu?all=1',{headers:{'x-staff-key':key},cache:'no-store'});
   if(!r.ok)return;const j=await r.json();if(Array.isArray(j))setMenu(j);
  }catch{}
 },[key]);
 const loadLeads=useCallback(async()=>{
  if(!key||leadFlight.current>0)return; // don't overwrite a status that is still being saved
  const get=async(kind:Kind):Promise<Lead[]|null>=>{
   try{
    const r=await fetch(`/api/leads/${kind}`,{headers:{'x-staff-key':key},cache:'no-store'});
    if(!r.ok)return null;const j=await r.json();
    return Array.isArray(j)?(j as Lead[]).slice().sort((a,b)=>b.createdAt-a.createdAt):null;
   }catch{return null}
  };
  const [a,b]=await Promise.all([get('reservations'),get('catering')]);
  if(a)setRes(a);if(b)setCat(b);
 },[key]);

 useEffect(()=>{
  if(!started)return;
  const all=()=>{if(!document.hidden){loadStats();loadShop();loadMenu();loadLeads()}};
  all();
  const a=setInterval(()=>{if(!document.hidden)loadStats()},10000);
  const b=setInterval(()=>{if(!document.hidden){loadShop();loadMenu();loadLeads()}},15000);
  const c=setInterval(()=>setNow(Date.now()),1000);
  document.addEventListener('visibilitychange',all);
  return()=>{clearInterval(a);clearInterval(b);clearInterval(c);document.removeEventListener('visibilitychange',all)};
 },[started,loadStats,loadShop,loadMenu,loadLeads]);

 // keep the editable copies in step with the saved values, unless the owner is mid-edit
 useEffect(()=>{if(shop&&!dirty)setDraft(shop.hours.map(h=>h?[h[0],h[1]] as [number,number]:null))},[shop,dirty]);
 useEffect(()=>{if(shop&&!noteEdit)setNote(shop.note)},[shop,noteEdit]);

 const begin=()=>{
  const k=keyIn.trim();if(!k){setAuthErr('Enter the staff key.');return}
  try{localStorage.setItem('sk',k)}catch{}
  setAuthErr('');setKey(k);setNow(Date.now());setStarted(true);
 };

 // ---- restaurant: open / closed and weekly hours ----
 const post=(body:object)=>fetch('/api/shop',{method:'POST',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const saveMode=async(mode:'auto'|'open'|'closed',n:string=note)=>{
  try{
   const r=await post({mode,note:n.trim()});const j=await r.json().catch(()=>({}));
   if(r.ok&&typeof j?.open==='boolean'){setShop(j);setNoteEdit(false);flash(`Website now shows: ${j.text}`)}
   else flash('Could not change the status. Nothing was changed.');
  }catch{flash('No connection. Nothing was changed.')}
 };
 const saveHours=async(h:Hours|null)=>{
  try{
   const r=await post({hours:h});const j=await r.json().catch(()=>({}));
   if(r.ok&&typeof j?.open==='boolean'){setShop(j);setDirty(false);flash(h?'Opening hours saved':'Back to the default opening hours')}
   else flash(j?.error||'Could not save the hours. Nothing was changed.');
  }catch{flash('No connection. Nothing was changed.')}
 };
 const editDay=(d:number,fn:(h:Day)=>Day)=>{setDraft(p=>p?p.map((h,i)=>i===d?fn(h):h):p);setDirty(true)};
 const sameHours=()=>{
  setDraft(p=>{
   if(!p)return p;const first=p.find(h=>h);if(!first)return p;
   return p.map(h=>h?[first[0],first[1]] as [number,number]:null);
  });setDirty(true);
 };

 // ---- menu: availability ----
 const menuApi=(body:object)=>fetch('/api/kitchen/menu',{method:'POST',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const toggleItem=async(m:MI)=>{
  const sold=!m.soldOut;
  inflight.current++;setMenuBusy(b=>({...b,[m.id]:true}));
  setMenu(p=>p.map(x=>x.id===m.id?{...x,soldOut:sold}:x));
  try{
   const r=await menuApi({id:m.id,soldOut:sold});
   if(!r.ok)throw new Error('status '+r.status);
   flash(sold?`${m.name} is now sold out`:`${m.name} is available again`);
  }catch{
   setMenu(p=>p.map(x=>x.id===m.id?{...x,soldOut:!sold}:x));
   flash(`Could not change ${m.name}. Nothing was changed.`);
  }finally{inflight.current--;setMenuBusy(b=>{const n={...b};delete n[m.id];return n})}
 };
 const resetMenu=async()=>{
  if(!confirmReset){setConfirmReset(true);setTimeout(()=>setConfirmReset(false),3000);return}
  setConfirmReset(false);
  try{
   const r=await menuApi({action:'reset'});
   if(!r.ok)throw new Error('status '+r.status);
   setMenu(p=>p.map(x=>({...x,soldOut:false})));flash('Everything is available again');
  }catch{flash('Could not reset the menu. Nothing was changed.')}
 };

 // ---- menu: add, edit, photos, remove ----
 const uploadPhoto=async(id:string,file:File):Promise<number>=>{
  const blob=await shrink(file);
  const fd=new FormData();fd.append('id',id);fd.append('file',blob,blob.type==='image/jpeg'?'dish.jpg':'dish.webp');
  const r=await fetch('/api/kitchen/menu/image',{method:'POST',headers:{'x-staff-key':key},body:fd}); // the browser sets the multipart header
  const j=await r.json().catch(()=>({}));
  if(!r.ok||typeof j?.img!=='number')throw new Error(j?.error||'upload failed');
  return j.img;
 };
 const saveDish=async(id:string|null,f:Form,file:File|null):Promise<boolean>=>{
  inflight.current++;
  try{
   const r=await menuApi(id?{action:'update',id,...f}:{action:'create',...f});
   const j=await r.json().catch(()=>({}));
   if(!r.ok||!j?.item){flash(j?.error||'Could not save. Nothing was changed.');return false}
   const saved:MI=j.item;
   setMenu(p=>id?p.map(x=>x.id===id?saved:x):[...p,saved]);
   if(file){
    try{
     const v=await uploadPhoto(saved.id,file);
     setMenu(p=>p.map(x=>x.id===saved.id?{...x,img:v}:x));
    }catch(e){
     flash(`${saved.name} was saved, but the photo did not upload: ${(e as Error).message}`);
     return true;
    }
   }
   flash(id?`${saved.name} updated`:`${saved.name} added. It is live on the menu now`);
   return true;
  }catch{flash('No connection. Nothing was changed.');return false}
  finally{inflight.current--}
 };
 const removeDish=async(m:MI)=>{
  inflight.current++;
  try{
   const r=await menuApi({action:'remove',id:m.id});
   if(!r.ok)throw new Error('status '+r.status);
   setMenu(p=>p.map(x=>x.id===m.id?{...x,removed:true}:x));setEditing(null);
   flash(`${m.name} removed from the menu, order page and home page`);
  }catch{flash(`Could not remove ${m.name}. Nothing was changed.`)}
  finally{inflight.current--}
 };
 const restoreDish=async(m:MI)=>{
  inflight.current++;
  try{
   const r=await menuApi({action:'restore',id:m.id});
   if(!r.ok)throw new Error('status '+r.status);
   setMenu(p=>p.map(x=>x.id===m.id?{...x,removed:false}:x));
   flash(`${m.name} is back on the menu`);
  }catch{flash(`Could not restore ${m.name}. Nothing was changed.`)}
  finally{inflight.current--}
 };

 // ---- reservations and catering ----
 const setLeadStatus=async(kind:Kind,l:Lead,status:string)=>{
  if(l.status===status)return;
  const set=kind==='reservations'?setRes:setCat;
  const was=l.status;
  leadFlight.current++;
  set(p=>p?p.map(x=>x.id===l.id?{...x,status}:x):p);
  try{
   const r=await fetch(`/api/leads/${kind}/${l.id}`,{method:'PATCH',headers:{'x-staff-key':key,'Content-Type':'application/json'},body:JSON.stringify({status})});
   if(!r.ok)throw new Error('status '+r.status);
   flash(`${l.ref} marked ${LEAD_LABEL[status]||status}`);
  }catch{
   set(p=>p?p.map(x=>x.id===l.id?{...x,status:was}:x):p);
   flash(`Could not update ${l.ref}. Nothing was changed.`);
  }finally{leadFlight.current--}
 };

 if(!started)return <div className="ad ad-gate"><style>{CSS}</style><form onSubmit={e=>{e.preventDefault();begin()}}>
  <span className="badge"><Logo variant="mark" height={92} href={null} priority/></span>
  <h1>Admin</h1><p>Enter the staff key to see today&apos;s orders, the menu, bookings and the opening hours.</p>
  <input type="password" autoComplete="current-password" placeholder="Staff key" value={keyIn} onChange={e=>setKeyIn(e.target.value)}/>
  {authErr&&<p className="err" role="alert">{authErr}</p>}
  <button className="go">Open dashboard</button></form></div>;

 // ---- derived numbers ----
 const t=now+(stats?stats.serverTime-statsAt:0);
 const live=stats?.live||[];
 const queued=live.filter(o=>o.status==='PAID'),cooking=live.filter(o=>o.status==='PREPARING'),ready=live.filter(o=>o.status==='READY');
 const rev=stats?.today.revenue||0,ord=stats?.today.orders||0;
 const yRev=stats?.yesterday.revenue||0;
 const aov=ord?rev/ord:0;
 const pctY=yRev?Math.round(rev/yRev*100):null;
 const lost=(stats?.statuses.PAYMENT_FAILED||0)+(stats?.statuses.CANCELLED||0);
 const hrs=stats?.hourly||[];
 const lo=Math.min(10,...hrs.map(x=>x.h)),hi=Math.max(20,...hrs.map(x=>x.h));
 const rows=Array.from({length:hi-lo+1},(_,i)=>{const h=lo+i;const f=hrs.find(x=>x.h===h);return{h,n:f?.n||0,revenue:f?.revenue||0}});
 const maxN=Math.max(1,...rows.map(r=>r.n));
 const curH=Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hour12:false,timeZone:'Africa/Nairobi'}).format(new Date(t||Date.now())))%24;
 const topMax=Math.max(1,...(stats?.top||[]).map(x=>x.qty));

 const activeMenu=menu.filter(m=>!m.removed),removedMenu=menu.filter(m=>m.removed);
 const soldCount=activeMenu.filter(m=>m.soldOut).length;
 const mq=menuQ.trim().toLowerCase();
 const shown=activeMenu.filter(m=>!mq||m.name.toLowerCase().includes(mq)||m.cat.toLowerCase().includes(mq));
 const cats=[...CATS.filter(c=>shown.some(m=>m.cat===c)),...[...new Set(shown.map(m=>m.cat))].filter(c=>!CATS.includes(c))];
 const nRes=(res||[]).filter(l=>l.status==='NEW').length,nCat=(cat||[]).filter(l=>l.status==='NEW').length;

 const LiveRow=({o,since,limit}:{o:Live;since:number;limit:number})=>{
  const wait=t-since;
  return <div className={'ad-lrow'+(wait>limit*60000?' late':'')}>
   <div><b>#{o.no}</b><time>{dur(wait)}</time></div>
   <p>{lines(o.items)}</p>
  </div>;
 };

 const Fact=({k,v}:{k:string;v:string|number|undefined})=>str(v)?<div className="ad-fact"><span>{k}</span><b>{str(v)}</b></div>:null;
 const Phone=({p}:{p:string|number|undefined})=>str(p)?<a className="ad-call" href={'tel:+'+str(p).replace(/\D/g,'')}>📞 +{str(p).replace(/\D/g,'')}</a>:null;
 const Statuses=({kind,l}:{kind:Kind;l:Lead})=><div className="ad-sts" role="group" aria-label={'Status for '+l.ref}>
  {ST[kind].map(s=><button key={s} type="button" aria-pressed={l.status===s} className={'ad-st'+(l.status===s?` on ${LEAD_TONE[s]||'grey'}`:'')} onClick={()=>setLeadStatus(kind,l,s)}>{LEAD_LABEL[s]||s}</button>)}
 </div>;
 const LeadTop=({l}:{l:Lead})=><div className="ad-lead-top"><div><b>{l.ref}</b><small>Received {dayTime(l.createdAt)}</small></div>
  <span className={'ad-chip '+(LEAD_TONE[l.status]||'grey')}>{LEAD_LABEL[l.status]||l.status}</span></div>;

 const leadView=(kind:Kind,list:Lead[]|null)=>{
  const all=list||[];
  const active=all.filter(l=>!FINISHED.includes(l.status));
  const vis=showAll[kind]?all:active;
  return <div className="ad-card">
   <h2 className="ad-h">{kind==='reservations'?'Table reservations':'Catering enquiries'} <small>Newest first</small></h2>
   <div className="ad-filter">
    <button type="button" className={'ad-fb'+(!showAll[kind]?' on':'')} onClick={()=>setShowAll(p=>({...p,[kind]:false}))}>Active ({active.length})</button>
    <button type="button" className={'ad-fb'+(showAll[kind]?' on':'')} onClick={()=>setShowAll(p=>({...p,[kind]:true}))}>All ({all.length})</button>
   </div>
   {list===null&&<p className="ad-none">Loading…</p>}
   {list!==null&&!vis.length&&<p className="ad-none">{showAll[kind]?(kind==='reservations'?'No reservations yet.':'No catering enquiries yet.'):'Nothing waiting. New requests will appear here.'}</p>}
   <div className="ad-leads">
    {vis.map(l=>{
     const tone=LEAD_TONE[l.status]||'grey';const d=l.data;
     return <article key={l.id} className={'ad-lead '+tone}>
      <LeadTop l={l}/>
      {kind==='reservations'?<>
       <h3>{str(d.name)||'Guest'}</h3>
       <div className="ad-facts"><Fact k="Date" v={d.date}/><Fact k="Time" v={d.time}/><Fact k="Guests" v={d.guests}/></div>
       <div className="ad-contact"><Phone p={d.phone}/></div>
       {str(d.requests)&&<p className="ad-text"><b>Special requests</b>{str(d.requests)}</p>}
      </>:<>
       <h3>{str(d.eventType)||'Catering enquiry'}</h3>
       <div className="ad-facts"><Fact k="Date" v={d.date}/><Fact k="People" v={d.guests}/><Fact k="Budget" v={d.budget}/><Fact k="Interested in" v={d.interest}/><Fact k="Service" v={d.fulfilment}/><Fact k="Venue" v={d.venue}/></div>
       <div className="ad-contact"><strong>{str(d.name)}{str(d.company)?` · ${str(d.company)}`:''}</strong>
        <Phone p={d.phone}/>{str(d.email)&&<a href={'mailto:'+str(d.email)}>{str(d.email)}</a>}</div>
       {str(d.details)&&<p className="ad-text"><b>Details</b>{str(d.details)}</p>}
      </>}
      <Statuses kind={kind} l={l}/>
     </article>;
    })}
   </div>
  </div>;
 };

 return <div className="ad"><style>{CSS}</style>
  <div className="ad-head">
   <div className="ad-head-in">
    <div className="ad-brand"><Logo variant="mark" height={44} href={null} priority/><div><b>Treehouse</b><small>Admin</small></div></div>
    <div className="ad-head-r">
     <span className="ad-clock">{clock(t||Date.now())}</span>
     <button type="button" className={'ad-pill '+(shop?(shop.open?'open':'closed'):'')} onClick={()=>setTab('restaurant')}><i/>{shop?(shop.open?'Open':'Closed'):'…'}</button>
    </div>
   </div>
   <div className="ad-tabs" role="tablist">
    {([['overview','Overview'],['menu','Menu'],['restaurant','Restaurant'],['reservations','Reservations'],['catering','Catering']] as const).map(([k,l])=>
     <button key={k} type="button" role="tab" aria-selected={tab===k} className={'ad-tab'+(tab===k?' on':'')} onClick={()=>setTab(k)}>{l}
      {k==='menu'&&soldCount>0&&<em>{soldCount} sold out</em>}
      {k==='reservations'&&nRes>0&&<em>{nRes} new</em>}
      {k==='catering'&&nCat>0&&<em>{nCat} new</em>}</button>)}
   </div>
  </div>

  <div className="ad-wrap">
   {tab==='overview'&&<>
    {!stats&&<div className="ad-card"><p className="ad-none">Loading today&apos;s numbers…</p></div>}
    {stats&&<>
     <div className="ad-kpis">
      <div className="ad-kpi hero"><span>Revenue today</span><b>{kes(rev)}</b>
       <small>{pctY===null?'No sales yesterday':<><span className={pctY>=100?'ad-up':''} style={{display:'inline',letterSpacing:0,textTransform:'none',fontSize:'inherit',fontWeight:800}}>{pctY}%</span> of yesterday&apos;s {kes(yRev)}</>}</small></div>
      <div className="ad-kpi"><span>Orders paid</span><b>{ord}</b><small>Average {kes(aov)} per order</small></div>
      <div className="ad-kpi"><span>Prepared today</span><b>{stats.readyCount}</b><small>{stats.served} handed over</small></div>
      <div className="ad-kpi"><span>Avg cook time</span><b>{stats.readyCount?dur(stats.cookSec*1000):'–'}</b><small>{stats.readyCount?`${dur(stats.totalSec*1000)} from payment to ready`:'Start to ready'}</small></div>
      <div className="ad-kpi"><span>In progress</span><b>{live.length}</b><small>{queued.length} waiting · {cooking.length} cooking · {ready.length} ready</small></div>
      <div className="ad-kpi"><span>Lost orders</span><b className={lost?'ad-warn':''}>{lost}</b><small>Failed payments and cancellations</small></div>
     </div>

     {(nRes>0||nCat>0)&&<div className="ad-card"><h2 className="ad-h">Needs a reply <small>New requests from the website</small></h2>
      <div className="ad-filter">
       {nRes>0&&<button type="button" className="ad-fb" onClick={()=>setTab('reservations')}>{nRes} new reservation{nRes>1?'s':''}</button>}
       {nCat>0&&<button type="button" className="ad-fb" onClick={()=>setTab('catering')}>{nCat} new catering enquir{nCat>1?'ies':'y'}</button>}
      </div></div>}

     <div className="ad-card">
      <h2 className="ad-h">Live orders <small>Updates every 10 seconds</small></h2>
      <div className="ad-live">
       <div className="ad-lcol red"><h3>Waiting <b>{queued.length}</b></h3>
        {!queued.length&&<p className="ad-none">Nothing waiting</p>}
        {queued.map(o=><LiveRow key={o.no} o={o} since={o.paidAt||t} limit={10}/>)}</div>
       <div className="ad-lcol blue"><h3>Cooking <b>{cooking.length}</b></h3>
        {!cooking.length&&<p className="ad-none">Nothing on the line</p>}
        {cooking.map(o=><LiveRow key={o.no} o={o} since={o.preparingAt||o.paidAt||t} limit={20}/>)}</div>
       <div className="ad-lcol green"><h3>Ready <b>{ready.length}</b></h3>
        {!ready.length&&<p className="ad-none">Counter is clear</p>}
        {ready.map(o=><LiveRow key={o.no} o={o} since={o.readyAt||t} limit={5}/>)}</div>
      </div>
     </div>

     <div className="ad-grid">
      <div className="ad-card">
       <h2 className="ad-h">Orders by hour <small>Red bar is the current hour</small></h2>
       <div className="ad-chart" role="img" aria-label="Orders paid per hour today">
        {rows.map(r=><div key={r.h} className={'ad-col'+(r.h===curH?' now':'')+(r.n?' has':'')} title={`${fh(r.h)}: ${r.n} orders, ${kes(r.revenue)}`}>
         <span className="n">{r.n||''}</span><div className="ad-bar" style={{height:`${Math.max(2,r.n/maxN*100)}%`}}/><small>{fh(r.h).replace(/[ap]m/,'')}</small></div>)}
       </div>
      </div>
      <div className="ad-card">
       <h2 className="ad-h">Top sellers today</h2>
       {!stats.top.length&&<p className="ad-none">No sales yet today</p>}
       <ul className="ad-top">{stats.top.map(x=><li key={x.name}>
        <div><span>{x.name}</span><span>{x.qty}×</span></div>
        <small>{kes(x.revenue)}</small><div className="ad-meter"><i style={{width:`${x.qty/topMax*100}%`}}/></div></li>)}</ul>
      </div>
     </div>

     <div className="ad-card">
      <h2 className="ad-h">Today&apos;s orders <small>{stats.recent.length} most recent</small></h2>
      <div className="ad-log">
       {!stats.recent.length&&<p className="ad-none">No orders yet today</p>}
       {stats.recent.map(o=><div className="ad-lg" key={o.no}>
        <span className="no">#{o.no}</span><span className="tm">{clock(o.createdAt)}</span>
        <span className="it" title={lines(o.items)}>{lines(o.items)}</span>
        <span className="tt">{kes(o.total)}</span>
        <span className="st"><span className={'ad-chip '+(TONE[o.status]||'grey')}>{LABEL[o.status]||o.status}</span></span></div>)}
      </div>
     </div>
    </>}
   </>}

   {tab==='menu'&&<div className="ad-card">
    <h2 className="ad-h">Menu <small>Changes reach customers within 30 seconds</small></h2>
    <div className="ad-sum" style={{marginBottom:14}}>
     <span className="ad-sumchip in">{activeMenu.length-soldCount} available</span>
     <span className="ad-sumchip out">{soldCount} sold out</span>
     {removedMenu.length>0&&<span className="ad-sumchip gone">{removedMenu.length} removed</span>}
    </div>
    <div className="ad-tools">
     <input className="ad-q" type="search" placeholder="Search the menu…" value={menuQ} onChange={e=>setMenuQ(e.target.value)} aria-label="Search the menu"/>
     <button type="button" className="ad-add" onClick={()=>{setAdding(true);setEditing(null)}}>+ Add dish</button>
     <button type="button" className={'ad-reset'+(confirmReset?' sure':'')} disabled={!soldCount} onClick={resetMenu}>{confirmReset?'Tap again to confirm':'Reset all to available'}</button>
    </div>

    {adding&&<DishEditor key="new" item={null} onError={flash}
     onSave={async(f,file)=>{const ok=await saveDish(null,f,file);if(ok)setAdding(false);return ok}}
     onCancel={()=>setAdding(false)}/>}

    {!menu.length&&<p className="ad-none">Loading the menu…</p>}
    {activeMenu.length>0&&!shown.length&&<p className="ad-none">Nothing matches “{menuQ}”.</p>}
    {cats.map(c=><div key={c}>
     <h3 className="ad-cat">{c}</h3>
     {shown.filter(m=>m.cat===c).map(m=><div key={m.id} className="ad-item">
      <div className={'ad-m'+(m.soldOut?' out':'')}>
       <span className="ad-th" aria-hidden><Thumb m={m}/></span>
       <div className="nm"><b>{m.name}</b><small>{kes(m.price)}</small></div>
       <span className={'ad-badge '+(m.soldOut?'out':'in')}>{m.soldOut?'Sold out':'Available'}</span>
       <button type="button" className={'ad-ed-btn'+(editing===m.id?' on':'')} aria-expanded={editing===m.id}
        onClick={()=>{setEditing(editing===m.id?null:m.id);setAdding(false)}}>{editing===m.id?'Close':'Edit'}</button>
       <button type="button" className={'ad-act '+(m.soldOut?'avail':'sold')} disabled={!!menuBusy[m.id]} onClick={()=>toggleItem(m)}>{m.soldOut?'Mark available':'Mark sold out'}</button>
      </div>
      {editing===m.id&&<DishEditor key={m.id} item={m} onError={flash}
       onSave={(f,file)=>saveDish(m.id,f,file)} onCancel={()=>setEditing(null)} onRemove={removeDish}/>}
     </div>)}
    </div>)}

    {removedMenu.length>0&&<details className="ad-rem">
     <summary>Removed dishes ({removedMenu.length})</summary>
     {removedMenu.map(m=><div key={m.id} className="ad-m">
      <span className="ad-th" aria-hidden><Thumb m={m}/></span>
      <div className="nm"><b>{m.name}</b><small>{kes(m.price)} · {m.cat}</small></div>
      <button type="button" className="ad-act avail" onClick={()=>restoreDish(m)}>Restore</button>
     </div>)}
    </details>}
   </div>}

   {tab==='restaurant'&&<div className="ad-grid2">
    <div className="ad-card">
     <h2 className="ad-h">Open or closed</h2>
     <div className={'ad-big '+(shop?.open?'open':'closed')}><i/><div><b>{shop?(shop.open?'Open':'Closed'):'…'}</b><small>The website shows: {shop?shop.text:'…'}</small></div></div>
     <div className="ad-modes">
      {([['auto','Follow hours','Opens and closes by itself'],['open','Open now','Override: open'],['closed','Closed','Override: closed']] as const).map(([m,l,s])=>
       <button key={m} type="button" className={`ad-mode ${m}`+(shop?.mode===m?' on':'')} onClick={()=>saveMode(m)}><b>{l}</b><small>{s}</small></button>)}
     </div>
     <form className="ad-note" onSubmit={e=>{e.preventDefault();saveMode(shop?.mode||'auto',note)}}>
      <input maxLength={60} placeholder="Note shown when closed, e.g. Back at 3pm" value={note} onChange={e=>{setNote(e.target.value);setNoteEdit(true)}} aria-label="Closed note"/>
      <button type="submit" className="ad-btn" disabled={note.trim()===(shop?.note||'')}>Save note</button>
     </form>
     <p className="ad-hint">The note shows on the website while <b>Closed</b> is selected. This changes the label customers see. Orders can still be placed while closed.</p>
    </div>

    <div className="ad-card">
     <h2 className="ad-h">Weekly opening hours <small>{shop?.custom?'Custom hours':'Default hours'}</small></h2>
     {draft&&ORDER.map(d=>{const h=draft[d];return <div className="ad-day" key={d}>
      <div className="ad-dn"><button type="button" className={'ad-tg '+(h?'on':'off')} aria-pressed={!!h} onClick={()=>editDay(d,x=>x?null:[12,19])}>{h?'Open':'Closed'}</button><b>{DAYS[d]}</b></div>
      {h?<div className="ad-times">
       <select className="ad-sel" aria-label={`${DAYS[d]} opens`} value={h[0]} onChange={e=>{const o=Number(e.target.value);editDay(d,x=>x?[o,Math.max(x[1],o+1)]:x)}}>
        {Array.from({length:24},(_,i)=><option key={i} value={i}>{fh(i)}</option>)}</select>
       <span>to</span>
       <select className="ad-sel" aria-label={`${DAYS[d]} closes`} value={h[1]} onChange={e=>{const c=Number(e.target.value);editDay(d,x=>x?[x[0],c]:x)}}>
        {Array.from({length:24},(_,i)=>i+1).filter(c=>c>h[0]).map(c=><option key={c} value={c}>{fh(c)}</option>)}</select>
      </div>:<span className="ad-off">Closed all day</span>}
     </div>})}
     <div className="ad-hrow">
      <button type="button" className="ad-btn" disabled={!dirty||!draft} onClick={()=>draft&&saveHours(draft)}>Save hours</button>
      <button type="button" className="ad-btn ghost" onClick={sameHours}>Same hours every open day</button>
      <button type="button" className="ad-btn ghost" disabled={!shop?.custom&&!dirty} onClick={()=>{setDirty(false);saveHours(null)}}>Reset to default</button>
     </div>
     <p className="ad-hint">Times are Nairobi time. A day set to Closed stays closed unless you choose <b>Open now</b>.</p>
    </div>
   </div>}

   {tab==='reservations'&&leadView('reservations',res)}
   {tab==='catering'&&leadView('catering',cat)}
  </div>

  {toast&&<div className="ad-toast" role="status">{toast}</div>}
 </div>;}