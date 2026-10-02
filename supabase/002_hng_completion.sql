-- èrè fídíò HNG completion migration.
-- Run once in the Supabase SQL Editor after supabase/schema.sql.

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.discount_codes to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;

grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.discount_codes to authenticated;
grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

update public.profiles
set role = 'admin', updated_at = now()
where id in (
  select id from auth.users where lower(email) = 'boyeadelo@gmail.com'
);

insert into public.discount_codes (code, percentage_off, is_active)
values ('WELCOME10', 10, true)
on conflict (code) do update
set percentage_off = excluded.percentage_off,
    is_active = excluded.is_active,
    expires_at = null;
