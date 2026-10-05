import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  accountSchema,
  portfolioItemSchema,
  professionalPatchSchema,
  profileCompleteness,
  publishMissing,
  slugify,
} from "./professional";
import { publicClient, toView } from "./professionals.server";
import { categoryOfService } from "./services";

/* ---------- Área do profissional (autenticado) ---------- */

export const getMyProfessional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const [{ data: account }, { data: pro }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, terms_accepted_at").eq("id", userId).maybeSingle(),
      supabase.from("professionals").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const { data: portfolio } = pro
      ? await supabase.from("portfolio_items").select("*").eq("professional_id", pro.id).order("position").order("created_at")
      : { data: [] };
    const meta = (claims as { user_metadata?: Record<string, unknown> }).user_metadata ?? {};
    const view = pro ? await toView(supabase, pro, portfolio ?? []) : null;
    const completeness = profileCompleteness({
      hasAccount: !!account?.terms_accepted_at && !!account.phone && !!account.full_name,
      specialties: pro?.specialties.length ?? 0,
      hasRegion: !!pro?.city && !!pro?.state,
      hasBio: !!pro?.bio && pro.bio.trim().length >= 20,
      hasAvatar: !!pro?.avatar_url,
      portfolio: portfolio?.length ?? 0,
      hasSchedule: !!view && view.schedule.days.length > 0,
    });
    return {
      userId,
      account: account ?? {
        full_name: typeof meta["full_name"] === "string" ? (meta["full_name"] as string) : "",
        phone: typeof meta["phone"] === "string" ? (meta["phone"] as string) : null,
        terms_accepted_at: null,
      },
      accountSaved: !!account,
      pro: pro ? { ...view!, id: pro.id, status: pro.status, raw_avatar: pro.avatar_url } : null,
      portfolioRaw: portfolio ?? [],
      completeness,
    };
  });

export const saveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => accountSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      phone: data.phone,
      terms_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Não foi possível salvar seus dados.");
    // Mantém o nome da vitrine em sincronia enquanto for rascunho.
    await supabase.from("professionals").update({ display_name: data.full_name }).eq("user_id", userId).eq("status", "draft");
    return { ok: true };
  });

async function ensurePro(supabase: SupabaseClient<Database>, userId: string) {
  const { data: existing } = await supabase.from("professionals").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return existing.id;
  const { data: account } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const { data: created, error } = await supabase
    .from("professionals")
    .insert({ user_id: userId, display_name: account?.full_name || "Profissional", slug: `rascunho-${userId.slice(0, 8)}` })
    .select("id")
    .single();
  if (error) throw new Error("Não foi possível iniciar seu perfil.");
  return created.id;
}

export const saveProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => professionalPatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensurePro(supabase, userId);
    const patch: Database["public"]["Tables"]["professionals"]["Update"] = { ...data };
    if (data.specialties) {
      patch.category_slugs = [...new Set(data.specialties.map(categoryOfService))];
      if (!("headline" in data)) patch.headline = data.specialties[0] ?? null;
    }
    if (data.avatar_url && !data.avatar_url.startsWith(`${userId}/`)) throw new Error("Arquivo inválido.");
    const { error } = await supabase.from("professionals").update(patch).eq("user_id", userId);
    if (error) throw new Error("Não foi possível salvar.");
    return { ok: true };
  });

export const publishProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase.from("professionals").select("*").eq("user_id", userId).maybeSingle();
    if (!pro) return { ok: false as const, missing: ["perfil"] };
    const { data: account } = await supabase.from("profiles").select("terms_accepted_at").eq("id", userId).maybeSingle();
    const missing = publishMissing(pro);
    if (!account?.terms_accepted_at) missing.unshift("aceite dos termos");
    if (missing.length) return { ok: false as const, missing };

    let slug = pro.slug;
    if (!pro.published_at) {
      const base = slugify(`${pro.display_name} ${pro.headline ?? ""}`) || "profissional";
      slug = base;
      for (let i = 2; i < 50; i++) {
        const { data: clash } = await publicClient().from("professionals").select("id").eq("slug", slug).maybeSingle();
        const { data: own } = await supabase.from("professionals").select("id").eq("slug", slug).maybeSingle();
        if ((!clash || clash.id === pro.id) && (!own || own.id === pro.id)) break;
        slug = `${base}-${i}`;
      }
    }
    const { error } = await supabase
      .from("professionals")
      .update({ status: "published", slug, published_at: pro.published_at ?? new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error("Não foi possível publicar.");
    return { ok: true as const, slug };
  });

export const addPortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => portfolioItemSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const all = [...data.photos, data.before_photo, data.after_photo].filter(Boolean) as string[];
    if (all.some((p) => !p.startsWith(`${userId}/`))) throw new Error("Arquivo inválido.");
    if (!all.length) throw new Error("Adicione pelo menos uma foto.");
    const proId = await ensurePro(supabase, userId);
    const { error } = await supabase.from("portfolio_items").insert({ ...data, professional_id: proId });
    if (error) throw new Error("Não foi possível salvar o trabalho.");
    return { ok: true };
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolio_items").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível remover.");
    return { ok: true };
  });

/* ---------- Público ---------- */

export const getPublicProfessional = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: pro } = await client.from("professionals").select("*").eq("slug", data.slug).eq("status", "published").maybeSingle();
    if (!pro) return null;
    const { data: portfolio } = await client.from("portfolio_items").select("*").eq("professional_id", pro.id).order("position").order("created_at");
    return toView(client, pro, portfolio ?? []);
  });

const clean = (s?: string) => s?.replace(/[,()%*\\]/g, " ").trim().slice(0, 80) || undefined;

export const searchProfessionals = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ q: z.string().max(100).optional(), local: z.string().max(100).optional(), categoria: z.string().max(60).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const client = publicClient();
    let query = client
      .from("professionals")
      .select("*")
      .eq("status", "published")
      .order("is_available", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(48);
    if (data.categoria) query = query.contains("category_slugs", [data.categoria]);
    const local = clean(data.local);
    if (local) query = query.or(`city.ilike.%${local}%,state.ilike.${local}`);
    const q = clean(data.q);
    if (q) query = query.or(`headline.ilike.%${q}%,display_name.ilike.%${q}%,bio.ilike.%${q}%`);
    const { data: rows, error } = await query;
    if (error) return { results: [], error: "Busca indisponível no momento." };
    const results = await Promise.all((rows ?? []).map((r) => toView(client, r, [])));
    return { results, error: null };
  });
