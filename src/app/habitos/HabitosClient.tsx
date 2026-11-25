"use client";

import { Tabs } from "@/components/ui/Tabs";
import { useAba } from "@/lib/useAba";
import { BackButton } from "@/components/ui/BackButton";
import type { Tables } from "@/lib/database.types";
import { HabitosTab } from "./HabitosTab";
import { SonoTab } from "./SonoTab";
import { ExercicioTab } from "./ExercicioTab";
import { BioimpedanciaTab } from "./BioimpedanciaTab";

type TabKey = "habitos" | "sono" | "exercicio" | "bioimpedancia";

const tabs: { key: TabKey; label: string }[] = [
  { key: "habitos", label: "Hábitos" },
  { key: "sono", label: "Sono" },
  { key: "exercicio", label: "Exercício" },
  { key: "bioimpedancia", label: "Bioimpedância" },
];

export function HabitosClient({
  pessoas,
  habitos,
  registros,
  registrosSono,
  treinos,
  avaliacoes,
}: {
  pessoas: Tables<"pessoa">[];
  habitos: Tables<"habito">[];
  registros: Tables<"habito_registro">[];
  registrosSono: Tables<"registro_sono">[];
  treinos: Tables<"treino">[];
  avaliacoes: Tables<"avaliacao_bioimpedancia">[];
}) {
  const [tab, setTab] = useAba<TabKey>(["habitos", "sono", "exercicio", "bioimpedancia"], "habitos");

  return (
    <div>
      <div className="mb-4.5 flex items-center gap-2">
        <BackButton />
        <div>
          <p className="m-0 font-mono text-[11.5px] uppercase tracking-[1.2px] text-text-dim">
            Corpo & constância
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium text-text">
            Hábitos & corpo
          </h1>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "habitos" && (
        <HabitosTab pessoas={pessoas} habitos={habitos} registros={registros} />
      )}
      {tab === "sono" && <SonoTab pessoas={pessoas} registros={registrosSono} />}
      {tab === "exercicio" && <ExercicioTab pessoas={pessoas} treinos={treinos} />}
      {tab === "bioimpedancia" && (
        <BioimpedanciaTab pessoas={pessoas} avaliacoes={avaliacoes} />
      )}
    </div>
  );
}
