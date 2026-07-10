"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
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
}: {
  contaId: string;
  pessoas: Pessoa[];
  compromissos: CompromissoComPessoa[];
  compromissosSemanaPassada: CompromissoComPessoa[];
  tarefas: TarefaComPessoa[];
  hoje: string;
}) {
  const [tab, setTab] = useState<TabKey>("agenda");

  return (
    <div className="px-4 pb-6 pt-4">
      <h1 className="mb-4 font-display text-xl">Agenda & tempo</h1>

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
