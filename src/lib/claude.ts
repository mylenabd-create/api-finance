import Anthropic from "@anthropic-ai/sdk";

// Modelo usado para interpretar as mensagens da "secretária". Veja
// https://docs.claude.com/en/docs/about-claude/models para outras opções.
const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY não configurada. Adicione a chave em .env.local (veja .env.local.example)."
      );
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const AREAS = [
  "despesa",
  "receita",
  "habito",
  "tarefa",
  "compromisso",
  "leitura",
  "espiritual",
  "treino",
  "sono",
  "bioimpedancia",
] as const;

export type Area = (typeof AREAS)[number];

export interface LancamentoExtraido {
  area: Area;
  descricao: string;
  valor?: number;
  data?: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  categoria?: string;
  pessoa?: string;
  concluido?: boolean;
  prioridade?: "baixa" | "media" | "alta";
  tipo_compromisso?: "trabalho" | "pessoal" | "pagamento" | "saude";
  paginas?: number;
  observacoes?: string;
}

export interface ContextoExtracao {
  pessoas: { nome: string }[];
  categorias: { nome: string }[];
  dataAtual: string; // YYYY-MM-DD, para o modelo resolver "ontem", "hoje" etc.
}

const REGISTRAR_LANCAMENTOS_TOOL: Anthropic.Tool = {
  name: "registrar_lancamentos",
  description:
    "Registra um ou mais lançamentos extraídos da mensagem do usuário, cada um associado a uma área da vida pessoal.",
  input_schema: {
    type: "object",
    properties: {
      lancamentos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            area: {
              type: "string",
              enum: AREAS as unknown as string[],
              description:
                "despesa/receita: financeiro. habito: marcar hábito existente como feito. tarefa/compromisso: agenda. leitura: progresso de livro. espiritual: prática do dia. treino/sono/bioimpedancia: hábitos & corpo.",
            },
            descricao: { type: "string" },
            valor: { type: "number", description: "Valor em reais, se aplicável (despesa, receita)." },
            data: { type: "string", description: "Data no formato YYYY-MM-DD. Resolva termos relativos (hoje, ontem) usando a data atual fornecida." },
            hora: { type: "string", description: "Horário HH:MM, se aplicável (compromisso, sono)." },
            categoria: { type: "string", description: "Nome da categoria financeira, se aplicável." },
            pessoa: { type: "string", description: "Nome da pessoa a quem o lançamento pertence, se identificável." },
            concluido: { type: "boolean", description: "Para hábito: se foi concluído." },
            prioridade: { type: "string", enum: ["baixa", "media", "alta"] },
            tipo_compromisso: { type: "string", enum: ["trabalho", "pessoal", "pagamento", "saude"] },
            paginas: { type: "number", description: "Páginas lidas, se aplicável (leitura)." },
            observacoes: { type: "string" },
          },
          required: ["area", "descricao"],
        },
      },
    },
    required: ["lancamentos"],
  },
};

function buildSystemPrompt(contexto: ContextoExtracao) {
  return `Você é a secretária pessoal de um app de gestão de vida. Sua tarefa é ler a mensagem do usuário (texto, e possivelmente imagem/documento anexado) e extrair os lançamentos estruturados que ela descreve, chamando a ferramenta "registrar_lancamentos".

Data atual: ${contexto.dataAtual}
Pessoas cadastradas: ${contexto.pessoas.map((p) => p.nome).join(", ") || "nenhuma ainda"}
Categorias financeiras existentes: ${contexto.categorias.map((c) => c.nome).join(", ") || "nenhuma ainda"}

Regras:
- Uma mensagem pode conter mais de um lançamento (ex: um recibo com vários itens, ou "gastei 40 no mercado e recebi 200 de freela").
- Prefira reutilizar pessoas e categorias já existentes (pelo nome) em vez de inventar novas, a menos que claramente não exista uma correspondente.
- Se a pessoa não for mencionada, deixe o campo de fora.
- Sempre resolva datas relativas (hoje, ontem, "dia 5") para o formato YYYY-MM-DD usando a data atual como referência.
- Nunca invente valores que não estão na mensagem.`;
}

export async function interpretarMensagem(
  content: Anthropic.MessageParam["content"],
  contexto: ContextoExtracao
): Promise<LancamentoExtraido[]> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: buildSystemPrompt(contexto),
    tools: [REGISTRAR_LANCAMENTOS_TOOL],
    tool_choice: { type: "tool", name: "registrar_lancamentos" },
    messages: [{ role: "user", content }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) return [];

  const input = toolUse.input as { lancamentos?: LancamentoExtraido[] };
  return input.lancamentos ?? [];
}
