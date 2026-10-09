import {q} from './db';
import {s} from './store';
import type {Item} from './store';

export type MenuItem=Item&{img:number};
export type AdminItem=MenuItem&{removed:boolean};
export type Fields={name:string;desc:string;price:number;cat:string;tags:string[];ing:string[]};

// Must match the categories and moods the menu page and home page already use.
export const CATS=['Chicken','Chips','Shawarma','Burgers','Biryani','Snacks','Drinks','Combos'];
export const TAGS=['crispy','spicy','cheesy','filling','quick','sweet'];
const EMOJI:Record<string,string>={Chicken:'🍗',Chips:'🍟',Shawarma:'🌯',Burgers:'🍔',Biryani:'🍛',Snacks:'🌮',Drinks:'🥤',Combos:'🍱'};
const RESERVED=['hero']; // ids used by site images that are not dishes

const SELECT=`select m.id,m.name,m.descr as "desc",m.price,m.cat,m.emoji,m.tags,m.ing,m.img,m.removed,
  (so.item_id is not null) as "soldOut"
 from menu_items m left join sold_out so on so.item_id=m.id and so.expires_at>now()`;

// Used only if the menu table has not been created yet: the site keeps working from the built-in menu.
async function fallback():Promise<AdminItem[]>{
 let sold=new Set<string>();
 try{sold=new Set((await q<{item_id:string}>('select item_id from sold_out where expires_at>now()')).map(r=>r.item_id))}catch{/* ignore */}
 return s.menu.map(m=>({...m,img:0,removed:false,soldOut:sold.has(m.id)}));
}

// all=false: what customers see. all=true: everything, including removed dishes (admin).
export async function listMenu(all=false):Promise<AdminItem[]>{
 let rows:AdminItem[];
 try{rows=await q<AdminItem>(`${SELECT} order by m.sort,m.id`)}
 catch(e){
  if((e as {code?:string}).code==='42P01'){console.warn('menu_items is missing, serving the built-in menu. Run: npm run db:migrate');return fallback()}
  throw e;
 }
 if(!rows.length)return fallback();
 return all?rows:rows.filter(r=>!r.removed);
}

export const getItem=async(id:string)=>(await listMenu(true)).find(m=>m.id===id)||null;

const text=(v:unknown)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();

// full=true for a new dish (everything required); full=false for an edit (only what was sent).
export function parseFields(b:Record<string,unknown>,full:boolean):{f:Partial<Fields>}|{error:string}{
 const f:Partial<Fields>={};
 if(full||b.name!==undefined){const v=text(b.name);if(v.length<2||v.length>60)return{error:'The name must be 2 to 60 characters.'};f.name=v}
 if(full||b.desc!==undefined){const v=text(b.desc);if(v.length>140)return{error:'The description is too long (140 characters at most).'};f.desc=v}
 if(full||b.price!==undefined){const v=Number(b.price);if(!Number.isInteger(v)||v<1||v>100000)return{error:'Enter a price between 1 and 100,000.'};f.price=v}
 if(full||b.cat!==undefined){const v=text(b.cat);if(!CATS.includes(v))return{error:'Choose a category.'};f.cat=v}
 if(full||b.tags!==undefined){const a=Array.isArray(b.tags)?b.tags.map(text):[];if(a.some(t=>!TAGS.includes(t)))return{error:'Unknown tag.'};f.tags=[...new Set(a)]}
 if(full||b.ing!==undefined){const a=Array.isArray(b.ing)?b.ing.map(text).filter(Boolean):[];if(a.length>8||a.some(t=>t.length>40))return{error:'Up to 8 ingredients, 40 characters each.'};f.ing=a}
 return{f};
}

const slug=(n:string)=>n.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'dish';

export async function createItem(f:Fields){
 let base=slug(f.name);if(RESERVED.includes(base))base+='-dish';
 for(let n=0;n<30;n++){
  const id=n?`${base}-${n+1}`:base;
  const r=await q<{id:string}>(
   `insert into menu_items(id,name,descr,price,cat,emoji,tags,ing,sort)
    values($1,$2,$3,$4,$5,$6,$7,$8,(select coalesce(max(sort),0)+10 from menu_items))
    on conflict(id) do nothing returning id`,
   [id,f.name,f.desc,f.price,f.cat,EMOJI[f.cat]||'🍽️',f.tags,f.ing]);
  if(r.length)return getItem(id);
 }
 throw new Error('Could not create a unique id for the new dish');
}

export async function updateItem(id:string,p:Partial<Fields>){
 const cols:string[]=[],vals:unknown[]=[id];
 const add=(c:string,v:unknown)=>{vals.push(v);cols.push(`${c}=$${vals.length}`)};
 if(p.name!==undefined)add('name',p.name);
 if(p.desc!==undefined)add('descr',p.desc);
 if(p.price!==undefined)add('price',p.price);
 if(p.cat!==undefined)add('cat',p.cat);
 if(p.tags!==undefined)add('tags',p.tags);
 if(p.ing!==undefined)add('ing',p.ing);
 if(!cols.length)return getItem(id);
 const r=await q<{id:string}>(`update menu_items set ${cols.join(',')},updated_at=now() where id=$1 returning id`,vals);
 return r.length?getItem(id):null;
}

export async function setRemoved(id:string,removed:boolean){
 const r=await q<{id:string}>('update menu_items set removed=$2,updated_at=now() where id=$1 returning id',[id,removed]);
 return r.length>0;
}

// every upload gets a new version number, so browsers never show a stale photo
export async function bumpImage(id:string){
 const r=await q<{img:number}>('update menu_items set img=img+1,updated_at=now() where id=$1 returning img',[id]);
 return r[0]?.img??null;
}