-- Maison Shaydo: tikuvchi-dizayner portfolio sayti uchun baza sxemasi

-- Adminlar ro'yxati
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Sayt sozlamalari (kalit -> JSON)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Dizayn mavzulari
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name jsonb not null default '{}'::jsonb,
  tokens jsonb not null default '{}'::jsonb,
  is_builtin boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Toifalar
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null default '{}'::jsonb,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Loyihalar
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  fabric jsonb not null default '{}'::jsonb,
  fabric_image_url text,
  year int check (year is null or (year between 1900 and 2100)),
  category_id uuid references public.categories(id) on delete set null,
  cover_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_category_idx on public.projects(category_id);

-- Loyiha rasmlari
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  original_url text,
  mode text not null default 'original' check (mode in ('original','nobg','mannequin')),
  bg_color text,
  caption jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_images_project_idx on public.project_images(project_id);

-- Ilmiy ishlar
create table if not exists public.research (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default '{}'::jsonb,
  venue jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  year int check (year is null or (year between 1900 and 2100)),
  file_url text,
  link_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Yutuqlar
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default '{}'::jsonb,
  issuer jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  year int check (year is null or (year between 1900 and 2100)),
  image_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Aloqa formasidan kelgan xabarlar
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  contact text not null check (char_length(contact) between 3 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();
drop trigger if exists themes_touch on public.themes;
create trigger themes_touch before update on public.themes for each row execute function public.touch_updated_at();
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();

-- RLS
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.themes enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.research enable row level security;
alter table public.achievements enable row level security;
alter table public.messages enable row level security;

create policy "admins_select_self" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "settings_read" on public.settings for select to anon, authenticated using (true);
create policy "settings_admin_insert" on public.settings for insert to authenticated with check ((select public.is_admin()));
create policy "settings_admin_update" on public.settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "settings_admin_delete" on public.settings for delete to authenticated using ((select public.is_admin()));

create policy "themes_read" on public.themes for select to anon, authenticated using (true);
create policy "themes_admin_insert" on public.themes for insert to authenticated with check ((select public.is_admin()));
create policy "themes_admin_update" on public.themes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "themes_admin_delete" on public.themes for delete to authenticated using ((select public.is_admin()) and not is_builtin);

create policy "categories_read" on public.categories for select to anon, authenticated using (true);
create policy "categories_admin_insert" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "categories_admin_update" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories_admin_delete" on public.categories for delete to authenticated using ((select public.is_admin()));

create policy "projects_read" on public.projects for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "projects_admin_insert" on public.projects for insert to authenticated with check ((select public.is_admin()));
create policy "projects_admin_update" on public.projects for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "projects_admin_delete" on public.projects for delete to authenticated using ((select public.is_admin()));

create policy "project_images_read" on public.project_images for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and (p.is_published or (select public.is_admin())))
);
create policy "project_images_admin_insert" on public.project_images for insert to authenticated with check ((select public.is_admin()));
create policy "project_images_admin_update" on public.project_images for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "project_images_admin_delete" on public.project_images for delete to authenticated using ((select public.is_admin()));

create policy "research_read" on public.research for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "research_admin_insert" on public.research for insert to authenticated with check ((select public.is_admin()));
create policy "research_admin_update" on public.research for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "research_admin_delete" on public.research for delete to authenticated using ((select public.is_admin()));

create policy "achievements_read" on public.achievements for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "achievements_admin_insert" on public.achievements for insert to authenticated with check ((select public.is_admin()));
create policy "achievements_admin_update" on public.achievements for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "achievements_admin_delete" on public.achievements for delete to authenticated using ((select public.is_admin()));

create policy "messages_public_insert" on public.messages for insert to anon, authenticated with check (is_read = false);
create policy "messages_admin_select" on public.messages for select to authenticated using ((select public.is_admin()));
create policy "messages_admin_update" on public.messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "messages_admin_delete" on public.messages for delete to authenticated using ((select public.is_admin()));

-- Data API huquqlari
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.themes, public.categories, public.projects, public.project_images, public.research, public.achievements to anon, authenticated;
grant insert, update, delete on public.settings, public.themes, public.categories, public.projects, public.project_images, public.research, public.achievements to authenticated;
grant select on public.admins to authenticated;
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Fayllar uchun ommaviy bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 26214400,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "media_admin_select" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy "media_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "media_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin())) with check (bucket_id = 'media' and (select public.is_admin()));
create policy "media_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
