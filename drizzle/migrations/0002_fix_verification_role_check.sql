create or replace function public.protect_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt()->>'role', '') in ('authenticated','anon') then
    if tg_op = 'UPDATE' and old.status = 'verified' then
      raise exception 'Perfil já verificado';
    end if;
    new.status := 'pending';
    new.reviewer_notes := case when tg_op = 'UPDATE' then old.reviewer_notes else null end;
    new.reviewed_at := null;
    new.submitted_at := now();
  end if;
  update public.professionals set is_verified = (new.status = 'verified') where id = new.professional_id;
  return new;
end $$;