-- PostgreSQL target (single source of truth). lib/store.ts mirrors this shape in memory for the demo.
create type role as enum ('ADMIN','MANAGER','KITCHEN','STAFF');
create type order_status as enum ('PENDING_PAYMENT','PAID','PREPARING','READY','COMPLETED','CANCELLED','PAYMENT_FAILED');
create table users(id serial primary key,email text unique not null,password_hash text not null,role role not null);
create table customers(id serial primary key,phone text unique not null,name text,orders_count int default 0,created_at timestamptz default now());
create table menu_items(id text primary key,name text not null,description text,price_kes int not null,category text,sold_out bool default false,active bool default true);
create table deals(id serial primary key,title text,item_id text references menu_items,discount_pct int,starts_at timestamptz,ends_at timestamptz);
create sequence order_no_seq start 1042;
create table orders(id serial primary key,order_no int unique default nextval('order_no_seq'),customer_id int references customers,phone text not null,
 status order_status default 'PENDING_PAYMENT',total_kes int not null,pickup_time timestamptz,notes text,idempotency_key text unique not null,
 checkout_request_id text unique,mpesa_receipt text unique,created_at timestamptz default now(),paid_at timestamptz,ready_at timestamptz);
create table order_items(order_id int references orders,item_id text references menu_items,qty int,unit_price_kes int,note text);
create table reservations(id serial primary key,name text,phone text,date date,time text,guests int,requests text,status text default 'NEW');
create table catering_requests(id serial primary key,name text,company text,phone text,email text,event_type text,guests int,date date,details text,status text default 'NEW');