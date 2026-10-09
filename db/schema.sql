create sequence if not exists order_no_seq start 1042;

create table if not exists orders(
 no integer primary key default nextval('order_no_seq'),
 idem_key text not null unique,
 phone text not null,
 items jsonb not null,
 total integer not null,
 notes text not null default '',
 pickup text not null default 'ASAP',
 status text not null default 'PENDING_PAYMENT'
  check(status in('PENDING_PAYMENT','PAID','PREPARING','READY','COMPLETED','CANCELLED','PAYMENT_FAILED')),
 receipt text unique,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 pay_start timestamptz not null default now(),
 paid_at timestamptz,
 preparing_at timestamptz,
 ready_at timestamptz,
 completed_at timestamptz
);

do $$
begin
 if not exists(
  select 1 from information_schema.columns
  where table_schema=current_schema() and table_name='orders' and column_name='accepted_at'
 ) then
  alter table orders add column accepted_at timestamptz;
 end if;
end
$$;

create index if not exists orders_status_idx on orders(status);

create table if not exists checkouts(
 checkout_id text primary key,
 order_no integer not null references orders(no),
 at timestamptz not null default now()
);

create table if not exists order_events(
 id bigserial primary key,
 order_no integer not null references orders(no),
 from_status text,
 to_status text not null,
 actor text not null default 'system',
 at timestamptz not null default now()
);
create index if not exists order_events_no_idx on order_events(order_no);

create table if not exists payment_orphans(
 id bigserial primary key,
 checkout_id text,
 receipt text,
 raw jsonb,
 at timestamptz not null default now()
);

create table if not exists sold_out(
 item_id text primary key,
 set_at timestamptz not null default now(),
 expires_at timestamptz not null
);

create table if not exists settings(
 key text primary key,
 value jsonb not null,
 updated_at timestamptz not null default now()
);

create table if not exists menu_items(
 id text primary key,
 name text not null,
 descr text not null default '',
 price integer not null check(price>=0),
 cat text not null,
 emoji text not null default '',
 tags text[] not null default '{}',
 ing text[] not null default '{}',
 sort integer not null default 0,
 img integer not null default 0,
 removed boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Starting menu seeding
insert into menu_items(id,name,descr,price,cat,emoji,tags,ing,sort) values
 ('fried-chicken','Crispy Fried Chicken (4pc)','Crunch you can hear across the room.',550,'Chicken','🍗',string_to_array('crispy,spicy,filling',','),string_to_array('Buttermilk brine,Double crumbed,Secret spice',','),10),
 ('hot-wings','Hot Wings (8pc)','Sticky, fiery, gone in minutes.',420,'Chicken','🍗',string_to_array('spicy,crispy,quick',','),string_to_array('Chilli glaze,Sesame,Cooling dip',','),20),
 ('nuggets','Golden Nuggets (10pc)','Crisp outside, juicy inside.',350,'Chicken','🍗',string_to_array('crispy,quick',','),string_to_array('White meat,Panko,Two dips',','),30),
 ('loaded-chips','Loaded Chips','Chips that refuse to be a side.',380,'Chips','🍟',string_to_array('cheesy,filling,crispy',','),string_to_array('Crinkle chips,Cheese sauce,Chicken bits,Jalapeño',','),40),
 ('masala-chips','Masala Chips','Hot, salty, tangy.',250,'Chips','🍟',string_to_array('spicy,quick,crispy',','),string_to_array('Hand-cut,Masala,Lime',','),50),
 ('shawarma-chicken','Chicken Shawarma','Wrapped tight, loaded properly.',300,'Shawarma','🌯',string_to_array('filling,quick,spicy',','),string_to_array('Garlic sauce,Pickles,Chicken,Toasted wrap',','),60),
 ('shawarma-beef','Beef Shawarma','Slow-roasted and shaved to order.',330,'Shawarma','🌯',string_to_array('filling,spicy',','),string_to_array('Spiced beef,Tahini,Onion,Chilli',','),70),
 ('burger-classic','Classic Burger','The one you compare all others to.',420,'Burgers','🍔',string_to_array('filling,cheesy',','),string_to_array('Beef patty,Cheddar,Pickles,Brioche',','),80),
 ('burger-double','Double Smash','Two patties. No apologies.',590,'Burgers','🍔',string_to_array('cheesy,filling',','),string_to_array('Two smashed patties,Double cheese,Burger sauce',','),90),
 ('chicken-biryani','Chicken Biryani','Slow-cooked. Fragrant. Loaded.',450,'Biryani','🍛',string_to_array('filling,spicy',','),string_to_array('Basmati,Slow-cooked chicken,Saffron,Kachumbari',','),100),
 ('smokie','Smokie Pasua','Street classic, done right.',120,'Snacks','🌭',string_to_array('quick,spicy',','),string_to_array('Smokie,Kachumbari,Chilli mayo',','),110),
 ('wrap','Crispy Chicken Wrap','Crunch in a tortilla.',280,'Snacks','🌮',string_to_array('crispy,quick',','),string_to_array('Crispy chicken,Slaw,Sriracha mayo',','),120),
 ('brownie','Fudge Brownie','Finish on a high.',200,'Snacks','🍰',string_to_array('sweet',','),string_to_array('Dark chocolate,Sea salt,Warm centre',','),130),
 ('milkshake','Thick Milkshake','So thick the straw stands up.',280,'Drinks','🥤',string_to_array('sweet',','),string_to_array('Vanilla,Chocolate,Strawberry',','),140),
 ('soda','Soft Drink','Ice cold.',100,'Drinks','🥤',string_to_array('quick,sweet',','),string_to_array('Coke,Fanta,Sprite',','),150),
 ('combo-class','The After-Class Combo','For one. Fast and filling.',499,'Combos','🍱',string_to_array('filling,quick',','),string_to_array('Burger,Chips,Soda',','),160)
on conflict(id) do nothing;