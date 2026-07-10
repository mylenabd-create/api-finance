"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bed, Sunrise, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import { duracaoSonoMinutos, formatarDuracao, formatarDataBR, hojeStr } from "./utils";

export function SonoTab({
  pessoas,
  registros,
}: {
  pessoas: Tables<"pessoa">[];
  registros: Tables<"registro_sono">[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");
  const [data, setData] = useState(hojeStr());
  const [horaDormiu, setHoraDormiu] = useState("23:00");
  const [horaAcordou, setHoraAcordou] = useState("07:00");

  const mediaMinutos = useMemo(() => {
    const validos = registros
      .map((r) => duracaoSonoMinutos(r.hora_dormiu, r.hora_acordou))
      .filter((m): m is number => m !== null);
    if (validos.length === 0) return null;
    return Math.round(validos.reduce((s, m) => s + m, 0) / validos.length);
  }, [registros]);

  const ultimo = registros[0];
  const ultimoMinutos = ultimo
    ? duracaoSonoMinutos(ultimo.hora_dormiu, ultimo.hora_acordou)
    : null;

  async function salvar() {
    if (!pessoaId || !data) return;
    setSalvando(true);
    const supabase = createClient();
    await supabase.from("registro_sono").insert({
      conta_id: pessoas[0]?.conta_id,
      pessoa_id: pessoaId,
      data,
      hora_dormiu: horaDormiu || null,
      hora_acordou: horaAcordou || null,
    });
    router.refresh();
    setSalvando(false);
  }

  return (
    <>
      <Card className="mb-3 p-4.5">
        <p className="m-0 text-xs text-text-dim">Sono da última noite</p>
        <p className="mb-0.5 mt-1 font-mono text-[28px] font-medium text-text">
          {formatarDuracao(ultimoMinutos)}
        </p>
        <p className="m-0 text-xs text-text-dim">
          {mediaMinutos !== null
            ? `média recente ${formatarDuracao(mediaMinutos)}`
            : "sem registros suficientes"}
        </p>
      </Card>

      {ultimo && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <Bed size={15} className="text-teal" />
            <p className="mb-0 mt-2 text-[11.5px] text-text-dim">Foi dormir</p>
            <p className="mt-0.5 font-mono text-base font-medium text-text">
              {ultimo.hora_dormiu ?? "—"}
            </p>
          </Card>
          <Card className="p-3.5">
            <Sunrise size={15} className="text-accent" />
            <p className="mb-0 mt-2 text-[11.5px] text-text-dim">Acordou</p>
            <p className="mt-0.5 font-mono text-base font-medium text-text">
              {ultimo.hora_acordou ?? "—"}
            </p>
          </Card>
        </div>
      )}

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Novo registro</p>
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
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="col-span-2 rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
          />
          <label className="flex flex-col gap-1 text-[11px] text-text-dim">
            Foi dormir
            <input
              type="time"
              value={horaDormiu}
              onChange={(e) => setHoraDormiu(e.target.value)}
              className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-text-dim">
            Acordou
            <input
              type="time"
              value={horaAcordou}
              onChange={(e) => setHoraAcordou(e.target.value)}
              className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
            />
          </label>
        </div>
        <button
          onClick={salvar}
          disabled={salvando || !pessoaId}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-[12.5px] text-[#10151C] disabled:opacity-50"
        >
          <Plus size={13} /> Salvar registro
        </button>
      </Card>

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Histórico</p>
      <div className="mb-4 flex flex-col gap-2">
        {registros.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-text-dim">
            Nenhum registro de sono ainda.
          </p>
        )}
        {registros.map((r) => {
          const pessoa = pessoas.find((p) => p.id === r.pessoa_id);
          const minutos = duracaoSonoMinutos(r.hora_dormiu, r.hora_acordou);
          return (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              {pessoa && <Avatar nome={pessoa.nome} cor={pessoa.cor} />}
              <div className="min-w-0 flex-1">
                <p className="m-0 font-mono text-[13px] text-text">
                  {formatarDataBR(r.data)}
                </p>
                <p className="mt-0.5 text-[11px] text-text-dim">
                  {r.hora_dormiu ?? "—"} → {r.hora_acordou ?? "—"}
                  {pessoa ? ` · ${pessoa.nome}` : ""}
                </p>
              </div>
              <span className="font-mono text-[13px] text-text">
                {formatarDuracao(minutos)}
              </span>
            </Card>
          );
        })}
      </div>
    </>
  );
}
