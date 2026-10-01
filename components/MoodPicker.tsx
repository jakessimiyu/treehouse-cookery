'use client';
import {useState} from 'react';
import {Item} from '@/lib/Cart';
import {Pic,BEST} from '@/components/Dish';
import MenuRow from '@/components/MenuRow';

// [tag, label, item id whose photo is shown, one-line description]. EDIT the photo id to change a tile's picture.
const MOODS:[string,string,string,string][]=[
 ['crispy','Crispy','fried-chicken','Golden, crunchy and loud.'],
 ['spicy','Spicy','hot-wings','Keep a cold drink close.'],
 ['cheesy','Cheesy','burger-classic','Melty, gooey, unapologetic.'],
 ['filling','Filling','chicken-biryani','Come hungry, leave happy.'],
 ['quick','Quick','masala-chips','Ready fast. No waiting around.'],
 ['sweet','Sweet','milkshake','Treat yourself.']];

export default function MoodPicker({menu,onSeeAll}:{menu:Item[];onSeeAll:(tag:string)=>void}){
 const [mood,setMood]=useState('');const [surprise,setSurprise]=useState<Item|null>(null);
 const avail=menu.filter(m=>!m.soldOut);
 const withTag=(t:string)=>avail.filter(m=>(m.tags||[]).includes(t));
 const score=(m:Item,t:string)=>(BEST.includes(m.id)?2:0)+(t==='sweet'||m.cat!=='Drinks'?1:0);
 const top=(t:string)=>withTag(t).sort((a,b)=>score(b,t)-score(a,t)||a.price-b.price).slice(0,3);
 const info=MOODS.find(m=>m[0]===mood);
 const picks=mood?top(mood):surprise?[surprise]:[];
 const total=mood?withTag(mood).length:0;

 const choose=(t:string)=>{setSurprise(null);setMood(mood===t?'':t)};
 const roll=()=>{const pool=avail.filter(m=>m.cat!=='Drinks'&&m.id!==surprise?.id);
  if(!pool.length)return;setMood('');setSurprise(pool[Math.floor(Math.random()*pool.length)])};

 if(!menu.length)return null;
 return <section className="mn-mood" aria-labelledby="mood-h"><div className="mn-wrap">
  <div className="mn-mood-h"><div><small>Not sure what to eat?</small><h2 id="mood-h">What are you in the mood for?</h2></div>
   <button type="button" className="mn-surp" onClick={roll}>{surprise?'Another one ↻':'Surprise me ↻'}</button></div>

  <ul className="mn-moods">{MOODS.map(([tag,label,pid])=>{const n=withTag(tag).length;
   return <li key={tag}><button type="button" className="mn-mt" aria-pressed={mood===tag} disabled={!n} onClick={()=>choose(tag)}>
    <Pic id={pid} alt="" emoji="🍽️" sizes="200px"/>
    <span className="mn-mt-l"><b>{label}</b><small>{n} {n===1?'dish':'dishes'}</small></span></button></li>})}</ul>

  <div aria-live="polite">{picks.length>0&&<div className="mn-pick" key={mood||surprise?.id}>
   <div className="mn-pick-h"><div><small>{mood?'Picked for you':'Today’s surprise'}</small>
    <h3>{mood?info?.[1]:'Fancy this?'}</h3></div>
    <p>{mood?info?.[3]:'A random pick from today’s menu.'}</p></div>
   <ul className="mn-list">{picks.map(it=><li key={it.id}><MenuRow it={it}/></li>)}</ul>
   <div className="mn-pick-f">
    {mood&&total>picks.length&&<button type="button" onClick={()=>onSeeAll(mood)}>See all {total} {info?.[1].toLowerCase()} dishes →</button>}
    <button type="button" onClick={()=>{setMood('');setSurprise(null)}}>Close</button></div>
  </div>}</div>
 </div></section>;}