-- Pedidos de serviço (criados por clientes em etapa futura)
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  target_professional_id uuid references public.professionals(id) on delete set null,
  category_slug text,
  service_name text not null,
  description text not null default '',
  city text,
  state text,
  neighborhood text,
  desired_date date,
  urgency text not null default 'normal' check (urgency in ('baixa','normal','alta','urgente')),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now()
);
create index service_requests_open_idx on public.service_requests(status, category_slug);
grant select, insert, update on public.service_requests to authenticated;
grant all on public.service_requests to service_role;
alter table public.service_requests enable row level security;
create policy "Client manages own requests" on public.service_requests for all to authenticated
  using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "Professionals see open requests" on public.service_requests for select to authenticated
  using (status = 'open' and public.has_role(auth.uid(), 'professional')
    and (target_professional_id is null or exists (select 1 from public.professionals p where p.id = target_professional_id and p.user_id = auth.uid())));

-- Orçamentos
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  amount numeric(10,2),
  message text not null default '',
  status text not null default 'sent' check (status in ('sent','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  unique (request_id, professional_id)
);
grant select, insert, update on public.quotes to authenticated;
grant all on public.quotes to service_role;
alter table public.quotes enable row level security;
create policy "Pro manages own quotes" on public.quotes for all to authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "Client sees quotes on own requests" on public.quotes for select to authenticated
  using (exists (select 1 from public.service_requests r where r.id = request_id and r.client_id = auth.uid()));

-- Serviços contratados (status e valores controlados pela plataforma)
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.service_requests(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null,
  title text not null,
  scheduled_for timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  amount numeric(10,2) not null default 0,
  platform_fee numeric(10,2) not null default 0,
  professional_net numeric(10,2) not null default 0,
  payout_status text not null default 'none' check (payout_status in ('none','pending','available','paid')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index jobs_pro_idx on public.jobs(professional_id, status);
grant select on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "Pro sees own jobs" on public.jobs for select to authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "Client sees own jobs" on public.jobs for select to authenticated using (auth.uid() = client_id);

-- Comissão da plataforma: 8%
create or replace function public.compute_job_fees()
returns trigger language plpgsql set search_path = public as $$
begin
  new.platform_fee := round(coalesce(new.amount,0) * 0.08, 2);
  new.professional_net := coalesce(new.amount,0) - new.platform_fee;
  if new.status = 'completed' and new.completed_at is null then new.completed_at := now(); end if;
  return new;
end $$;
create trigger jobs_fees before insert or update on public.jobs for each row execute function public.compute_job_fees();

-- Avaliações
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid unique references public.jobs(id) on delete set null,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null,
  client_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text,
  response text,
  response_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_pro_idx on public.reviews(professional_id, created_at desc);
grant select on public.reviews to anon;
grant select, update on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Reviews of published pros are public" on public.reviews for select to anon, authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and (p.status = 'published' or p.user_id = auth.uid())));
create policy "Pro responds to own reviews" on public.reviews for update to authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create or replace function public.protect_review_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') then
    new.rating := old.rating; new.comment := old.comment; new.client_id := old.client_id;
    new.client_name := old.client_name; new.professional_id := old.professional_id; new.job_id := old.job_id;
    new.created_at := old.created_at;
    new.response_at := case when new.response is distinct from old.response then now() else old.response_at end;
  end if;
  return new;
end $$;
create trigger reviews_protect before update on public.reviews for each row execute function public.protect_review_columns();

-- Mantém nota média e contagem de serviços no perfil
create or replace function public.refresh_professional_stats(_pro uuid)
returns void language sql security definer set search_path = public as $$
  update public.professionals set
    rating_avg = (select round(avg(rating)::numeric, 2) from public.reviews where professional_id = _pro),
    rating_count = (select count(*) from public.reviews where professional_id = _pro),
    services_count = (select count(*) from public.jobs where professional_id = _pro and status = 'completed')
  where id = _pro;
$$;
revoke execute on function public.refresh_professional_stats(uuid) from public, anon, authenticated;

create or replace function public.trg_refresh_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_professional_stats(coalesce(new.professional_id, old.professional_id));
  return null;
end $$;
create trigger reviews_stats after insert or delete or update of rating on public.reviews for each row execute function public.trg_refresh_stats();
create trigger jobs_stats after insert or delete or update of status on public.jobs for each row execute function public.trg_refresh_stats();

-- Verificação do profissional
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null unique references public.professionals(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','needs_fix')),
  document_path text not null,
  selfie_path text,
  notes text,
  reviewer_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert, update on public.verification_requests to authenticated;
grant all on public.verification_requests to service_role;
alter table public.verification_requests enable row level security;
create policy "Pro manages own verification" on public.verification_requests for all to authenticated
  using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create or replace function public.protect_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_user in ('authenticated','anon') then
    new.status := 'pending';
    new.reviewer_notes := case when tg_op = 'UPDATE' then old.reviewer_notes else null end;
    new.reviewed_at := null;
    new.submitted_at := now();
    if tg_op = 'UPDATE' and old.status = 'verified' then
      raise exception 'Perfil já verificado';
    end if;
  end if;
  update public.professionals set is_verified = (new.status = 'verified') where id = new.professional_id;
  return new;
end $$;
create trigger verification_protect before insert or update on public.verification_requests for each row execute function public.protect_verification();

-- Documentos de verificação: só o dono acessa
create policy "Verification owner read" on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Verification owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);