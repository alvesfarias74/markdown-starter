CREATE OR REPLACE FUNCTION public.matches_opportunity(_professional uuid, _target uuid, _category text, _service text, _city text, _state text, _neighborhood text, _date date)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = _professional AND p.user_id = auth.uid()
 AND p.status = 'published' AND p.is_available
 AND (_target IS NULL OR _target = p.id)
 AND _category = ANY(p.category_slugs)
 AND EXISTS (SELECT 1 FROM unnest(p.specialties) s WHERE lower(trim(s)) = lower(trim(_service)))
 AND lower(trim(coalesce(_city,''))) = lower(trim(coalesce(p.city,''))) AND _city IS NOT NULL
 AND _state = p.state AND _state IS NOT NULL
 AND (cardinality(p.neighborhoods) = 0 OR _neighborhood IS NULL OR EXISTS (SELECT 1 FROM unnest(p.neighborhoods) n WHERE lower(trim(n)) = lower(trim(_neighborhood))))
 AND (_date IS NULL OR jsonb_array_length(coalesce(p.schedule->'days','[]'::jsonb)) = 0 OR (p.schedule->'days') ? (ARRAY['dom','seg','ter','qua','qui','sex','sab'])[extract(dow FROM _date)::integer + 1]));
$$;
REVOKE ALL ON FUNCTION public.matches_opportunity(uuid,uuid,text,text,text,text,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.matches_opportunity(uuid,uuid,text,text,text,text,text,date) TO authenticated, service_role;
DROP POLICY "Professionals see open requests" ON public.service_requests;
CREATE POLICY "Professionals see compatible requests" ON public.service_requests FOR SELECT TO authenticated USING (
 (status = 'open' AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.user_id = auth.uid() AND public.matches_opportunity(p.id,target_professional_id,category_slug,service_name,city,state,neighborhood,desired_date)))
 OR EXISTS (SELECT 1 FROM public.quotes q JOIN public.professionals p ON p.id=q.professional_id WHERE q.request_id=service_requests.id AND p.user_id=auth.uid())
);
DROP POLICY "Pro manages own quotes" ON public.quotes;
CREATE POLICY "Pro reads own quotes" ON public.quotes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id=professional_id AND p.user_id=auth.uid()));
CREATE POLICY "Pro sends compatible quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (status='sent' AND EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id=request_id AND r.status='open' AND public.matches_opportunity(professional_id,r.target_professional_id,r.category_slug,r.service_name,r.city,r.state,r.neighborhood,r.desired_date)));
GRANT INSERT, UPDATE ON public.jobs TO authenticated;
CREATE POLICY "Pro registers own manual jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (client_id=auth.uid() AND request_id IS NULL AND quote_id IS NULL AND status='scheduled' AND payout_status='none' AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id=professional_id AND p.user_id=auth.uid()));
CREATE POLICY "Pro updates own job status" ON public.jobs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id=professional_id AND p.user_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id=professional_id AND p.user_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.compute_job_fees() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN ('authenticated','anon') THEN
  IF TG_OP='INSERT' THEN
   IF new.amount < 1 OR new.amount > 1000000 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
   new.payout_status := 'none'; new.completed_at := NULL;
  ELSE
   new.id:=old.id; new.professional_id:=old.professional_id; new.client_id:=old.client_id; new.request_id:=old.request_id; new.quote_id:=old.quote_id;
   new.amount:=old.amount; new.title:=old.title; new.scheduled_for:=old.scheduled_for; new.created_at:=old.created_at;
   new.payout_status:=old.payout_status; new.completed_at:=old.completed_at;
   IF new.status IS DISTINCT FROM old.status THEN
    IF NOT ((old.status='scheduled' AND new.status IN ('in_progress','completed','cancelled')) OR (old.status='in_progress' AND new.status IN ('completed','cancelled'))) THEN RAISE EXCEPTION 'Transição de serviço inválida'; END IF;
    IF new.status='completed' THEN new.completed_at:=now(); new.payout_status:='pending'; END IF;
   END IF;
  END IF;
 END IF;
 new.platform_fee:=round(coalesce(new.amount,0)*0.08,2);
 new.professional_net:=coalesce(new.amount,0)-new.platform_fee;
 IF new.status='completed' AND new.completed_at IS NULL THEN new.completed_at:=now(); END IF;
 RETURN new;
END $$;
CREATE OR REPLACE FUNCTION public.dashboard_totals(_professional uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT jsonb_build_object('inProgress',count(*) FILTER (WHERE status='in_progress'),'completed',count(*) FILTER (WHERE status='completed'),
 'pending',coalesce(sum(professional_net) FILTER (WHERE status='completed' AND payout_status='pending'),0),
 'available',coalesce(sum(professional_net) FILTER (WHERE status='completed' AND payout_status='available'),0),
 'received',coalesce(sum(professional_net) FILTER (WHERE status='completed' AND payout_status='paid'),0),
 'gross',coalesce(sum(amount) FILTER (WHERE status='completed'),0),'fees',coalesce(sum(platform_fee) FILTER (WHERE status='completed'),0))
 FROM public.jobs WHERE professional_id=_professional AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id=_professional AND p.user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.dashboard_totals(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dashboard_totals(uuid) TO authenticated,service_role;