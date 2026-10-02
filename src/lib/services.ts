// Catálogo inicial de serviços pesquisáveis no cadastro. Cada serviço pertence a
// uma categoria (slug estável de categories.ts). Futuramente migrará para o banco.
export type ServiceItem = { name: string; category: string };

const raw: Record<string, string[]> = {
  "casa-e-manutencao": ["Faz-tudo", "Serviços gerais", "Pequenos reparos", "Troca de fechaduras", "Instalação de cortinas e persianas"],
  limpeza: ["Diarista", "Faxineira(o)", "Limpeza pós-obra", "Limpeza de estofados", "Passadeira"],
  construcao: ["Pedreiro", "Pintor", "Gesseiro", "Azulejista", "Reformas em geral", "Telhadista"],
  eletrica: ["Eletricista", "Manutenção elétrica", "Instalação de tomadas", "Instalador de ventiladores", "Instalação de chuveiro", "Quadro de energia"],
  hidraulica: ["Encanador", "Desentupimento", "Conserto de vazamentos", "Instalação de caixa d'água"],
  jardinagem: ["Jardineiro", "Poda de árvores", "Corte de grama", "Paisagismo"],
  marcenaria: ["Marceneiro", "Carpinteiro", "Móveis planejados", "Restauração de móveis"],
  tecnologia: ["Técnico de informática", "Formatação de computador", "Instalação de redes e Wi-Fi", "Conserto de celular", "Instalação de câmeras"],
  automotivo: ["Mecânico", "Eletricista automotivo", "Lavagem automotiva", "Funilaria e pintura"],
  educacao: ["Professor particular", "Reforço escolar", "Aulas de idiomas", "Aulas de música"],
  "montagem-e-instalacao": ["Montador de móveis", "Técnico de ar-condicionado", "Instalação de suportes de TV", "Instalação de eletrodomésticos"],
  outros: ["Costureira", "Fotógrafo", "Cuidador", "Cuidador de idosos", "Babá", "Cabeleireiro(a)", "Manicure", "Personal trainer"],
};

export const SERVICES: ServiceItem[] = Object.entries(raw).flatMap(([category, names]) =>
  names.map((name) => ({ name, category })),
);

export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const categoryOfService = (name: string) => SERVICES.find((s) => s.name === name)?.category ?? "outros";
