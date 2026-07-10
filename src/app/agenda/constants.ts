import type { PrioridadeTarefa, StatusTarefa, TipoCompromisso } from "./types";

// Amarelo não tem token global (ver instruções) — usado só para o status
// "andamento" de tarefa, igual ao protótipo.
export const AMARELO = "#E0B94A";

export const tipoCompromissoMeta: Record<
  TipoCompromisso,
  { label: string; cor: string }
> = {
  trabalho: { label: "Trabalho", cor: "var(--accent)" },
  pessoal: { label: "Pessoal", cor: "var(--teal)" },
  pagamento: { label: "Pagamento", cor: "var(--coral)" },
  saude: { label: "Saúde", cor: "var(--purple)" },
};

export const statusTarefaMeta: Record<
  StatusTarefa,
  { label: string; cor: string; bg: string }
> = {
  afazer: { label: "A fazer", cor: "var(--purple)", bg: "rgba(183,124,201,0.15)" },
  andamento: { label: "Em andamento", cor: AMARELO, bg: "rgba(224,185,74,0.15)" },
  concluida: { label: "Concluída", cor: "var(--teal)", bg: "rgba(91,156,147,0.15)" },
};

export const atrasadaMeta = {
  label: "Atrasada",
  cor: "var(--coral)",
  bg: "rgba(217,118,90,0.18)",
};

export const statusOrder: StatusTarefa[] = ["afazer", "andamento", "concluida"];

export function proximoStatus(status: StatusTarefa): StatusTarefa {
  const idx = statusOrder.indexOf(status);
  return statusOrder[(idx + 1) % statusOrder.length];
}

export function corPrioridade(p: PrioridadeTarefa) {
  if (p === "alta") return "var(--coral)";
  if (p === "media") return "var(--accent)";
  return "var(--text-dim)";
}

export const prioridadeLabel: Record<PrioridadeTarefa, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
