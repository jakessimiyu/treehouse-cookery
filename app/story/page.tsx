import Link from 'next/link';
import {Pic} from '@/components/Dish';
import Reveal from '@/components/Reveal';
import StatsCounter from '@/components/StatsCounter';
import {STORY} from '@/lib/story';
export const metadata={title:'Our story | Treehouse',description:'Who we are, how we cook and why we do it.'};
export default function StoryPage(){
 return <>
 <Reveal/>
 <header className="st-hero"><small>OUR STORY</small><h1>{STORY.headline}</h1><p>{STORY.sub}</p></header>

 <section className="st-quote"><p className="tx-rv">&ldquo;{STORY.quote}&rdquo;</p></section>

 {STORY.chapters.map((c,i)=><section key={c.title} className={'st-ch'+(i%2?' flip':'')}>
  <div className="st-img tx-rv"><Pic id={c.img} alt={c.title} emoji={c.emoji}/></div>
  <div className="st-txt tx-rv"><small>{c.tag}</small><h2>{c.title}</h2>{c.text.map(p=><p key={p}>{p}</p>)}</div></section>)}

 <section className="st-vals"><h2 className="tx-rv">What we stand for</h2>
  <ul>{STORY.values.map(([t,d],i)=><li key={t} className="tx-rv"><span>{String(i+1).padStart(2,'0')}</span><h3>{t}</h3><p>{d}</p></li>)}</ul></section>

 <StatsCounter/>

 <section className="st-team"><h2 className="tx-rv">The people behind the food</h2>
  <ul>{STORY.team.map(([n,r],i)=><li key={r} className="tx-rv"><div className="st-face"><Pic id={`team-${i+1}`} alt={`${n}, ${r}`} emoji="👤"/></div><b>{n}</b><span>{r}</span></li>)}</ul></section>

 <section className="cq-band"><div><h3>Come and taste it</h3><p>Order ahead and skip the queue, or visit us in person.</p></div>
  <div className="cq-bands"><Link className="btn" href="/order">Order now</Link><Link className="btn tx-ghost" href="/visit">Plan your visit</Link></div></section>
 </>;}