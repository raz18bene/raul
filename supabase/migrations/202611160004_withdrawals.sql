-- Draft migration: atomic receipt + admin inbox. Apply only after approval.
begin;
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),request_key uuid not null unique,body_hash text not null,
  name text not null,email text not null,contract text not null,message text not null,
  submitted_at timestamptz not null default now(),confirmation_sent_at timestamptz
);
alter table public.withdrawal_requests enable row level security;
revoke all on public.withdrawal_requests from public,anon,authenticated;
grant all on public.withdrawal_requests to service_role;
create or replace function public.register_withdrawal(p_key uuid,p_hash text,p_name text,p_email text,p_contract text,p_message text)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.withdrawal_requests%rowtype;
begin
  insert into public.withdrawal_requests(request_key,body_hash,name,email,contract,message)
  values(p_key,p_hash,p_name,p_email,p_contract,p_message) on conflict(request_key) do nothing;
  select * into r from public.withdrawal_requests where request_key=p_key;
  if r.body_hash is distinct from p_hash then raise exception 'Request mismatch' using errcode='22023'; end if;
  if not exists(select 1 from public.contact_requests where message like 'Retragere '||r.id::text||E'\n%') then
    insert into public.contact_requests(name,email,message,type,status,created_at)
    values(r.name,r.email,'Retragere '||r.id::text||E'\nContract: '||r.contract||E'\n'||r.message,
      'cerere-retur','new',r.submitted_at);
  end if;
  return to_jsonb(r)-'body_hash'-'request_key';
end $$;
revoke all on function public.register_withdrawal(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.register_withdrawal(uuid,text,text,text,text,text) to service_role;
commit;
