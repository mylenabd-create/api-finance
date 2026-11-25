"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import { formatarDataBR, hojeStr } from "./utils";

const META_SEMANAL = 4;

function inicioSemana(d: Date) {
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(d);
  inicio.setDate(d.getDate() + diff);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

export function ExercicioTab({
  pessoas,
  treinos,
}: {
  pessoas: Tables<"pessoa">[];
  treinos: Tables<"treino">[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");
  const [tipo, setTipo] = useState("");
  const [duracao, setDuracao] = useState(30);
  const [data, setData] = useState(hojeStr());

  const treinosSemana = useMemo(() => {
    const inicio = inicioSemana(new Date()).toISOString().slice(0, 10);
    return treinos.filter((t) => t.data >= inicio);
  }, [treinos]);

  async function salvar() {
    if (!pessoaId || !tipo.trim() || !data) return;
    setSalvando(true);
    const supabase = createClient();
    await supabase.from("treino").insert({
      conta_id: pessoas[0]?.conta_id,
      pessoa_id: pessoaId,
      tipo: tipo.trim(),
      duracao,
      data,
    });
    setTipo("");
    router.refresh();
    setSalvando(false);
  }

  return (
    <>
      <Card className="mb-4 p-4.5">
        <p className="m-0 text-xs text-text-dim">Treinos essa semana</p>
        <p className="mb-2 mt-1 font-mono text-[28px] font-medium text-text">
          {treinosSemana.length} de {META_SEMANAL}
        </p>
        <ProgressBar
          progress={treinosSemana.length / META_SEMANAL}
          color="var(--teal)"
          height={6}
        />
      </Card>

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Novo treino</p>
      <Card className="mb-4 p-3.5">
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <select
            value={pessoaId}
            onChange={(e) => setPessoaId(e.target.value)}
            className="col-span-2 rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <input
            placeholder="Tipo (ex: Corrida)"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="col-span-2 rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
          <input
            type="number"
            min={0}
            placeholder="Duração (min)"
            value={duracao}
            onChange={(e) => setDuracao(Number(e.target.value))}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
          />
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
          />
        </div>
        <button
          onClick={salvar}
          disabled={salvando || !pessoaId || !tipo.trim()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-[12.5px] text-on-accent disabled:opacity-50"
        >
          <Plus size={13} /> Salvar treino
        </button>
      </Card>

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Registrados</p>
      <div className="flex flex-col gap-2">
        {treinos.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-text-dim">
            Nenhum treino registrado ainda.
          </p>
        )}
        {treinos.map((t) => {
          const pessoa = pessoas.find((p) => p.id === t.pessoa_id);
          return (
            <Card key={t.id} className="flex items-center gap-3 p-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: "rgba(18,147,106,0.18)" }}
              >
                <Dumbbell size={15} className="text-teal" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[13px] text-text">{t.tipo}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-dim">
                  {formatarDataBR(t.data)}
                  {pessoa && (
                    <span className="inline-flex items-center gap-1">
                      · <Avatar nome={pessoa.nome} cor={pessoa.cor} small /> {pessoa.nome}
                    </span>
                  )}
                </p>
              </div>
              <span className="font-mono text-[13px] text-text">{t.duracao}min</span>
            </Card>
          );
        })}
      </div>
    </>
  );
}
