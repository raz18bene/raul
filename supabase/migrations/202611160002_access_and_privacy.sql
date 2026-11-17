-- REVIEW ONLY: changes permissions. Verify real policies, columns and admin claims before approval.
begin;
create table if not exists public.oblio_operations (
  order_id uuid not null references public.orders(id),kind text not null check(kind in ('invoice','proforma','notice')),
  state text not null check(state in ('pending','completed')),result jsonb,created_at timestamptz not null default now(),
  primary key(order_id,kind)
);
alter table public.oblio_operations enable row level security;
revoke all on public.oblio_operations from public,anon,authenticated;
grant all on public.oblio_operations to service_role;
-- Restrictive guards constrain older permissive policies, without dropping them.
do $$ declare t text; op text; policy text; begin
  foreach t in array array['products','categories','orders','order_items','contact_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    foreach op in array array['insert','update','delete'] loop
      policy := 'security_admin_'||op;
      execute format('drop policy if exists %I on public.%I',policy,t);
      if op='insert' then
        execute format('create policy %I on public.%I as restrictive for insert to anon,authenticated with check ((auth.jwt()->''app_metadata''->>''role'')=''admin'')',policy,t);
      elsif op='update' then
        execute format('create policy %I on public.%I as restrictive for update to anon,authenticated using ((auth.jwt()->''app_metadata''->>''role'')=''admin'') with check ((auth.jwt()->''app_metadata''->>''role'')=''admin'')',policy,t);
      else
        execute format('create policy %I on public.%I as restrictive for delete to anon,authenticated using ((auth.jwt()->''app_metadata''->>''role'')=''admin'')',policy,t);
      end if;
    end loop;
    execute format('drop policy if exists security_admin_access on public.%I',t);
    execute format('create policy security_admin_access on public.%I for all to authenticated using ((auth.jwt()->''app_metadata''->>''role'')=''admin'') with check ((auth.jwt()->''app_metadata''->>''role'')=''admin'')',t);
  end loop;
end $$;
drop policy if exists security_order_read on public.orders;
create policy security_order_read on public.orders as restrictive for select to anon,authenticated
 using ((auth.jwt()->'app_metadata'->>'role')='admin' or (auth.uid() is not null and user_id=auth.uid()));
drop policy if exists security_items_read on public.order_items;
create policy security_items_read on public.order_items as restrictive for select to anon,authenticated
 using ((auth.jwt()->'app_metadata'->>'role')='admin' or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
drop policy if exists security_contact_read on public.contact_requests;
create policy security_contact_read on public.contact_requests as restrictive for select to anon,authenticated
 using ((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists security_own_orders on public.orders;
create policy security_own_orders on public.orders for select to authenticated using(user_id=auth.uid());
drop policy if exists security_own_items on public.order_items;
create policy security_own_items on public.order_items for select to authenticated
 using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
commit;
