"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Plus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import { formatarDataBR, hojeStr } from "./utils";

type MetricaKey = "peso" | "gordura" | "massa_muscular" | "agua";

const METRICAS: {
  key: MetricaKey;
  label: string;
  unidade: string;
  melhorDirecao: "baixo" | "alto";
}[] = [
  { key: "peso", label: "Peso", unidade: "kg", melhorDirecao: "baixo" },
  { key: "gordura", label: "Gordura corporal", unidade: "%", melhorDirecao: "baixo" },
  { key: "massa_muscular", label: "Massa muscular", unidade: "kg", melhorDirecao: "alto" },
  { key: "agua", label: "Água corporal", unidade: "%", melhorDirecao: "alto" },
];

export function BioimpedanciaTab({
  pessoas,
  avaliacoes,
}: {
  pessoas: Tables<"pessoa">[];
  avaliacoes: Tables<"avaliacao_bioimpedancia">[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");
  const [metrica, setMetrica] = useState<MetricaKey>("peso");
  const [form, setForm] = useState({
    data: hojeStr(),
    peso: "",
    altura: "",
    gordura: "",
    massa_muscular: "",
    agua: "",
  });

  const avaliacoesPessoa = useMemo(
    () =>
      avaliacoes
        .filter((a) => a.pessoa_id === pessoaId)
        .sort((a, b) => a.data.localeCompare(b.data)),
    [avaliacoes, pessoaId]
  );

  const chartData = useMemo(
    () =>
      avaliacoesPessoa.map((a) => ({
        data: formatarDataBR(a.data),
        peso: a.peso,
        gordura: a.gordura,
        massa_muscular: a.massa_muscular,
        agua: a.agua,
      })),
    [avaliacoesPessoa]
  );

  const inicial = avaliacoesPessoa[0];
  const atual = avaliacoesPessoa[avaliacoesPessoa.length - 1];

  async function salvar() {
    if (!pessoaId || !form.data) return;
    setSalvando(true);
    const supabase = createClient();
    await supabase.from("avaliacao_bioimpedancia").insert({
      conta_id: pessoas[0]?.conta_id,
      pessoa_id: pessoaId,
      data: form.data,
      peso: form.peso ? Number(form.peso) : null,
      altura: form.altura ? Number(form.altura) : null,
      gordura: form.gordura ? Number(form.gordura) : null,
      massa_muscular: form.massa_muscular ? Number(form.massa_muscular) : null,
      agua: form.agua ? Number(form.agua) : null,
    });
    setForm({ data: hojeStr(), peso: "", altura: "", gordura: "", massa_muscular: "", agua: "" });
    router.refresh();
    setSalvando(false);
  }

  return (
    <>
      {pessoas.length > 1 && (
        <div className="mb-3 flex items-center gap-2 pl-0.5 text-[11.5px] text-text-dim">
          <span>Pessoa:</span>
          <select
            value={pessoaId}
            onChange={(e) => setPessoaId(e.target.value)}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1 text-[12px] text-text"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Registrar nova avaliação</p>
      <Card className="mb-4 p-3.5">
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="col-span-2 rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Peso (kg)"
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Altura (m)"
            value={form.altura}
            onChange={(e) => setForm({ ...form, altura: e.target.value })}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Gordura (%)"
            value={form.gordura}
            onChange={(e) => setForm({ ...form, gordura: e.target.value })}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Massa musc. (kg)"
            value={form.massa_muscular}
            onChange={(e) => setForm({ ...form, massa_muscular: e.target.value })}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Água (%)"
            value={form.agua}
            onChange={(e) => setForm({ ...form, agua: e.target.value })}
            className="rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 font-mono text-xs text-text placeholder:text-text-dim"
          />
        </div>
        <button
          onClick={salvar}
          disabled={salvando || !pessoaId}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-[12.5px] text-on-accent disabled:opacity-50"
        >
          <Plus size={13} /> Salvar avaliação
        </button>
      </Card>

      <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">Histórico de avaliações</p>
      <div className="mb-4 flex flex-col gap-2">
        {avaliacoesPessoa.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-text-dim">
            Nenhuma avaliação registrada ainda.
          </p>
        )}
        {[...avaliacoesPessoa].reverse().map((a) => (
          <Card key={a.id} className="flex items-center gap-3 p-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "rgba(75,0,200,0.18)" }}
            >
              <Scale size={15} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-mono text-[13px] text-text">
                {formatarDataBR(a.data)}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-text-dim">
                {a.peso != null ? `${a.peso}kg` : "—"}
                {a.gordura != null ? ` · ${a.gordura}% gordura` : ""}
                {a.massa_muscular != null ? ` · ${a.massa_muscular}kg massa` : ""}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {chartData.length > 0 && (
        <Card className="mb-4 px-2.5 py-3.5">
          <p className="mb-2 pl-2 text-[12.5px] text-text-dim">Evolução</p>
          <div className="mb-2 flex flex-wrap gap-1.5 pl-2">
            {METRICAS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetrica(m.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] ${
                  metrica === m.key
                    ? "border-[rgba(75,0,200,0.4)] bg-accent-soft text-accent"
                    : "border-line bg-bg-panel text-text-dim"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#ECE8F3" vertical={false} />
              <XAxis dataKey="data" stroke="#6B6880" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  color: "#1A1A2E",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey={metrica}
                stroke="#4B00C8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#4B00C8" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {inicial && atual && inicial.id !== atual.id && (
        <>
          <p className="mb-2 pl-0.5 text-[12.5px] text-text-dim">
            Consolidado · inicial x atual
          </p>
          <div className="mb-3 flex flex-col gap-2">
            {METRICAS.map((m) => {
              const vIni = inicial[m.key];
              const vAtu = atual[m.key];
              if (vIni == null || vAtu == null) return null;
              const delta = vAtu - vIni;
              const melhorou = m.melhorDirecao === "baixo" ? delta < 0 : delta > 0;
              return (
                <Card key={m.key} className="p-3">
                  <p className="m-0 mb-1.5 text-[12.5px] text-text">{m.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] text-text-dim">
                      {vIni}
                      {m.unidade}
                    </span>
                    <span className="text-[11px] text-text-dim">→</span>
                    <span className="font-mono text-[13px] text-text">
                      {vAtu}
                      {m.unidade}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{
                        color:
                          delta === 0
                            ? "var(--text-dim)"
                            : melhorou
                              ? "var(--teal)"
                              : "var(--coral)",
                      }}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)}
                      {m.unidade}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
