// EDIT: every price, minimum and policy in this file is a placeholder. Replace with real numbers.
export const MIN_GUESTS=10,MAX_GUESTS=500;
export const PRESETS=[20,50,100,200];
export const kes=(n:number)=>'KSh '+n.toLocaleString();
export const EVENT_TYPES=['Corporate lunch','Meeting','Conference','Private event','Wedding','Birthday','Graduation','Launch or brand event','Bulk order'];
export const TIMES=['Breakfast','Lunch','Afternoon','Evening'];
export const FULFIL=['Delivery + setup','Delivery only','Collection'];
export const DIETARY=['Halal','Vegetarian','Vegan','Gluten-free','Nut allergy'];

export type Pkg={id:string;name:string;tagline:string;per:number;feat?:boolean;inc:string[]};
export const PACKAGES:Pkg[]=[
 {id:'lunch-box',name:'Office Lunch Boxes',tagline:'Individually packed. Zero fuss.',per:750,inc:['Choice of burger, wrap or chicken plate','Chips and a soft drink','Labelled for dietary needs','Delivered hot, on time']},
 {id:'platter',name:'Party Platters',tagline:'Big shared platters for a crowd.',per:1100,feat:true,inc:['Wings, nuggets and loaded chips','Wraps and sliders','Dips and sauces','Soft drinks, plates and napkins']},
 {id:'spread',name:'The Full Spread',tagline:'A proper hot buffet with service.',per:1700,inc:['Chicken biryani and crispy fried chicken','Sides, salads and chips','Dessert and drinks','Serving staff, setup and clear-down']}];

export type Addon={id:string;label:string;per?:number;flat?:number};
export const ADDONS:Addon[]=[
 {id:'shakes',label:'Milkshake bar',per:300},{id:'dessert',label:'Dessert table',per:200},{id:'coffee',label:'Coffee and chai',per:150},
 {id:'staff',label:'Extra serving staff',flat:12000},{id:'furniture',label:'Tables and chairs',flat:30000}];

export const OCCASIONS:[string,string][]=[
 ['Corporate lunches','Team lunches, training days and client meetings. Boxed or served, always on time.'],
 ['Conferences and launches','Food that keeps people in the room and talking.'],
 ['Weddings and receptions','Engagement parties and send-offs, fed properly from first guest to last.'],
 ['Birthdays and family days','Milestones and reunions, without the host being stuck in the kitchen.'],
 ['Graduations and school events','Big tables, big appetites, a menu everyone can eat.'],
 ['Bulk orders','Need 40 wraps by noon? Tell us the number and the time.']];


export const INCLUDED:[string,string][]=[
 ['Hot, fresh food','Cooked close to your event time, not the night before.'],
 ['Dietary planning','Halal, vegetarian, vegan and gluten-free, planned in advance.'],
 ['Delivery and setup','We arrive early and set up the serving area.'],
 ['Clear-down','Options that include collecting waste and equipment.'],
 ['Clear pricing','One written quote. No surprise extras on the day.'],
 ['One point of contact','A single coordinator on WhatsApp from quote to delivery.']];

export const FAQS:[string,string][]=[
 ['How far ahead should I book?','We need at least 2 days. For events over 100 guests, 2 to 3 weeks ahead is ideal. Short notice? Ask us on WhatsApp.'],
 ['What is the minimum order?',`Catering starts at ${MIN_GUESTS} guests. For fewer people, order normally from our menu.`],
 ['Where do you deliver?','Across Nairobi and surrounding areas. Delivery is confirmed in your written quote.'],
 ['Can you cater for dietary needs?','Yes. Tell us in the form and we plan the menu so every guest is looked after.'],
 ['How do I confirm my date?','Accept your written quote and pay a deposit by M-Pesa. The balance is due on or before the event.'],
 ['Is the estimate the final price?','No. It is a guide. Delivery, venue access and the final menu are confirmed in your written quote.']];

export function estimate(pkgId:string,guests:number,addons:string[]){
 const p=PACKAGES.find(x=>x.id===pkgId);if(!p)return null;
 const lines:[string,number][]=[[`${p.name}: ${guests} × ${kes(p.per)}`,p.per*guests]];
 for(const id of addons){const a=ADDONS.find(x=>x.id===id);if(!a)continue;
  lines.push(a.per?[`${a.label}: ${guests} × ${kes(a.per)}`,a.per*guests]:[a.label,a.flat||0])}
 return {lines,total:lines.reduce((s,l)=>s+l[1],0)};}