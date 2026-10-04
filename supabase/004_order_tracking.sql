-- Task 3: detailed order history and customer-visible delivery tracking.

alter type public.order_status add value if not exists 'PACKED';
alter type public.order_status add value if not exists 'DISPATCHED';
alter type public.order_status add value if not exists 'OUT_FOR_DELIVERY';

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history(order_id, created_at);

alter table public.order_status_history enable row level security;

grant select on table public.order_status_history to authenticated;
grant select, insert, update, delete on table public.order_status_history to service_role;

drop policy if exists "Users can read their own order status history" on public.order_status_history;
create policy "Users can read their own order status history"
  on public.order_status_history for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_status_history.order_id
        and orders.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage order status history" on public.order_status_history;
create policy "Admins manage order status history"
  on public.order_status_history for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists record_order_status_change on public.orders;
create trigger record_order_status_change
  after insert or update of status on public.orders
  for each row execute procedure public.record_order_status_change();

insert into public.order_status_history (order_id, status, created_at)
select orders.id, orders.status, orders.updated_at
from public.orders
where not exists (
  select 1 from public.order_status_history history
  where history.order_id = orders.id
);
