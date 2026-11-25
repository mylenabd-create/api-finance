"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { tipoCompromissoMeta } from "./constants";
import { ConectarGoogleAgenda } from "./ConectarGoogleAgenda";
import type { CompromissoComPessoa, Pessoa, TipoCompromisso } from "./types";

function formatDataGrupo(dataISO: string, hoje: string) {
  const amanha = new Date(hoje + "T00:00:00");
  amanha.setDate(amanha.getDate() + 1);
  const amanhaISO = amanha.toISOString().slice(0, 10);

  if (dataISO === hoje) return "Hoje";
  if (dataISO === amanhaISO) return "Amanhã";

  const d = new Date(dataISO + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function AgendaTab({
  contaId,
  pessoas,
  compromissos,
  hoje,
  googleConectado,
  ultimaSincronizacaoGoogle,
}: {
  contaId: string;
  pessoas: Pessoa[];
  compromissos: CompromissoComPessoa[];
  hoje: string;
  googleConectado: boolean;
  ultimaSincronizacaoGoogle: string | null;
}) {
  const [formAberto, setFormAberto] = useState(false);

  const grupos = useMemo(() => {
    const map = new Map<string, CompromissoComPessoa[]>();
    for (const c of compromissos) {
      const lista = map.get(c.data) ?? [];
      lista.push(c);
      map.set(c.data, lista);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [compromissos]);

  return (
    <div className="flex flex-col gap-4">
      <ConectarGoogleAgenda
        conectado={googleConectado}
        ultimaSincronizacao={ultimaSincronizacaoGoogle}
      />

      <button
        onClick={() => setFormAberto((v) => !v)}
        className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-bg-panel px-4 py-2.5 text-[12.5px] text-accent"
      >
        {formAberto ? <X size={14} /> : <Plus size={14} />}
        {formAberto ? "Fechar" : "Novo compromisso"}
      </button>

      {formAberto && (
        <NovoCompromissoForm
          contaId={contaId}
          pessoas={pessoas}
          onDone={() => setFormAberto(false)}
        />
      )}

      {grupos.length === 0 && (
        <p className="px-1 text-[12.5px] text-text-dim">
          Nenhum compromisso próximo.
        </p>
      )}

      {grupos.map(([data, lista]) => (
        <div key={data}>
          <p className="mb-2 px-1 text-[12.5px] capitalize text-text-dim">
            {formatDataGrupo(data, hoje)}
          </p>
          <div className="flex flex-col gap-2">
            {lista.map((c) => {
              const meta = tipoCompromissoMeta[c.tipo];
              return (
                <Card
                  key={c.id}
                  className="flex items-center gap-3 p-3"
                  style={{ borderLeft: `2px solid ${meta.cor}` }}
                >
                  <span className="w-11 shrink-0 font-mono text-[11.5px] text-text-dim">
                    {c.hora ? c.hora.slice(0, 5) : "--:--"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{c.titulo}</p>
                    <p className="mt-0.5 text-[10.5px]" style={{ color: meta.cor }}>
                      {meta.label}
                    </p>
                  </div>
                  {c.pessoa && <Avatar nome={c.pessoa.nome} cor={c.pessoa.cor} small />}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function NovoCompromissoForm({
  contaId,
  pessoas,
  onDone,
}: {
  contaId: string;
  pessoas: Pessoa[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState<TipoCompromisso>("trabalho");
  const [pessoaId, setPessoaId] = useState("");
  const [gerarTarefa, setGerarTarefa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data) return;
    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { data: compromisso, error } = await supabase
      .from("compromisso")
      .insert({
        conta_id: contaId,
        titulo: titulo.trim(),
        data,
        hora: hora || null,
        tipo,
        pessoa_id: pessoaId || null,
        gera_tarefa: gerarTarefa,
      })
      .select("*")
      .single();

    if (error || !compromisso) {
      setErro("Não foi possível salvar o compromisso.");
      setSalvando(false);
      return;
    }

    if (gerarTarefa) {
      await supabase.from("tarefa").insert({
        conta_id: contaId,
        titulo: compromisso.titulo,
        prazo: compromisso.data,
        pessoa_id: pessoaId || null,
        origem: "calendario",
        compromisso_id: compromisso.id,
      });
    }

    setSalvando(false);
    onDone();
    router.refresh();
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do compromisso"
          className="rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none placeholder:text-text-dim"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-28 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCompromisso)}
            className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          >
            {Object.entries(tipoCompromissoMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            value={pessoaId}
            onChange={(e) => setPessoaId(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          >
            <option value="">Sem pessoa</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-[12.5px] text-text-dim">
          <input
            type="checkbox"
            checked={gerarTarefa}
            onChange={(e) => setGerarTarefa(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Gerar tarefa a partir deste compromisso
        </label>

        {erro && <p className="text-[12px] text-coral">{erro}</p>}

        <button
          type="submit"
          disabled={salvando || !titulo.trim()}
          className="rounded-xl bg-accent py-2.5 text-[13px] font-medium text-on-accent disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar compromisso"}
        </button>
      </form>
    </Card>
  );
}
