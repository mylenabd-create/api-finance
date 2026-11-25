"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
  atrasadaMeta,
  corPrioridade,
  prioridadeLabel,
  proximoStatus,
  statusTarefaMeta,
} from "./constants";
import type { Pessoa, PrioridadeTarefa, TarefaComPessoa } from "./types";

function rank(t: TarefaComPessoa) {
  if (t.atrasadaCalculada) return 0;
  if (t.status === "andamento") return 1;
  if (t.status === "afazer") return 2;
  return 3;
}

export function TarefasTab({
  contaId,
  pessoas,
  tarefas,
}: {
  contaId: string;
  pessoas: Pessoa[];
  tarefas: TarefaComPessoa[];
}) {
  const router = useRouter();
  const [formAberto, setFormAberto] = useState(false);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  const contagem = useMemo(
    () => ({
      atrasada: tarefas.filter((t) => t.atrasadaCalculada).length,
      afazer: tarefas.filter((t) => t.status === "afazer" && !t.atrasadaCalculada)
        .length,
      andamento: tarefas.filter((t) => t.status === "andamento").length,
      concluida: tarefas.filter((t) => t.status === "concluida").length,
    }),
    [tarefas]
  );

  const tarefasOrdenadas = useMemo(
    () => [...tarefas].sort((a, b) => rank(a) - rank(b)),
    [tarefas]
  );

  async function handleToggleStatus(t: TarefaComPessoa) {
    setAtualizando(t.id);
    const supabase = createClient();
    const novoStatus = proximoStatus(t.status);
    await supabase.from("tarefa").update({ status: novoStatus }).eq("id", t.id);
    setAtualizando(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setFormAberto((v) => !v)}
        className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-bg-panel px-4 py-2.5 text-[12.5px] text-accent"
      >
        {formAberto ? <X size={14} /> : <Plus size={14} />}
        {formAberto ? "Fechar" : "Nova tarefa"}
      </button>

      {formAberto && (
        <NovaTarefaForm
          contaId={contaId}
          pessoas={pessoas}
          onDone={() => setFormAberto(false)}
        />
      )}

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Atrasadas" valor={contagem.atrasada} cor="var(--coral)" />
        <StatCard label="A fazer" valor={contagem.afazer} cor="var(--purple)" />
        <StatCard label="Andamento" valor={contagem.andamento} cor="#FF8A00" />
        <StatCard label="Concluídas" valor={contagem.concluida} cor="var(--teal)" />
      </div>

      {tarefasOrdenadas.length === 0 && (
        <p className="px-1 text-[12.5px] text-text-dim">Nenhuma tarefa.</p>
      )}

      <div className="flex flex-col gap-2">
        {tarefasOrdenadas.map((t) => {
          const sm = t.atrasadaCalculada ? atrasadaMeta : statusTarefaMeta[t.status];
          return (
            <Card key={t.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`truncate text-[13px] ${
                      t.status === "concluida" ? "line-through opacity-60" : ""
                    }`}
                  >
                    {t.titulo}
                  </p>
                  {t.origem === "calendario" && (
                    <CalendarDays size={11} className="shrink-0 text-text-dim" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-text-dim">
                  {t.prazo ? `prazo: ${t.prazo}` : "sem prazo"}
                </p>
              </div>
              {t.pessoa && <Avatar nome={t.pessoa.nome} cor={t.pessoa.cor} small />}
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: corPrioridade(t.prioridade) }}
                title={prioridadeLabel[t.prioridade]}
              />
              <button
                onClick={() => handleToggleStatus(t)}
                disabled={t.status === "concluida" || atualizando === t.id}
                className="shrink-0 rounded-full px-2.5 py-1.5 text-[10.5px] disabled:cursor-default"
                style={{ background: sm.bg, color: sm.cor }}
              >
                {sm.label}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <Card className="p-2.5 text-center">
      <p className="font-mono text-[17px] font-medium" style={{ color: cor }}>
        {valor}
      </p>
      <p className="mt-0.5 text-[9.5px] text-text-dim">{label}</p>
    </Card>
  );
}

function NovaTarefaForm({
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
  const [prazo, setPrazo] = useState(() => new Date().toISOString().slice(0, 10));
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>("media");
  const [pessoaId, setPessoaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.from("tarefa").insert({
      conta_id: contaId,
      titulo: titulo.trim(),
      prazo: prazo || null,
      prioridade,
      pessoa_id: pessoaId || null,
      origem: "manual",
    });

    if (error) {
      setErro("Não foi possível salvar a tarefa.");
      setSalvando(false);
      return;
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
          placeholder="Título da tarefa"
          className="rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none placeholder:text-text-dim"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          />
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}
            className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
          >
            {Object.entries(prioridadeLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={pessoaId}
          onChange={(e) => setPessoaId(e.target.value)}
          className="rounded-xl border border-line bg-bg-panel-raised px-3 py-2 text-[13px] outline-none"
        >
          <option value="">Sem pessoa</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        {erro && <p className="text-[12px] text-coral">{erro}</p>}

        <button
          type="submit"
          disabled={salvando || !titulo.trim()}
          className="rounded-xl bg-accent py-2.5 text-[13px] font-medium text-on-accent disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar tarefa"}
        </button>
      </form>
    </Card>
  );
}
