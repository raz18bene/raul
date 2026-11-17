-- SUPABASE STORAGE ONLY: review and approve first. Never privatize the product-image bucket.
begin;
insert into storage.buckets(id,name,public,file_size_limit)
 values('print3d-requests','print3d-requests',false,52428800) on conflict(id) do nothing;
do $$ begin
 if exists(select 1 from storage.buckets where id='print3d-requests' and public=true)
 then raise exception 'Existing print3d-requests bucket is public: reconcile before migration'; end if;
end $$;
drop policy if exists security_print_files on storage.objects;
create policy security_print_files on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id <> 'print3d-requests' and not(bucket_id='products' and name like 'print3d-requests/%'))
 with check(bucket_id <> 'print3d-requests' and not(bucket_id='products' and name like 'print3d-requests/%'));
-- Signed upload/download tokens are issued by the server, without anonymous blanket grants.
-- RLS DOES NOT revoke existing public URLs under products/print3d-requests.
-- Approved copy, reference update and removal of originals are a separate operation.
commit;
