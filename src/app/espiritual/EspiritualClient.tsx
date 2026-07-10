"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { EspiritualTab } from "./EspiritualTab";
import { LeituraTab } from "./LeituraTab";
import type { Pessoa, PraticaEspiritual, Livro } from "./types";

type TabKey = "espiritual" | "leitura";

export function EspiritualClient({
  contaId,
  pessoas,
  praticas,
  livros,
}: {
  contaId: string;
  pessoas: Pessoa[];
  praticas: PraticaEspiritual[];
  livros: Livro[];
}) {
  const [tab, setTab] = useState<TabKey>("espiritual");

  return (
    <div>
      <h1 className="mb-4 font-display text-lg font-medium text-text">Espiritual & leitura</h1>

      <Tabs
        tabs={[
          { key: "espiritual", label: "Espiritual" },
          { key: "leitura", label: "Leitura" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "espiritual" && (
        <EspiritualTab contaId={contaId} pessoas={pessoas} praticas={praticas} />
      )}
      {tab === "leitura" && (
        <LeituraTab contaId={contaId} pessoas={pessoas} livros={livros} />
      )}
    </div>
  );
}
