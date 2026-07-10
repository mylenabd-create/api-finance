"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { DespesasTab } from "./DespesasTab";
import { ReceitasTab } from "./ReceitasTab";
import { MetasTab } from "./MetasTab";
import { FuturoTab } from "./FuturoTab";
import type {
  Categoria,
  FaturaAgregada,
  LancamentoFuturo,
  MetaComCategoria,
  Pessoa,
  ReceitaComPessoa,
  TransacaoComRelacoes,
} from "./types";

type TabKey = "despesas" | "receitas" | "metas" | "futuro";

const TABS: { key: TabKey; label: string }[] = [
  { key: "despesas", label: "Despesas" },
  { key: "receitas", label: "Receitas" },
  { key: "metas", label: "Metas" },
  { key: "futuro", label: "Futuro" },
];

const CORES_PESSOA = ["#C9A15E", "#5B9C93", "#D9765A", "#7C8FC9", "#B77CC9"];

export function FinancasClient({
  contaId,
  pessoas,
  categorias,
  metas,
  transacoes,
  transacoesCompletas,
  faturas,
  receitas,
  lancamentosFuturos,
  mesReferencia,
}: {
  contaId: string;
  pessoas: Pessoa[];
  categorias: Categoria[];
  metas: MetaComCategoria[];
  transacoes: TransacaoComRelacoes[];
  transacoesCompletas: TransacaoComRelacoes[];
  faturas: FaturaAgregada[];
  receitas: ReceitaComPessoa[];
  lancamentosFuturos: LancamentoFuturo[];
  mesReferencia: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<TabKey>("despesas");
  const [addingPessoa, setAddingPessoa] = useState(false);

  const nomeMesAtual = useMemo(() => {
    const d = new Date(mesReferencia + "T00:00:00");
    const nome = d.toLocaleDateString("pt-BR", { month: "long" });
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }, [mesReferencia]);

  async function addPessoa() {
    if (addingPessoa) return;
    setAddingPessoa(true);
    const cor = CORES_PESSOA[pessoas.length % CORES_PESSOA.length];
    await supabase.from("pessoa").insert({
      conta_id: contaId,
      nome: "Nova pessoa",
      cor,
    });
    setAddingPessoa(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-medium">Finanças</h1>
        <div className="rounded-full border border-line bg-bg-panel px-2.5 py-1 text-xs text-text-dim">
          {nomeMesAtual}
        </div>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {pessoas.map((p) => (
          <div key={p.id} className="flex shrink-0 items-center gap-1.5">
            <Avatar nome={p.nome} cor={p.cor} />
            <span className="text-[11.5px] text-text-dim">{p.nome}</span>
          </div>
        ))}
        <button
          onClick={addPessoa}
          disabled={addingPessoa}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1.5 text-[11px] text-text-dim disabled:opacity-50"
        >
          <UserPlus size={12} /> pessoa
        </button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "despesas" && (
        <DespesasTab
          contaId={contaId}
          categorias={categorias}
          pessoas={pessoas}
          metas={metas}
          transacoes={transacoes}
          transacoesCompletas={transacoesCompletas}
          faturas={faturas}
        />
      )}
      {tab === "receitas" && (
        <ReceitasTab
          contaId={contaId}
          pessoas={pessoas}
          receitas={receitas}
          totalDespesas={transacoesCompletas.reduce((s, t) => s + Number(t.valor), 0)}
        />
      )}
      {tab === "metas" && (
        <MetasTab
          contaId={contaId}
          metas={metas}
          totalReceita={receitas.reduce((s, r) => s + Number(r.valor), 0)}
          mesReferencia={mesReferencia}
        />
      )}
      {tab === "futuro" && (
        <FuturoTab contaId={contaId} lancamentosFuturos={lancamentosFuturos} />
      )}
    </div>
  );
}
