"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { CompromissoComPessoa } from "./types";

export function TrabalhoVidaTab({
  compromissosFuturos,
  compromissosSemanaPassada,
  hoje,
}: {
  compromissosFuturos: CompromissoComPessoa[];
  compromissosSemanaPassada: CompromissoComPessoa[];
  hoje: string;
}) {
  const stats = useMemo(() => {
    // Semana completa (dias já passados desta semana + próximos que já vieram
    // no fetch de "futuros"). Evita duplicar o dia de hoje.
    const semana = [
      ...compromissosSemanaPassada.filter((c) => c.data !== hoje),
      ...compromissosFuturos,
    ];

    const hojeCompromissos = compromissosFuturos.filter((c) => c.data === hoje);

    const contarTipos = (lista: CompromissoComPessoa[]) => {
      const trabalho = lista.filter((c) => c.tipo === "trabalho").length;
      const pessoal = lista.length - trabalho;
      return { trabalho, pessoal, total: lista.length };
    };

    return {
      hoje: contarTipos(hojeCompromissos),
      semana: contarTipos(semana),
    };
  }, [compromissosFuturos, compromissosSemanaPassada, hoje]);

  return (
    <div className="flex flex-col gap-4">
      <StatBlock titulo="Hoje" trabalho={stats.hoje.trabalho} pessoal={stats.hoje.pessoal} />
      <StatBlock
        titulo="Esta semana"
        trabalho={stats.semana.trabalho}
        pessoal={stats.semana.pessoal}
      />

      <Card className="p-4 text-[12px] text-text-dim">
        Comparação simples entre compromissos do tipo &quot;trabalho&quot; e os
        demais tipos (pessoal, pagamento, saúde), com base nos compromissos
        cadastrados na agenda.
      </Card>
    </div>
  );
}

function StatBlock({
  titulo,
  trabalho,
  pessoal,
}: {
  titulo: string;
  trabalho: number;
  pessoal: number;
}) {
  const total = trabalho + pessoal;
  const pctTrabalho = total > 0 ? (trabalho / total) * 100 : 0;
  const pctPessoal = total > 0 ? (pessoal / total) * 100 : 0;

  return (
    <Card className="p-4">
      <p className="mb-3 text-[12.5px] text-text-dim">{titulo}</p>

      {total === 0 ? (
        <p className="text-[12px] text-text-dim">Nenhum compromisso.</p>
      ) : (
        <>
          <div className="flex h-[26px] overflow-hidden rounded-lg">
            {trabalho > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${pctTrabalho}%`, background: "var(--accent)" }}
              >
                <span className="font-mono text-[10.5px] text-on-accent">{trabalho}</span>
              </div>
            )}
            {pessoal > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${pctPessoal}%`, background: "var(--teal)" }}
              >
                <span className="font-mono text-[10.5px] text-on-accent">{pessoal}</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-accent" />
              Trabalho
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-teal" />
              Outros (pessoal, pagamento, saúde)
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
