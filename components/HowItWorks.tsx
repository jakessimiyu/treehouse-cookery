const STEPS=[['01','Pick it','Tap what you want. Add extras and sauces.'],['02','Pay on M-Pesa','One prompt on your phone. Nothing to type but your PIN.'],['03','We cook','Your order lands on the kitchen screen the second you pay.'],['04','Walk in','Your number lights up when it is ready. Skip the queue.']];
export default function HowItWorks(){
 return <section id="story" className="tx-how"><div className="tx-how-l"><h2 className="tx-rv">ORDER.<br/>PAY.<br/><em>EAT.</em></h2>
  <p className="tx-rv">The fastest way to eat well in town.</p></div>
  <ol className="tx-how-r">{STEPS.map(([n,t,d])=><li key={n} className="tx-rv"><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}</ol></section>;}