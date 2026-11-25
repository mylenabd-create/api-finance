"use client";

import { Tabs } from "@/components/ui/Tabs";
import { useAba } from "@/lib/useAba";
import { BackButton } from "@/components/ui/BackButton";
import { AgendaTab } from "./AgendaTab";
import { TarefasTab } from "./TarefasTab";
import { TrabalhoVidaTab } from "./TrabalhoVidaTab";
import type { CompromissoComPessoa, Pessoa, TarefaComPessoa } from "./types";

type TabKey = "agenda" | "tarefas" | "trabalho";

export function AgendaClient({
  contaId,
  pessoas,
  compromissos,
  compromissosSemanaPassada,
  tarefas,
  hoje,
  googleConectado,
  ultimaSincronizacaoGoogle,
}: {
  contaId: string;
  pessoas: Pessoa[];
  compromissos: CompromissoComPessoa[];
  compromissosSemanaPassada: CompromissoComPessoa[];
  tarefas: TarefaComPessoa[];
  hoje: string;
  googleConectado: boolean;
  ultimaSincronizacaoGoogle: string | null;
}) {
  const [tab, setTab] = useAba<TabKey>(["agenda", "tarefas", "trabalho"], "agenda");

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="font-display text-xl">Agenda & tempo</h1>
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "agenda", label: "Agenda" },
          { key: "tarefas", label: "Tarefas" },
          { key: "trabalho", label: "Trabalho x vida pessoal" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "agenda" && (
        <AgendaTab
          contaId={contaId}
          pessoas={pessoas}
          compromissos={compromissos}
          hoje={hoje}
          googleConectado={googleConectado}
          ultimaSincronizacaoGoogle={ultimaSincronizacaoGoogle}
        />
      )}

      {tab === "tarefas" && (
        <TarefasTab contaId={contaId} pessoas={pessoas} tarefas={tarefas} />
      )}

      {tab === "trabalho" && (
        <TrabalhoVidaTab
          compromissosFuturos={compromissos}
          compromissosSemanaPassada={compromissosSemanaPassada}
          hoje={hoje}
        />
      )}
    </div>
  );
}
