import type { Tables } from "@/lib/database.types";

export type Pessoa = Tables<"pessoa">;
export type Categoria = Tables<"categoria">;
export type Meta = Tables<"meta">;
export type Transacao = Tables<"transacao">;
export type Receita = Tables<"receita">;
export type LancamentoFuturo = Tables<"lancamento_futuro">;

// Meta cruzada em JS com sua categoria (nome, cor, ícone).
export type MetaComCategoria = Meta & {
  categoria: Categoria | null;
};

// Transação cruzada em JS com categoria e pessoa.
export type TransacaoComRelacoes = Transacao & {
  categoria: Categoria | null;
  pessoa: Pessoa | null;
};

// Receita cruzada em JS com pessoa.
export type ReceitaComPessoa = Receita & {
  pessoa: Pessoa | null;
};

// Linha agregada de fatura de cartão, exibida como um único lançamento clicável.
export type FaturaAgregada = {
  faturaId: string;
  cartaoId: string;
  totalValor: number;
  qtdItens: number;
  dataMaisRecente: string;
};

export type FinancasData = {
  contaId: string;
  pessoas: Pessoa[];
  categorias: Categoria[];
  metas: MetaComCategoria[];
  transacoes: TransacaoComRelacoes[];
  transacoesCompletas: TransacaoComRelacoes[];
  faturas: FaturaAgregada[];
  receitas: ReceitaComPessoa[];
  lancamentosFuturos: LancamentoFuturo[];
  mesReferencia: string; // YYYY-MM-01
};
