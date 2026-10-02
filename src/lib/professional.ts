import { z } from "zod";

// Tipos e regras compartilhadas (cliente e servidor) do perfil profissional.

export const EXPERIENCE_OPTIONS = [
  { value: "lt1", label: "Menos de 1 ano" },
  { value: "1-3", label: "1 a 3 anos" },
  { value: "4-7", label: "4 a 7 anos" },
  { value: "8-10", label: "8 a 10 anos" },
  { value: "gt10", label: "Mais de 10 anos" },
] as const;

export const PRICE_UNITS = [
  { value: "servico", label: "Por serviço" },
  { value: "hora", label: "Por hora" },
  { value: "diaria", label: "Por diária" },
  { value: "m2", label: "Por metro quadrado" },
  { value: "combinar", label: "A combinar" },
] as const;

export const WEEK_DAYS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
] as const;

export const BR_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

export const experienceLabel = (v?: string | null) => EXPERIENCE_OPTIONS.find((o) => o.value === v)?.label;
export const priceUnitLabel = (v?: string | null) => PRICE_UNITS.find((o) => o.value === v)?.label;

export const scheduleSchema = z.object({
  days: z.array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"])).max(7).default([]),
  hours: z.string().trim().max(80).default(""),
});
export type Schedule = z.infer<typeof scheduleSchema>;

const shortText = (max: number) => z.string().trim().max(max);

export const professionalPatchSchema = z
  .object({
    display_name: shortText(80).min(2),
    headline: shortText(80).nullable(),
    specialties: z.array(shortText(60).min(1)).max(15),
    experience_range: z.enum(["lt1", "1-3", "4-7", "8-10", "gt10"]).nullable(),
    experience_text: shortText(300).nullable(),
    bio: shortText(2000).nullable(),
    city: shortText(80).nullable(),
    state: z.enum(BR_STATES).nullable(),
    neighborhoods: z.array(shortText(60).min(1)).max(30),
    max_distance_km: z.number().int().min(0).max(500).nullable(),
    is_available: z.boolean(),
    schedule: scheduleSchema,
    price_from: z.number().min(0).max(1_000_000).nullable(),
    price_unit: z.enum(["servico", "hora", "diaria", "m2", "combinar"]).nullable(),
    avatar_url: shortText(300).nullable(),
  })
  .partial();
export type ProfessionalPatch = z.infer<typeof professionalPatchSchema>;

export const accountSchema = z.object({
  full_name: shortText(80).min(2, "Informe seu nome"),
  phone: z.string().trim().regex(/^[\d\s()+-]{10,20}$/, "Telefone inválido"),
  accept_terms: z.literal(true, { errorMap: () => ({ message: "É preciso aceitar os termos" }) }),
});

export const portfolioItemSchema = z.object({
  title: shortText(100).min(2, "Dê um título ao trabalho"),
  description: shortText(600).nullable(),
  category_slug: shortText(60).nullable(),
  photos: z.array(shortText(300)).max(8),
  before_photo: shortText(300).nullable(),
  after_photo: shortText(300).nullable(),
});

// Formato usado pela página pública e pela prévia do cadastro.
export type ProfessionalView = {
  slug: string;
  display_name: string;
  headline: string | null;
  specialties: string[];
  experience_range: string | null;
  experience_text: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  neighborhoods: string[];
  max_distance_km: number | null;
  is_available: boolean;
  schedule: Schedule;
  price_from: number | null;
  price_unit: string | null;
  avatar: string | null;
  is_verified: boolean;
  services_count: number;
  rating_avg: number | null;
  rating_count: number;
  portfolio: {
    id: string;
    title: string;
    description: string | null;
    photos: string[];
    before_photo: string | null;
    after_photo: string | null;
  }[];
};

export type CompletenessInput = {
  hasAccount: boolean;
  specialties: number;
  hasRegion: boolean;
  hasBio: boolean;
  hasAvatar: boolean;
  portfolio: number;
  hasSchedule: boolean;
};

export function profileCompleteness(i: CompletenessInput) {
  const items = [
    { key: "dados", label: "Dados pessoais", done: i.hasAccount, step: 1 },
    { key: "profissao", label: "Profissão", done: i.specialties > 0, step: 2 },
    { key: "area", label: "Área de atendimento", done: i.hasRegion, step: 5 },
    { key: "descricao", label: "Descrição", done: i.hasBio, step: 4 },
    { key: "foto", label: "Foto de perfil", done: i.hasAvatar, step: 9 },
    { key: "portfolio", label: "Primeiro trabalho no portfólio", done: i.portfolio > 0, step: 8 },
    { key: "disponibilidade", label: "Disponibilidade", done: i.hasSchedule, step: 6 },
  ];
  const percent = Math.round((items.filter((x) => x.done).length / items.length) * 100);
  return { items, percent };
}

// Campos mínimos para publicar.
export function publishMissing(p: { display_name?: string | null; specialties?: string[]; city?: string | null; state?: string | null; bio?: string | null }) {
  const missing: string[] = [];
  if (!p.display_name || p.display_name.length < 2) missing.push("nome");
  if (!p.specialties?.length) missing.push("profissão");
  if (!p.city || !p.state) missing.push("cidade e estado");
  if (!p.bio || p.bio.trim().length < 20) missing.push("apresentação (mínimo 20 caracteres)");
  return missing;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
