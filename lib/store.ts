import { EventEmitter } from 'events';
export type Status='PENDING_PAYMENT'|'PAID'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED'|'PAYMENT_FAILED';
export type Item={id:string;name:string;desc:string;price:number;cat:string;emoji:string;tags:string[];ing:string[];soldOut:boolean};
export type Order={id:number;no:number;phone:string;items:{id:string;name:string;qty:number;price:number}[];total:number;notes:string;pickup:string;status:Status;key:string;checkoutId?:string;receipt?:string;createdAt:number;paidAt?:number;payStart?:number};
type G={menu:Item[];orders:Order[];seq:number;bus:EventEmitter};
const i=(id:string,name:string,cat:string,price:number,emoji:string,tags:string,ing:string,desc:string):Item=>({id,name,cat,price,emoji,desc,tags:tags.split(','),ing:ing.split(','),soldOut:false});
const seed=():Item[]=>[
  i('fried-chicken','Crispy Fried Chicken (4pc)','Chicken',550,'🍗','crispy,spicy,filling','Buttermilk brine,Double crumbed,Secret spice','Crunch you can hear across the room.'),
  i('hot-wings','Hot Wings (8pc)','Chicken',420,'🍗','spicy,crispy,quick','Chilli glaze,Sesame,Cooling dip','Sticky, fiery, gone in minutes.'),
  i('nuggets','Golden Nuggets (10pc)','Chicken',350,'🍗','crispy,quick','White meat,Panko,Two dips','Crisp outside, juicy inside.'),
  i('loaded-chips','Loaded Chips','Chips',380,'🍟','cheesy,filling,crispy','Crinkle chips,Cheese sauce,Chicken bits,Jalapeño','Chips that refuse to be a side.'),
  i('masala-chips','Masala Chips','Chips',250,'🍟','spicy,quick,crispy','Hand-cut,Masala,Lime','Hot, salty, tangy.'),
  i('shawarma-chicken','Chicken Shawarma','Shawarma',300,'🌯','filling,quick,spicy','Garlic sauce,Pickles,Chicken,Toasted wrap','Wrapped tight, loaded properly.'),
  i('shawarma-beef','Beef Shawarma','Shawarma',330,'🌯','filling,spicy','Spiced beef,Tahini,Onion,Chilli','Slow-roasted and shaved to order.'),
  i('burger-classic','Classic Burger','Burgers',420,'🍔','filling,cheesy','Beef patty,Cheddar,Pickles,Brioche','The one you compare all others to.'),
  i('burger-double','Double Smash','Burgers',590,'🍔','cheesy,filling','Two smashed patties,Double cheese,Burger sauce','Two patties. No apologies.'),
  i('chicken-biryani','Chicken Biryani','Biryani',450,'🍛','filling,spicy','Basmati,Slow-cooked chicken,Saffron,Kachumbari','Slow-cooked. Fragrant. Loaded.'),
  i('smokie','Smokie Pasua','Snacks',120,'🌭','quick,spicy','Smokie,Kachumbari,Chilli mayo','Street classic, done right.'),
  i('wrap','Crispy Chicken Wrap','Snacks',280,'🌮','crispy,quick','Crispy chicken,Slaw,Sriracha mayo','Crunch in a tortilla.'),
  i('brownie','Fudge Brownie','Snacks',200,'🍰','sweet','Dark chocolate,Sea salt,Warm centre','Finish on a high.'),
  i('milkshake','Thick Milkshake','Drinks',280,'🥤','sweet','Vanilla,Chocolate,Strawberry','So thick the straw stands up.'),
  i('soda','Soft Drink','Drinks',100,'🥤','quick,sweet','Coke,Fanta,Sprite','Ice cold.'),
  i('combo-class','The After-Class Combo','Combos',499,'🍱','filling,quick','Shawarma,Loaded chips,Soda','For one. Fast and filling.'),
  i('combo-couple','Date Night for Two','Combos',1200,'🍱','filling,sweet','2 burgers,Loaded chips,2 milkshakes','For two. Share the chips (or not).'),
  i('combo-group','The Squad Bucket','Combos',2400,'🍱','filling,crispy','12pc chicken,Big chips,4 sodas','For four. Bring friends.'),
  i('combo-office','Office Lunch Box (5)','Combos',2600,'🍱','filling,quick','5 wraps,Chips to share,5 drinks','For teams. Ready when you say.')];
const valid=(m:Item[])=>Array.isArray(m)&&m.length>0&&m.every(x=>Array.isArray(x.ing)&&Array.isArray(x.tags)&&typeof x.emoji==='string');
const g=globalThis as unknown as {__treehouse_v3?:G};
if(!g.__treehouse_v3)g.__treehouse_v3={menu:seed(),orders:[],seq:1041,bus:new EventEmitter()};
else if(!valid(g.__treehouse_v3.menu))g.__treehouse_v3.menu=seed(); // stale cached menu from an older version
export const s:G=g.__treehouse_v3;
s.bus.setMaxListeners(100);
export const emit=(o:Order)=>s.bus.emit('order',o);
export const okStaff=(r:Request)=>r.headers.get('x-staff-key')===(process.env.STAFF_KEY||'dev');
export function pay(o:Order,receipt='SIM'+o.no){ if(o.status!=='PENDING_PAYMENT'&&o.status!=='PAYMENT_FAILED')return; // idempotent
 o.status='PAID';o.receipt=receipt;o.paidAt=Date.now();emit(o);}
