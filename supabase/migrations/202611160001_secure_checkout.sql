-- REVIEW AND APPLY ONLY AFTER APPROVAL. Requires the real schema to be checked in staging.
begin;
create table if not exists public.order_security (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash text not null check(token_hash ~ '^[0-9a-f]{64}$'),
  amount_cents bigint not null check(amount_cents > 0 and amount_cents <= 99999999),
  currency text not null default 'ron' check(currency='ron'), created_at timestamptz not null default now()
);
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id),
  provider text not null check(provider in ('stripe','netopia')), provider_id text unique,
  amount_cents bigint not null check(amount_cents > 0), currency text not null check(currency='ron'),
  status text not null default 'creating' check(status in ('creating','open','paid','failed','expired')),
  created_at timestamptz not null default now()
);
create table if not exists public.payment_events (
  provider text not null, event_id text not null, attempt_id uuid not null references public.payment_attempts(id),
  received_at timestamptz not null default now(), primary key(provider,event_id)
);
alter table public.order_security enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.order_security,public.payment_attempts,public.payment_events from public,anon,authenticated;
grant all on public.order_security,public.payment_attempts,public.payment_events to service_role;

create or replace function public.create_secure_order(p_customer jsonb,p_items jsonb,p_user_id uuid,
  p_token_hash text,p_expected_total bigint default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.products%rowtype; o public.orders%rowtype; item jsonb; lines jsonb := '[]';
  qty integer; cents bigint; total bigint := 0; shipping bigint; oid uuid := gen_random_uuid();
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 99
    or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid order' using errcode='22023'; end if;
  if p_customer->>'payment_method' not in ('card','transfer','ramburs')
    or p_customer->>'shipping_method' not in ('sediu','sameday','easybox')
    or p_customer->>'payment_method' is null or p_customer->>'shipping_method' is null
    then raise exception 'Invalid order method' using errcode='22023'; end if;
  shipping := case when p_customer->>'shipping_method'='sediu' then 0 else 2000 end;
  if (select count(distinct (x->>'id')::uuid) from jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items)
    then raise exception 'Duplicate product' using errcode='22023'; end if;
  -- Lock rows in a deterministic order and read current catalog values atomically.
  -- This validates available stock; it is not an inventory reservation system.
  for item in select x from jsonb_array_elements(p_items) x order by x->>'id' loop
    if jsonb_typeof(item->'quantity') is distinct from 'number' or (item->>'quantity') !~ '^[0-9]+$'
      then raise exception 'Invalid quantity' using errcode='22023'; end if;
    qty := (item->>'quantity')::integer;
    if qty not between 1 and 999 then raise exception 'Invalid quantity' using errcode='22023'; end if;
    select * into p from public.products where id=(item->>'id')::uuid for update;
    if not found or p.is_active is distinct from true or p.stock is null or p.stock < qty
      then raise exception 'Product unavailable' using errcode='22023'; end if;
    if coalesce(p.sale_price,p.price) is null or coalesce(p.sale_price,p.price) < 0
      then raise exception 'Invalid catalog price' using errcode='22023'; end if;
    cents := round(coalesce(p.sale_price,p.price)::numeric * 100);
    if cents > 99999999 then raise exception 'Price exceeds limit' using errcode='22023'; end if;
    total := total + cents * qty;
    lines := lines || jsonb_build_array(jsonb_build_object('product_id',p.id,'product_name',p.name,
      'quantity',qty,'unit_price',cents::numeric/100,'total_price',(cents*qty)::numeric/100));
  end loop;
  total := total + shipping;
  if total not between 1 and 99999999 or (p_expected_total is not null and total <> p_expected_total)
    then raise exception 'Order total changed' using errcode='22023'; end if;
  -- Typed record supports existing enum or text columns without replacing them.
  select * into o from jsonb_populate_record(null::public.orders,p_customer || jsonb_build_object(
    'id',oid,'order_number','ORD-'||oid::text,'user_id',p_user_id,'status','pending','payment_status','pending',
    'total_amount',total::numeric/100,'shipping_cost',shipping::numeric/100));
  insert into public.orders(id,order_number,user_id,billing,customer_name,customer_email,customer_phone,
    shipping_address,total_amount,status,payment_status,payment_method,shipping_method,shipping_cost,notes)
  values(o.id,o.order_number,o.user_id,o.billing,o.customer_name,o.customer_email,o.customer_phone,
    o.shipping_address,o.total_amount,o.status,o.payment_status,o.payment_method,o.shipping_method,o.shipping_cost,o.notes);
  for item in select x from jsonb_array_elements(lines) x loop
    insert into public.order_items(order_id,product_id,product_name,quantity,unit_price,total_price)
    values(oid,(item->>'product_id')::uuid,item->>'product_name',(item->>'quantity')::integer,
      (item->>'unit_price')::numeric,(item->>'total_price')::numeric);
  end loop;
  insert into public.order_security(order_id,token_hash,amount_cents) values(oid,p_token_hash,total);
  return jsonb_build_object('orderId',oid,'orderNumber',o.order_number,'total',total::numeric/100);
end $$;
revoke all on function public.create_secure_order(jsonb,jsonb,uuid,text,bigint) from public,anon,authenticated;
grant execute on function public.create_secure_order(jsonb,jsonb,uuid,text,bigint) to service_role;

create or replace function public.record_verified_payment(p_attempt uuid,p_provider text,p_provider_id text,
  p_event text,p_amount bigint,p_currency text,p_paid boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare a public.payment_attempts%rowtype; o public.orders%rowtype; expected bigint; subtotal bigint;
begin
  if p_provider not in ('stripe','netopia') or p_provider is null or p_provider_id is null or length(p_provider_id)=0
    or p_event is null or length(p_event)=0 or p_amount is null or p_amount<=0 or p_currency is distinct from 'ron' or p_paid is null
    then raise exception 'Incomplete payment' using errcode='22023'; end if;
  select * into a from public.payment_attempts where id=p_attempt for update;
  if not found or a.provider is distinct from p_provider or a.provider_id is distinct from p_provider_id
    or a.amount_cents is distinct from p_amount or a.currency is distinct from p_currency
    then raise exception 'Payment mismatch' using errcode='22023'; end if;
  select * into o from public.orders where id=a.order_id for update;
  if not found then raise exception 'Missing order' using errcode='22023'; end if;
  select amount_cents into expected from public.order_security where order_id=o.id;
  select round(sum(unit_price*quantity)*100) into subtotal from public.order_items where order_id=o.id;
  if expected is distinct from p_amount or round(o.total_amount*100) is distinct from p_amount
    or subtotal+round(o.shipping_cost*100) is distinct from p_amount or o.payment_method is distinct from 'card'
    or o.status is null or o.status='cancelled'
    or exists(select 1 from public.order_items where order_id=o.id and (quantity is null or quantity not between 1 and 999
      or unit_price is null or unit_price<0 or total_price is distinct from unit_price*quantity))
    then raise exception 'Order mismatch' using errcode='22023'; end if;
  if exists(select 1 from public.payment_events where provider=p_provider and event_id=p_event) then return false; end if;
  insert into public.payment_events(provider,event_id,attempt_id) values(p_provider,p_event,p_attempt);
  if o.payment_status='paid' then return false; end if;
  if p_paid then
    update public.orders set payment_status='paid',status='processing' where id=o.id;
    update public.payment_attempts set status='paid' where id=a.id;
  else
    update public.orders set payment_status='failed' where id=o.id and payment_status<>'paid';
    update public.payment_attempts set status='failed' where id=a.id and status<>'paid';
  end if;
  return true;
end $$;
revoke all on function public.record_verified_payment(uuid,text,text,text,bigint,text,boolean) from public,anon,authenticated;
grant execute on function public.record_verified_payment(uuid,text,text,text,bigint,text,boolean) to service_role;
commit;
