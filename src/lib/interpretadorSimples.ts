// Interpretador gratuito (sem IA) para quando ANTHROPIC_API_KEY não está
// configurada. Entende frases curtas de dinheiro, uma ou várias por mensagem:
//   "gastei 30 de uber", "R$30 reais de mercado", "45,90 farmácia",
//   "recebi 2.000 de salário", "mercado 120 e uber 25".
// Qualquer coisa mais complexa (hábitos, tarefas, agenda, fotos de nota)
// continua dependendo da secretária com IA.
import type { LancamentoExtraido } from "@/lib/claude";

const PALAVRAS_RECEITA =
  /\b(recebi|receb[ie]|ganhei|entrou|entraram|sal[aá]rio|pix recebido|receita|reembolso|rendimento|vendi)\b/i;

// palavra-chave -> categoria padrão (criada automaticamente se não existir)
const CATEGORIAS: [RegExp, string][] = [
  [/\b(mercado|supermercado|feira|hortifruti|a[cç]ougue|padaria|atacad[aã]o)\b/i, "Mercado"],
  [/\b(uber|99|t[aá]xi|gasolina|combust[ií]vel|[oô]nibus|metr[oô]|estacionamento|ped[aá]gio|passagem)\b/i, "Transporte"],
  [/\b(ifood|restaurante|lanche|almo[cç]o|jantar|caf[eé]|pizza|delivery|bar)\b/i, "Alimentação"],
  [/\b(farm[aá]cia|rem[eé]dio|m[eé]dico|consulta|exame|dentista|academia|plano de sa[uú]de)\b/i, "Saúde"],
  [/\b(aluguel|condom[ií]nio|luz|energia|[aá]gua|g[aá]s|internet|faxina|diarista)\b/i, "Casa"],
  [/\b(cinema|show|viagem|passeio|netflix|spotify|streaming|jogo)\b/i, "Lazer"],
  [/\b(curso|livro|escola|faculdade|mensalidade|material escolar)\b/i, "Educação"],
  [/\b(roupa|sapato|loja|shopping|presente)\b/i, "Compras"],
];

// número em formato brasileiro: 30 | 30,50 | 1.200 | 1.200,00 | R$ 30
const VALOR = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:reais|real|conto|contos))?/i;

function paraNumero(bruto: string): number {
  // "1.200,50" -> 1200.50 ; "30,5" -> 30.5 ; "30.50" -> 30.50
  if (/\d\.\d{3}(\D|$)/.test(bruto) || bruto.includes(",")) {
    return Number(bruto.replace(/\./g, "").replace(",", "."));
  }
  return Number(bruto);
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function limparDescricao(trecho: string): string {
  return trecho
    .replace(VALOR, " ")
    .replace(/(?<![\p{L}\p{N}])(gastei|paguei|comprei|foi|foram|de|do|da|no|na|em|com|pra|para|o|a|um|uma|hoje|reais|real)(?![\p{L}\p{N}])/giu, " ")
    .replace(/(?<![\p{L}\p{N}])(recebi|ganhei|entrou|entraram|vendi)(?![\p{L}\p{N}])/giu, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function interpretarSemIA(
  texto: string,
  categoriasExistentes: { nome: string }[]
): LancamentoExtraido[] {
  // separa "mercado 120 e uber 25" / "30 de uber, 50 de mercado"
  const trechos = texto
    .split(/\s*(?:,(?!\d)|;|\n|\se\s(?=[^,]*\d))\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);

  const ehReceitaGeral = PALAVRAS_RECEITA.test(texto);
  const resultado: LancamentoExtraido[] = [];

  for (const trecho of trechos) {
    const m = trecho.match(VALOR);
    if (!m) continue;
    const valor = paraNumero(m[1]);
    if (!Number.isFinite(valor) || valor <= 0) continue;

    const descricao = capitalizar(limparDescricao(trecho)) || (ehReceitaGeral ? "Receita" : "Despesa");

    if (ehReceitaGeral || PALAVRAS_RECEITA.test(trecho)) {
      resultado.push({ area: "receita", descricao, valor });
      continue;
    }

    // categoria: primeiro tenta uma que a pessoa já criou e é citada no texto
    const existente = categoriasExistentes.find((c) =>
      trecho.toLowerCase().includes(c.nome.trim().toLowerCase())
    );
    const padrao = CATEGORIAS.find(([re]) => re.test(trecho))?.[1];

    resultado.push({
      area: "despesa",
      descricao,
      valor,
      categoria: existente?.nome ?? padrao ?? "Outros",
    });
  }

  return resultado;
}
