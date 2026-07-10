"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Award, Send, Mic } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import { calcularStreak, medalha, hojeStr } from "./utils";

const CORES = ["#5B9C93", "#B77CC9", "#7C8FC9", "#C9A15E", "#D9765A"];

const BADGES = [
  { label: "7 dias", threshold: 7 },
  { label: "30 dias", threshold: 30 },
  { label: "100 dias", threshold: 100 },
];

export function HabitosTab({
  pessoas,
  habitos,
  registros,
}: {
  pessoas: Tables<"pessoa">[];
  habitos: Tables<"habito">[];
  registros: Tables<"habito_registro">[];
}) {
  const router = useRouter();
  const hoje = hojeStr();
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const [novoNome, setNovoNome] = useState("");
  const [novaPessoaId, setNovaPessoaId] = useState(pessoas[0]?.id ?? "");
  const [novaCor, setNovaCor] = useState(CORES[0]);
  const [criando, setCriando] = useState(false);

  const registrosPorHabito = useMemo(() => {
    const map = new Map<string, Tables<"habito_registro">[]>();
    for (const r of registros) {
      const arr = map.get(r.habito_id) ?? [];
      arr.push(r);
      map.set(r.habito_id, arr);
    }
    return map;
  }, [registros]);

  const streaks = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of habitos) {
      map.set(h.id, calcularStreak(registrosPorHabito.get(h.id) ?? []));
    }
    return map;
  }, [habitos, registrosPorHabito]);

  const concluidosHoje = habitos.filter((h) => {
    const regs = registrosPorHabito.get(h.id) ?? [];
    return regs.some((r) => r.data === hoje && r.concluido);
  }).length;

  const maiorStreak = Math.max(0, ...Array.from(streaks.values()));

  async function toggleHoje(habitoId: string, concluidoAtual: boolean) {
    setPendentes((prev) => new Set(prev).add(habitoId));
    const supabase = createClient();
    await supabase
      .from("habito_registro")
      .upsert(
        { habito_id: habitoId, data: hoje, concluido: !concluidoAtual },
        { onConflict: "habito_id,data" }
      );
    router.refresh();
    setPendentes((prev) => {
      const next = new Set(prev);
      next.delete(habitoId);
      return next;
    });
  }

  async function criarHabito() {
    if (!novoNome.trim() || !novaPessoaId) return;
    setCriando(true);
    const supabase = createClient();
    await supabase.from("habito").insert({
      pessoa_id: novaPessoaId,
      nome: novoNome.trim(),
      cor: novaCor,
      conta_id: pessoas[0]?.conta_id,
    });
    setNovoNome("");
    router.refresh();
    setCriando(false);
  }

  return (
    <>
      <Card className="mb-3 p-4.5">
        <p className="m-0 mb-3 pl-0.5 text-[12.5px] text-text-dim">
          Conquistas por constância
        </p>
        <div className="flex gap-2">
          {BADGES.map((b) => {
            const conquistado = maiorStreak >= b.threshold;
            return (
              <div
                key={b.label}
                className="flex-1 text-center"
                style={{ opacity: conquistado ? 1 : 0.35 }}
              >
                <div
                  className="mx-auto mb-1.5 flex h-[38px] w-[38px] items-center justify-center rounded-full"
                  style={{
                    background: conquistado
                      ? "var(--accent-soft)"
                      : "var(--bg-panel-raised)",
                  }}
                >
                  <Award
                    size={17}
                    color={conquistado ? "var(--accent)" : "var(--text-dim)"}
                  />
                </div>
                <span className="text-[9.5px] text-text-dim">{b.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mb-4 flex items-center gap-2.5 bg-bg-panel-raised px-3 py-2.5">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && criarHabito()}
          placeholder="Escreva um novo hábito"
          className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-dim"
        />
        <button
          type="button"
          disabled
          title="Entrada por voz chega em breve"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-bg-panel opacity-60"
        >
          <Mic size={13} className="text-text-dim" />
        </button>
        <button
          onClick={criarHabito}
          disabled={criando || !novoNome.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-accent disabled:opacity-50"
        >
          <Send size={13} color="#10151C" />
        </button>
      </Card>

      {/* Seletor de pessoa/cor para o novo hábito */}
      {pessoas.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 pl-0.5 text-[11.5px] text-text-dim">
          <span>Para:</span>
          <select
            value={novaPessoaId}
            onChange={(e) => setNovaPessoaId(e.target.value)}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1 text-[12px] text-text"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <span>Cor:</span>
          <div className="flex gap-1.5">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNovaCor(c)}
                className="h-4.5 w-4.5 rounded-md"
                style={{
                  background: c,
                  outline: novaCor === c ? "2px solid var(--text)" : "none",
                  outlineOffset: 1,
                }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="mb-4 p-4.5">
        <p className="m-0 text-xs text-text-dim">Concluídos hoje</p>
        <p className="mb-2 mt-1 font-mono text-[26px] font-medium text-text">
          {concluidosHoje} de {habitos.length}
        </p>
        <ProgressBar
          progress={habitos.length > 0 ? concluidosHoje / habitos.length : 0}
          color="var(--accent)"
          height={6}
        />
      </Card>

      <div className="flex flex-col gap-2">
        {habitos.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-text-dim">
            Nenhum hábito cadastrado ainda.
          </p>
        )}
        {habitos.map((h) => {
          const pessoa = pessoas.find((p) => p.id === h.pessoa_id);
          const regs = registrosPorHabito.get(h.id) ?? [];
          const concluidoHoje = regs.some((r) => r.data === hoje && r.concluido);
          const streak = streaks.get(h.id) ?? 0;
          const med = medalha(streak);
          const pendente = pendentes.has(h.id);

          return (
            <Card key={h.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleHoje(h.id, concluidoHoje)}
                  disabled={pendente}
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
                  style={{
                    borderColor: concluidoHoje ? "var(--teal)" : "var(--line)",
                    background: concluidoHoje ? "var(--teal)" : "transparent",
                  }}
                  aria-label="Marcar concluído hoje"
                >
                  {concluidoHoje && <Check size={13} color="#10151C" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="m-0 truncate text-[13px] text-text">{h.nome}</p>
                    {med && (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px]"
                        style={{ background: `${med.cor}22`, color: med.cor }}
                      >
                        <Award size={9} /> {med.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-text-dim">
                    {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
                    {pessoa && (
                      <span className="inline-flex items-center gap-1">
                        <Avatar nome={pessoa.nome} cor={pessoa.cor} small /> {pessoa.nome}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <UltimaSemana registros={regs} cor={h.cor} />
            </Card>
          );
        })}
      </div>
    </>
  );
}

function UltimaSemana({
  registros,
  cor,
}: {
  registros: Tables<"habito_registro">[];
  cor: string;
}) {
  const dias = useMemo(() => {
    const concluidos = new Set(
      registros.filter((r) => r.concluido).map((r) => r.data)
    );
    const out: boolean[] = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 6);
    for (let i = 0; i < 7; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      out.push(concluidos.has(iso));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [registros]);

  return (
    <div className="mt-2.5 flex gap-1.5 pl-[34px]">
      {dias.map((d, i) => (
        <div
          key={i}
          className="h-5 w-5 rounded-md"
          style={{ background: d ? cor : "#232D39", opacity: d ? 1 : 0.5 }}
        />
      ))}
    </div>
  );
}
