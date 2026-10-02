-- GameVault NG MVP schema.
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create type public.platform as enum ('PS5', 'PS4', 'Xbox');
create type public.order_status as enum ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
create type public.user_role as enum ('customer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  platform public.platform not null,
  description text not null default '',
  image_url text,
  price_kobo integer not null check (price_kobo > 0),
  stock integer not null default 0 check (stock >= 0),
  is_published boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percentage_off numeric(5,2) not null check (percentage_off > 0 and percentage_off <= 100),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  status public.order_status not null default 'PENDING',
  subtotal_kobo integer not null check (subtotal_kobo >= 0),
  discount_kobo integer not null default 0 check (discount_kobo >= 0),
  total_kobo integer not null check (total_kobo >= 0),
  discount_code text,
  paystack_reference text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title_snapshot text not null,
  platform_snapshot public.platform not null,
  unit_price_kobo integer not null check (unit_price_kobo > 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index products_platform_idx on public.products(platform);
create index products_published_idx on public.products(is_published, is_archived);
create index orders_user_idx on public.orders(user_id);
create index order_items_order_idx on public.order_items(order_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.discount_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- PostgREST also needs table privileges in addition to RLS policies.
grant select on public.products to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Published products are public"
  on public.products for select using (is_published = true and is_archived = false);
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can read their own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Users can read items in their own orders"
  on public.order_items for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Admin policies are intentionally role-based and server-checked.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "Admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage discounts" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed data is deliberately minimal and can be replaced through the admin dashboard.
insert into public.products (title, slug, platform, description, price_kobo, stock, is_published)
values
  ('Marvel''s Spider-Man 2', 'marvels-spider-man-2', 'PS5', 'Brand-new sealed PS5 disc.', 8500000, 8, true),
  ('EA Sports FC 25', 'ea-sports-fc-25-ps4', 'PS4', 'Brand-new sealed PS4 disc.', 5200000, 12, true),
  ('Forza Horizon 5', 'forza-horizon-5-xbox', 'Xbox', 'Brand-new sealed Xbox disc.', 6800000, 7, true)
on conflict (slug) do nothing;
