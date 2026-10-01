import {
  Home, Sparkles, HardHat, Zap, Droplets, Trees, Hammer, Laptop, Car, GraduationCap, Wrench, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

// Taxonomia inicial. Futuramente virá do banco de dados (tabela de categorias),
// mantendo o mesmo formato (slug estável) para não quebrar URLs.
export type Category = {
  slug: string;
  name: string;
  icon: LucideIcon;
  examples: string[];
};

export const CATEGORIES: Category[] = [
  { slug: "casa-e-manutencao", name: "Casa e manutenção", icon: Home, examples: ["Faz-tudo", "Serviços gerais"] },
  { slug: "limpeza", name: "Limpeza", icon: Sparkles, examples: ["Diarista", "Faxineira(o)"] },
  { slug: "construcao", name: "Construção", icon: HardHat, examples: ["Pedreiro", "Pintor"] },
  { slug: "eletrica", name: "Elétrica", icon: Zap, examples: ["Eletricista"] },
  { slug: "hidraulica", name: "Hidráulica", icon: Droplets, examples: ["Encanador"] },
  { slug: "jardinagem", name: "Jardinagem", icon: Trees, examples: ["Jardineiro"] },
  { slug: "marcenaria", name: "Marcenaria", icon: Hammer, examples: ["Marceneiro", "Carpinteiro"] },
  { slug: "tecnologia", name: "Tecnologia", icon: Laptop, examples: ["Técnico de informática"] },
  { slug: "automotivo", name: "Automotivo", icon: Car, examples: ["Mecânico"] },
  { slug: "educacao", name: "Educação", icon: GraduationCap, examples: ["Professor particular"] },
  { slug: "montagem-e-instalacao", name: "Montagem e instalação", icon: Wrench, examples: ["Montador de móveis", "Técnico de ar-condicionado"] },
  { slug: "outros", name: "Outros", icon: MoreHorizontal, examples: ["Costureira", "Fotógrafo", "Cuidador"] },
];

export const findCategory = (slug?: string) => CATEGORIES.find((c) => c.slug === slug);
