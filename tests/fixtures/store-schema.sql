-- Isolated fixture, NOT a production schema.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
grant usage on schema public,auth to anon,authenticated,service_role;
create table categories(id uuid primary key default gen_random_uuid(),name text,slug text);
create table products(id uuid primary key default gen_random_uuid(),name text not null,price numeric,sale_price numeric,
 stock integer,is_active boolean,sku text,category_id uuid,description text);
create table orders(id uuid primary key default gen_random_uuid(),order_number text unique not null,user_id uuid,
 billing jsonb,customer_name text,customer_email text,customer_phone text,shipping_address jsonb,total_amount numeric not null,
 status text,payment_status text,payment_method text,shipping_method text,shipping_cost numeric,notes text,invoice jsonb,proforma jsonb,
 created_at timestamptz default now(),updated_at timestamptz);
create table order_items(id uuid primary key default gen_random_uuid(),order_id uuid references orders(id),
 product_id uuid references products(id),product_name text,quantity integer not null check(quantity>0),unit_price numeric not null,total_price numeric not null);
create table contact_requests(id uuid primary key default gen_random_uuid(),name text,email text,phone text,material text,message text,type text,file_url text,status text,created_at timestamptz);
grant all on all tables in schema public to anon,authenticated,service_role;
-- Deliberately unsafe old grants, constrained by the new restrictive policies.
alter table products enable row level security;
create policy old_open_products on products for all to anon,authenticated using(true) with check(true);
alter table orders enable row level security;
create policy old_open_orders on orders for all to anon,authenticated using(true) with check(true);
alter table contact_requests enable row level security;
create policy old_open_contacts on contact_requests for all to anon,authenticated using(true) with check(true);
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
grant usage on schema storage to anon,authenticated,service_role;
grant all on all tables in schema storage to anon,authenticated,service_role;
alter table storage.objects enable row level security;
create policy old_open_storage on storage.objects for all to anon,authenticated using(true) with check(true);
insert into storage.buckets values('products','products',true,null);
