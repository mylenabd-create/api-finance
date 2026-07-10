import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { LancamentoExtraido } from "@/lib/claude";

type Client = SupabaseClient<Database>;

export interface ResultadoIngestao {
  area: string;
  descricao: string;
  ok: boolean;
  motivo?: string;
}

// Insere os lançamentos extraídos pelo Claude nas tabelas certas.
// Bioimpedância fica de fora deste pipeline (exige vários campos numéricos
// específicos — peso/altura/gordura/etc — melhor preenchidos pelo formulário
// dedicado em /habitos do que adivinhados de uma frase solta).
export async function registrarLancamentos(
  supabase: Client,
  contaId: string,
  origem: "ia_texto" | "ia_audio" | "ia_imagem" | "ia_documento",
  lancamentos: LancamentoExtraido[]
): Promise<ResultadoIngestao[]> {
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: pessoas }, { data: categorias }] = await Promise.all([
    supabase.from("pessoa").select("id, nome").eq("conta_id", contaId),
    supabase.from("categoria").select("id, nome").eq("conta_id", contaId),
  ]);

  const pessoaIdPorNome = new Map(
    (pessoas ?? []).map((p) => [p.nome.trim().toLowerCase(), p.id])
  );
  const categoriaIdPorNome = new Map(
    (categorias ?? []).map((c) => [c.nome.trim().toLowerCase(), c.id])
  );

  function resolverPessoa(nome?: string) {
    if (!nome) return null;
    return pessoaIdPorNome.get(nome.trim().toLowerCase()) ?? null;
  }

  async function resolverCategoria(nome?: string): Promise<string | null> {
    if (!nome) return null;
    const chave = nome.trim().toLowerCase();
    const existente = categoriaIdPorNome.get(chave);
    if (existente) return existente;

    const { data: nova, error } = await supabase
      .from("categoria")
      .insert({ conta_id: contaId, nome: nome.trim() })
      .select("id")
      .single();
    if (error || !nova) return null;
    categoriaIdPorNome.set(chave, nova.id);
    return nova.id;
  }

  const resultados: ResultadoIngestao[] = [];

  for (const l of lancamentos) {
    const base = { area: l.area, descricao: l.descricao };
    try {
      switch (l.area) {
        case "despesa": {
          if (l.valor == null) throw new Error("valor ausente");
          const categoriaId = await resolverCategoria(l.categoria);
          const { error } = await supabase.from("transacao").insert({
            conta_id: contaId,
            descricao: l.descricao,
            valor: l.valor,
            data: l.data ?? hoje,
            categoria_id: categoriaId,
            pessoa_id: resolverPessoa(l.pessoa),
            origem,
          });
          if (error) throw error;
          break;
        }
        case "receita": {
          if (l.valor == null) throw new Error("valor ausente");
          const { error } = await supabase.from("receita").insert({
            conta_id: contaId,
            fonte: l.descricao,
            valor: l.valor,
            data: l.data ?? hoje,
            pessoa_id: resolverPessoa(l.pessoa),
          });
          if (error) throw error;
          break;
        }
        case "habito": {
          const { data: habito } = await supabase
            .from("habito")
            .select("id")
            .eq("conta_id", contaId)
            .ilike("nome", `%${l.descricao}%`)
            .limit(1)
            .maybeSingle();
          if (!habito) throw new Error(`hábito "${l.descricao}" não encontrado`);
          const { error } = await supabase.from("habito_registro").upsert(
            {
              habito_id: habito.id,
              data: l.data ?? hoje,
              concluido: l.concluido ?? true,
            },
            { onConflict: "habito_id,data" }
          );
          if (error) throw error;
          break;
        }
        case "tarefa": {
          const { error } = await supabase.from("tarefa").insert({
            conta_id: contaId,
            titulo: l.descricao,
            prazo: l.data ?? null,
            prioridade: l.prioridade ?? "media",
            pessoa_id: resolverPessoa(l.pessoa),
            origem: "manual",
          });
          if (error) throw error;
          break;
        }
        case "compromisso": {
          const { error } = await supabase.from("compromisso").insert({
            conta_id: contaId,
            titulo: l.descricao,
            data: l.data ?? hoje,
            hora: l.hora ?? null,
            tipo: l.tipo_compromisso ?? "pessoal",
            pessoa_id: resolverPessoa(l.pessoa),
          });
          if (error) throw error;
          break;
        }
        case "leitura": {
          const pessoaId = resolverPessoa(l.pessoa);
          const query = supabase
            .from("livro")
            .select("id")
            .eq("conta_id", contaId)
            .ilike("titulo", `%${l.descricao}%`)
            .limit(1);
          const { data: existente } = pessoaId
            ? await query.eq("pessoa_id", pessoaId).maybeSingle()
            : await query.maybeSingle();

          if (existente) {
            if (l.valor != null) {
              const { error } = await supabase
                .from("livro")
                .update({ progresso: Math.min(Math.max(l.valor, 0), 100) })
                .eq("id", existente.id);
              if (error) throw error;
            }
          } else {
            if (!pessoaId) throw new Error("pessoa necessária para cadastrar livro novo");
            const { error } = await supabase.from("livro").insert({
              conta_id: contaId,
              pessoa_id: pessoaId,
              titulo: l.descricao,
              progresso: l.valor ?? 0,
              atual: true,
            });
            if (error) throw error;
          }
          break;
        }
        case "espiritual": {
          const pessoaId = resolverPessoa(l.pessoa) ?? pessoas?.[0]?.id;
          if (!pessoaId) throw new Error("nenhuma pessoa cadastrada");
          const { error } = await supabase
            .from("pratica_espiritual")
            .upsert(
              { conta_id: contaId, pessoa_id: pessoaId, data: l.data ?? hoje },
              { onConflict: "pessoa_id,data", ignoreDuplicates: true }
            );
          if (error) throw error;
          break;
        }
        case "treino": {
          const pessoaId = resolverPessoa(l.pessoa) ?? pessoas?.[0]?.id;
          if (!pessoaId) throw new Error("nenhuma pessoa cadastrada");
          const { error } = await supabase.from("treino").insert({
            conta_id: contaId,
            pessoa_id: pessoaId,
            tipo: l.descricao,
            duracao: l.valor ?? 0,
            data: l.data ?? hoje,
          });
          if (error) throw error;
          break;
        }
        case "sono": {
          const pessoaId = resolverPessoa(l.pessoa) ?? pessoas?.[0]?.id;
          if (!pessoaId) throw new Error("nenhuma pessoa cadastrada");
          const { error } = await supabase.from("registro_sono").insert({
            conta_id: contaId,
            pessoa_id: pessoaId,
            data: l.data ?? hoje,
            hora_dormiu: l.hora ?? null,
          });
          if (error) throw error;
          break;
        }
        case "bioimpedancia": {
          throw new Error(
            "avaliação de bioimpedância precisa ser lançada pelo formulário em /habitos (múltiplos campos numéricos)"
          );
        }
        default:
          throw new Error(`área desconhecida: ${l.area}`);
      }
      resultados.push({ ...base, ok: true });
    } catch (err) {
      resultados.push({
        ...base,
        ok: false,
        motivo: err instanceof Error ? err.message : "erro desconhecido",
      });
    }
  }

  return resultados;
}
