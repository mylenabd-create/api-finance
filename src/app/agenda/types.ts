import type { Tables } from "@/lib/database.types";

export type Pessoa = Tables<"pessoa">;
export type Compromisso = Tables<"compromisso">;
export type Tarefa = Tables<"tarefa">;

export type CompromissoComPessoa = Compromisso & {
  pessoa: Pessoa | null;
};

export type TarefaComPessoa = Tarefa & {
  pessoa: Pessoa | null;
  // recalculado no fetch: prazo < hoje && status != 'concluida'
  atrasadaCalculada: boolean;
};

export type TipoCompromisso = Compromisso["tipo"];
export type StatusTarefa = Tarefa["status"];
export type PrioridadeTarefa = Tarefa["prioridade"];
