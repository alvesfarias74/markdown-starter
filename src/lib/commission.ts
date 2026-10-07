// Comissão da plataforma. O cálculo oficial é feito no banco (trigger em jobs);
// este valor é usado apenas para exibição.
export const PLATFORM_COMMISSION_RATE = 0.08;
export const PLATFORM_COMMISSION_LABEL = "8%";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const JOB_STATUS = {
  scheduled: "Agendado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
} as const;

export const URGENCY = {
  baixa: "Sem pressa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
} as const;

export const VERIFICATION_STATUS = {
  not_sent: "Não enviada",
  pending: "Em análise",
  verified: "Verificado",
  needs_fix: "Necessita correção",
} as const;
