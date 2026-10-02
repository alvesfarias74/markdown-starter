create type public.app_role as enum ('admin', 'moderator', 'professional', 'client');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text not null unique,
  display_name text not null,
  headline text,
  specialties text[] not null default '{}',
  category_slugs text[] not null default '{}',
  experience_range text,
  experience_text text,
  bio text,
  city text,
  state text,
  neighborhoods text[] not null default '{}',
  max_distance_km integer,
  is_available boolean not null default true,
  schedule jsonb not null default '{}'::jsonb,
  price_from numeric(10,2),
  price_unit text,
  avatar_url text,
  is_verified boolean not null default false,
  services_count integer not null default 0,
  rating_avg numeric(3,2),
  rating_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','suspended')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index professionals_status_idx on public.professionals(status);
create index professionals_categories_idx on public.professionals using gin(category_slugs);
grant select on public.professionals to anon;
grant select, insert, update on public.professionals to authenticated;
grant all on public.professionals to service_role;
alter table public.professionals enable row level security;
create policy "Published professionals are public" on public.professionals for select to anon, authenticated using (status = 'published');
create policy "Owner reads own" on public.professionals for select to authenticated using (auth.uid() = user_id);
create policy "Owner inserts own" on public.professionals for insert to authenticated with check (auth.uid() = user_id and status = 'draft' and is_verified = false and services_count = 0 and rating_count = 0);
create policy "Owner updates own" on public.professionals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.protect_professional_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_verified := old.is_verified;
    new.services_count := old.services_count;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.user_id := old.user_id;
    if old.status = 'suspended' then new.status := 'suspended'; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger professionals_protect before update on public.professionals
for each row execute function public.protect_professional_columns();

create or replace function public.grant_professional_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles(user_id, role) values (new.user_id, 'professional') on conflict do nothing;
  return new;
end $$;
create trigger professionals_grant_role after insert on public.professionals
for each row execute function public.grant_professional_role();

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  title text not null,
  description text,
  category_slug text,
  photos text[] not null default '{}',
  before_photo text,
  after_photo text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_items_pro_idx on public.portfolio_items(professional_id);
grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant all on public.portfolio_items to service_role;
alter table public.portfolio_items enable row level security;
create policy "Portfolio of published pros is public" on public.portfolio_items for select to anon, authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.status = 'published'));
create policy "Owner manages portfolio" on public.portfolio_items for all to authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create policy "Media public read" on storage.objects for select using (bucket_id = 'professional-media');
create policy "Media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'professional-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Media owner update" on storage.objects for update to authenticated
  using (bucket_id = 'professional-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'professional-media' and (storage.foldername(name))[1] = auth.uid()::text);