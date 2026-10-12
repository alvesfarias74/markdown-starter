import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase
      .from("professionals")
      .select("id, slug, status, display_name, is_available, category_slugs, city, state, is_verified, rating_avg, rating_count, services_count")
      .eq("user_id", userId)
      .maybeSingle();
    if (!pro) return { pro: null };

    const [received, quotesRes, jobsRes, reviewsRes, verifRes] = await Promise.all([
      supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("target_professional_id", pro.id),
      supabase.from("quotes").select("id, request_id, amount, message, status, created_at, service_requests(service_name, city, state, neighborhood, urgency)").eq("professional_id", pro.id).order("created_at", { ascending: false }),
      supabase.from("jobs").select("id, title, status, scheduled_for, amount, platform_fee, professional_net, payout_status, completed_at, created_at").eq("professional_id", pro.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("reviews").select("id, client_name, rating, comment, response, response_at, created_at").eq("professional_id", pro.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("verification_requests").select("status, reviewer_notes, submitted_at, reviewed_at").eq("professional_id", pro.id).maybeSingle(),
    ]);

    const jobs = jobsRes.data ?? [];
    const quotes = quotesRes.data ?? [];
    const by = (s: JobStatus) => jobs.filter((j) => j.status === s);
    const sum = (rows: typeof jobs, k: "amount" | "platform_fee" | "professional_net") => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
    const quotedIds = new Set(quotes.map((q) => q.request_id));

    // Oportunidades compatíveis: serviço + região + disponibilidade.
    let opportunities: {
      id: string; service_name: string; description: string; city: string | null; state: string | null;
      neighborhood: string | null; desired_date: string | null; urgency: string; created_at: string; direct: boolean;
    }[] = [];
    if (pro.is_available && pro.category_slugs.length) {
      let q = supabase
        .from("service_requests")
        .select("id, service_name, description, city, state, neighborhood, desired_date, urgency, created_at, target_professional_id, category_slug")
        .eq("status", "open")
        .or(`category_slug.in.(${pro.category_slugs.join(",")}),target_professional_id.eq.${pro.id}`)
        .order("created_at", { ascending: false })
        .limit(30);
      if (pro.city) q = q.ilike("city", pro.city.replace(/[%_,()]/g, ""));
      const { data } = await q;
      opportunities = (data ?? [])
        .filter((r) => !quotedIds.has(r.id))
        .map((r) => ({ ...r, description: r.description.slice(0, 220), direct: r.target_professional_id === pro.id }));
    }

    const completed = by("completed");
    return {
      pro,
      stats: {
        received: received.count ?? 0,
        quotesSent: quotes.length,
        inProgress: by("in_progress").length,
        completed: completed.length,
        ratingAvg: pro.rating_avg === null ? null : Number(pro.rating_avg),
        ratingCount: pro.rating_count,
        earnedTotal: sum(completed.filter((j) => j.payout_status === "paid"), "professional_net"),
      },
      jobs: jobs.map((j) => ({ ...j, amount: Number(j.amount), platform_fee: Number(j.platform_fee), professional_net: Number(j.professional_net) })),
      quotes: quotes.map((q) => {
        const sr = Array.isArray(q.service_requests) ? q.service_requests[0] : q.service_requests;
        return {
          id: q.id,
          request_id: q.request_id,
          amount: q.amount !== null ? Number(q.amount) : null,
          message: q.message,
          status: q.status,
          created_at: q.created_at,
          service_name: sr?.service_name ?? "Serviço solicitado",
          location: [sr?.neighborhood, sr?.city, sr?.state].filter(Boolean).join(", "),
          urgency: sr?.urgency ?? "normal",
        };
      }),
      earnings: {
        pending: sum(completed.filter((j) => j.payout_status === "pending"), "professional_net"),
        available: sum(completed.filter((j) => j.payout_status === "available"), "professional_net"),
        received: sum(completed.filter((j) => j.payout_status === "paid"), "professional_net"),
        gross: sum(completed, "amount"),
        fees: sum(completed, "platform_fee"),
      },
      reviews: reviewsRes.data ?? [],
      opportunities,
      verification: verifRes.data ?? null,
    };
  });

export const setAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ is_available: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("professionals").update({ is_available: data.is_available }).eq("user_id", context.userId);
    if (error) throw new Error("Não foi possível atualizar.");
    return { ok: true };
  });

export const sendQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      request_id: z.string().uuid(),
      amount: z.number().min(0).max(1_000_000).nullable(),
      message: z.string().trim().min(10, "Escreva uma mensagem de pelo menos 10 caracteres").max(1000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase.from("professionals").select("id, status").eq("user_id", userId).maybeSingle();
    if (!pro || pro.status !== "published") throw new Error("Publique seu perfil para enviar orçamentos.");
    const { data: req } = await supabase.from("service_requests").select("id, status").eq("id", data.request_id).maybeSingle();
    if (!req || req.status !== "open") throw new Error("Esta solicitação não está mais disponível.");
    const { error } = await supabase.from("quotes").insert({ ...data, professional_id: pro.id });
    if (error) throw new Error(error.code === "23505" ? "Você já enviou orçamento para esta solicitação." : "Não foi possível enviar o orçamento.");
    return { ok: true };
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle();
    if (!pro) throw new Error("Perfil não encontrado.");

    const updatePayload: { status: string; completed_at?: string | null; payout_status?: string } = {
      status: data.status,
    };
    if (data.status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.payout_status = "pending";
    }

    const { error } = await supabase
      .from("jobs")
      .update(updatePayload)
      .eq("id", data.id)
      .eq("professional_id", pro.id);

    if (error) throw new Error("Não foi possível atualizar o serviço.");
    return { ok: true };
  });

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      title: z.string().trim().min(2, "Informe o título do serviço").max(120),
      amount: z.number().min(1, "Valor inválido").max(1_000_000),
      scheduled_for: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle();
    if (!pro) throw new Error("Perfil não encontrado.");

    const platform_fee = Number((data.amount * 0.08).toFixed(2));
    const professional_net = Number((data.amount - platform_fee).toFixed(2));

    const { error } = await supabase.from("jobs").insert({
      title: data.title,
      amount: data.amount,
      scheduled_for: data.scheduled_for || null,
      professional_id: pro.id,
      client_id: userId,
      status: "scheduled",
      platform_fee,
      professional_net,
      payout_status: "pending",
    });

    if (error) throw new Error("Não foi possível registrar o serviço.");
    return { ok: true };
  });

export const respondReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid(), response: z.string().trim().min(2).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reviews").update({ response: data.response }).eq("id", data.id);
    if (error) throw new Error("Não foi possível responder.");
    return { ok: true };
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      document_path: z.string().max(300),
      selfie_path: z.string().max(300).nullable(),
      notes: z.string().trim().max(500).nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prefix = `${userId}/`;
    if (!data.document_path.startsWith(prefix) || (data.selfie_path && !data.selfie_path.startsWith(prefix))) throw new Error("Arquivo inválido.");
    const { data: pro } = await supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle();
    if (!pro) throw new Error("Crie seu perfil primeiro.");
    const { error } = await supabase.from("verification_requests").upsert({ ...data, professional_id: pro.id }, { onConflict: "professional_id" });
    if (error) throw new Error("Não foi possível enviar.");
    return { ok: true };
  });
