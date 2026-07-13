"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { BackButton } from "@/components/ui/BackButton";
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
      <div className="mb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="font-display text-lg font-medium text-text">Espiritual & leitura</h1>
      </div>

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
