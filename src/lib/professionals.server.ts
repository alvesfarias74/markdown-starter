import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { scheduleSchema, type ProfessionalView } from "./professional";

export const MEDIA_BUCKET = "professional-media";

type Client = SupabaseClient<Database>;
type ProRow = Database["public"]["Tables"]["professionals"]["Row"];
type PortfolioRow = Database["public"]["Tables"]["portfolio_items"]["Row"];

export function publicClient(): Client {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Converte caminhos do storage privado em URLs assinadas temporárias.
export async function signPaths(client: Client, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await client.storage.from(MEDIA_BUCKET).createSignedUrls(unique, 60 * 60 * 6);
  data?.forEach((d) => { if (d.path && d.signedUrl) map.set(d.path, d.signedUrl); });
  return map;
}

export async function toView(client: Client, pro: ProRow, portfolio: PortfolioRow[]): Promise<ProfessionalView> {
  const urls = await signPaths(client, [
    pro.avatar_url,
    ...portfolio.flatMap((p) => [...p.photos, p.before_photo, p.after_photo]),
  ]);
  const u = (p: string | null) => (p ? urls.get(p) ?? null : null);
  const schedule = scheduleSchema.safeParse(pro.schedule);
  return {
    slug: pro.slug,
    display_name: pro.display_name,
    headline: pro.headline,
    specialties: pro.specialties,
    experience_range: pro.experience_range,
    experience_text: pro.experience_text,
    bio: pro.bio,
    city: pro.city,
    state: pro.state,
    neighborhoods: pro.neighborhoods,
    max_distance_km: pro.max_distance_km,
    is_available: pro.is_available,
    schedule: schedule.success ? schedule.data : { days: [], hours: "" },
    price_from: pro.price_from === null ? null : Number(pro.price_from),
    price_unit: pro.price_unit,
    avatar: u(pro.avatar_url),
    is_verified: pro.is_verified,
    services_count: pro.services_count,
    rating_avg: pro.rating_avg === null ? null : Number(pro.rating_avg),
    rating_count: pro.rating_count,
    portfolio: portfolio.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      photos: p.photos.map((x) => urls.get(x)).filter((x): x is string => !!x),
      before_photo: u(p.before_photo),
      after_photo: u(p.after_photo),
    })),
  };
}
