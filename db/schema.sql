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