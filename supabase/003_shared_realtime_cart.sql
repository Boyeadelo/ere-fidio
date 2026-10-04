-- Task 3: shared web/mobile cart with realtime updates.
-- Run after schema.sql and 002_hng_completion.sql.

create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists cart_items_user_idx on public.cart_items(user_id);

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at
  before update on public.cart_items
  for each row execute procedure public.set_updated_at();

alter table public.cart_items enable row level security;
grant select, insert, update, delete on public.cart_items to authenticated;

drop policy if exists "Users read their own cart" on public.cart_items;
create policy "Users read their own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users add to their own cart" on public.cart_items;
create policy "Users add to their own cart"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own cart" on public.cart_items;
create policy "Users update their own cart"
  on public.cart_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users remove from their own cart" on public.cart_items;
create policy "Users remove from their own cart"
  on public.cart_items for delete
  using (auth.uid() = user_id);

create or replace function public.set_cart_item(
  p_product_id uuid,
  p_quantity integer,
  p_mode text default 'set'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_stock integer;
  v_quantity integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select stock into v_stock
  from public.products
  where id = p_product_id and is_published = true and is_archived = false;

  if v_stock is null then
    raise exception 'Product unavailable';
  end if;

  if p_mode = 'increment' then
    insert into public.cart_items (user_id, product_id, quantity)
    values (v_user_id, p_product_id, least(greatest(p_quantity, 1), v_stock))
    on conflict (user_id, product_id) do update
      set quantity = least(public.cart_items.quantity + greatest(p_quantity, 1), v_stock),
          updated_at = now()
    returning quantity into v_quantity;
  elsif p_quantity <= 0 then
    delete from public.cart_items
    where user_id = v_user_id and product_id = p_product_id;
    return 0;
  else
    insert into public.cart_items (user_id, product_id, quantity)
    values (v_user_id, p_product_id, least(p_quantity, v_stock))
    on conflict (user_id, product_id) do update
      set quantity = least(excluded.quantity, v_stock),
          updated_at = now()
    returning quantity into v_quantity;
  end if;

  return v_quantity;
end;
$$;

grant execute on function public.set_cart_item(uuid, integer, text) to authenticated;

create or replace function public.merge_guest_cart(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_product_id uuid;
  v_guest_quantity integer;
  v_cloud_quantity integer;
  v_stock integer;
  v_final_quantity integer;
  v_duplicate_titles text[] := array[]::text[];
  v_title text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Cart items must be an array';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'id')::uuid;
      v_guest_quantity := greatest(coalesce((v_item ->> 'quantity')::integer, 0), 0);
    exception when others then
      continue;
    end;

    if v_guest_quantity = 0 then continue; end if;

    select title, stock into v_title, v_stock
    from public.products
    where id = v_product_id and is_published = true and is_archived = false;
    if v_stock is null or v_stock = 0 then continue; end if;

    select quantity into v_cloud_quantity
    from public.cart_items
    where user_id = v_user_id and product_id = v_product_id;

    if v_cloud_quantity is not null then
      v_duplicate_titles := array_append(v_duplicate_titles, v_title);
    end if;

    v_final_quantity := least(coalesce(v_cloud_quantity, 0) + v_guest_quantity, v_stock);
    insert into public.cart_items (user_id, product_id, quantity)
    values (v_user_id, v_product_id, v_final_quantity)
    on conflict (user_id, product_id) do update
      set quantity = excluded.quantity, updated_at = now();
  end loop;

  return jsonb_build_object(
    'duplicateTitles', to_jsonb(v_duplicate_titles),
    'hadDuplicates', cardinality(v_duplicate_titles) > 0
  );
end;
$$;

grant execute on function public.merge_guest_cart(jsonb) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.cart_items;
exception
  when duplicate_object then null;
end $$;
