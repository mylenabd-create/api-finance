"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import type { Pessoa, PraticaEspiritual } from "./types";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function calcularSequencia(datas: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  // Se hoje ainda não tem registro, a sequência conta a partir de ontem
  // (mas só é "quebrada" se ontem também faltar).
  if (!datas.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (datas.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function ultimosNDias(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function EspiritualTab({
  contaId,
  pessoas,
  praticas,
}: {
  contaId: string;
  pessoas: Pessoa[];
  praticas: PraticaEspiritual[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pessoaId, setPessoaId] = useState<string | undefined>(pessoas[0]?.id);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const pessoaAtual = pessoas.find((p) => p.id === pessoaId) ?? pessoas[0];

  const praticasPessoa = useMemo(
    () => praticas.filter((p) => p.pessoa_id === pessoaAtual?.id),
    [praticas, pessoaAtual]
  );

  const datasSet = useMemo(
    () => new Set(praticasPessoa.map((p) => p.data)),
    [praticasPessoa]
  );

  const streak = useMemo(() => calcularSequencia(datasSet), [datasSet]);
  const semana = useMemo(() => ultimosNDias(7), []);
  const registradoHoje = datasSet.has(hojeISO());

  const historico = useMemo(
    () =>
      [...praticasPessoa]
        .sort((a, b) => (a.data < b.data ? 1 : -1))
        .slice(0, 10),
    [praticasPessoa]
  );

  async function registrarHoje() {
    if (!pessoaAtual) return;
    setSalvando(true);
    setAviso(null);
    const { error } = await supabase.from("pratica_espiritual").insert({
      conta_id: contaId,
      pessoa_id: pessoaAtual.id,
      data: hojeISO(),
    });
    setSalvando(false);
    if (error) {
      if (error.code === "23505") {
        setAviso("Já registrado hoje.");
      } else {
        setAviso("Não foi possível registrar. Tente novamente.");
      }
      return;
    }
    router.refresh();
  }

  if (!pessoaAtual) {
    return (
      <Card className="p-4 text-sm text-text-dim">
        Nenhuma pessoa cadastrada na conta ainda.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pessoas.length > 1 && (
        <div className="relative">
          <select
            value={pessoaAtual.id}
            onChange={(e) => setPessoaId(e.target.value)}
            className="w-full appearance-none rounded-full border border-line bg-bg-panel px-3.5 py-2 text-[13px] text-text"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim"
          />
        </div>
      )}

      <Card className="p-[18px]">
        <Sparkles size={17} className="text-purple" />
        <p className="mt-2.5 text-xs text-text-dim">Sequência atual</p>
        <p className="mt-1 font-mono text-[26px] font-medium text-text">
          {streak} {streak === 1 ? "dia" : "dias"}
        </p>
      </Card>

      <Card className="p-4">
        <p className="mb-2.5 ml-0.5 text-[12.5px] text-text-dim">Últimos 7 dias</p>
        <div className="flex gap-1.5">
          {semana.map((dia) => {
            const marcado = datasSet.has(dia);
            return (
              <div
                key={dia}
                title={dia}
                className="h-5 flex-1 rounded-md"
                style={{
                  background: marcado ? "var(--purple)" : "#232D39",
                  opacity: marcado ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>
      </Card>

      <button
        onClick={registrarHoje}
        disabled={salvando || registradoHoje}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border p-3.5 text-[13.5px] transition-colors disabled:cursor-default"
        style={{
          borderColor: registradoHoje ? "rgba(183,124,201,0.4)" : "var(--line)",
          background: "var(--bg-panel)",
          color: registradoHoje ? "var(--purple)" : "var(--text)",
        }}
      >
        {registradoHoje ? <Check size={15} /> : null}
        {registradoHoje
          ? "Prática registrada hoje"
          : salvando
            ? "Registrando..."
            : "Registrar prática de hoje"}
      </button>

      {aviso && <p className="text-center text-xs text-text-dim">{aviso}</p>}

      <div>
        <p className="mb-2 ml-0.5 text-[12.5px] text-text-dim">Histórico recente</p>
        {historico.length === 0 ? (
          <Card className="p-4 text-sm text-text-dim">Nenhum registro ainda.</Card>
        ) : (
          <div className="flex flex-col gap-1.5">
            {historico.map((h) => (
              <Card key={h.id} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[13px] text-text">
                  {new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <Check size={14} className="text-purple" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
