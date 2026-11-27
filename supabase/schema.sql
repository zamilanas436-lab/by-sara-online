-- By Sara Online — Supabase schema.
-- Run once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).
-- Safe to run again: everything uses "if not exists" / "or replace".

-- ───────── Products ─────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '',
  description text not null default '',
  price       numeric(10,2) not null default 0,
  old_price   numeric(10,2),                 -- shown crossed out when on sale
  category    text not null default '',
  sizes       text[] not null default '{}',
  colors      text[] not null default '{}',
  images      text[] not null default '{}',  -- public image URLs (first = cover)
  in_stock    boolean not null default true,
  visible     boolean not null default true, -- hidden products stay in the owner page only
  featured    boolean not null default false,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────── Store settings (one row, id = 1) ─────────
create table if not exists public.settings (
  id         integer primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ───────── Orders (customers can only create, never read) ─────────
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  customer   text not null check (char_length(customer) between 1 and 120),
  phone      text not null check (char_length(phone) between 3 and 40),
  address    text not null default '' check (char_length(address) <= 400),
  note       text not null default '' check (char_length(note) <= 1000),
  items      jsonb not null default '[]'::jsonb,
  total      numeric(10,2) not null default 0,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ───────── Permissions ─────────
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.orders   enable row level security;

grant select on public.products, public.settings to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant update on public.settings to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

drop policy if exists "everyone reads products" on public.products;
create policy "everyone reads products" on public.products for select to anon, authenticated using (true);
drop policy if exists "owner adds products" on public.products;
create policy "owner adds products" on public.products for insert to authenticated with check (true);
drop policy if exists "owner edits products" on public.products;
create policy "owner edits products" on public.products for update to authenticated using (true) with check (true);
drop policy if exists "owner deletes products" on public.products;
create policy "owner deletes products" on public.products for delete to authenticated using (true);

drop policy if exists "everyone reads settings" on public.settings;
create policy "everyone reads settings" on public.settings for select to anon, authenticated using (true);
drop policy if exists "owner edits settings" on public.settings;
create policy "owner edits settings" on public.settings for update to authenticated using (true) with check (true);

drop policy if exists "customers place orders" on public.orders;
create policy "customers place orders" on public.orders for insert to anon, authenticated
  with check (status = 'new' and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50);
drop policy if exists "owner reads orders" on public.orders;
create policy "owner reads orders" on public.orders for select to authenticated using (true);
drop policy if exists "owner updates orders" on public.orders;
create policy "owner updates orders" on public.orders for update to authenticated using (true) with check (true);
drop policy if exists "owner deletes orders" on public.orders;
create policy "owner deletes orders" on public.orders for delete to authenticated using (true);

-- ───────── Photo storage (public bucket "products") ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "owner uploads photos" on storage.objects;
create policy "owner uploads photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'products');
drop policy if exists "owner replaces photos" on storage.objects;
create policy "owner replaces photos" on storage.objects for update to authenticated
  using (bucket_id = 'products') with check (bucket_id = 'products');
drop policy if exists "owner deletes photos" on storage.objects;
create policy "owner deletes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'products');

-- ───────── Live updates ─────────
do $$ begin
  begin alter publication supabase_realtime add table public.products; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.orders;   exception when duplicate_object then null; end;
end $$;
