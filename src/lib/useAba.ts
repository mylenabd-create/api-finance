"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

// Aba ativa de uma tela, que também pode ser escolhida pela URL (?aba=sono).
// Permite que o menu do topo leve direto para uma aba específica.
export function useAba<T extends string>(validas: readonly T[], padrao: T) {
  const params = useSearchParams();
  const daUrl = params.get("aba");
  const valida = (v: string | null): v is T => v !== null && (validas as readonly string[]).includes(v);

  const [aba, setAba] = useState<T>(valida(daUrl) ? daUrl : padrao);
  const [urlAnterior, setUrlAnterior] = useState(daUrl);

  // menu do topo mudou a ?aba= com a tela já aberta: acompanha
  if (daUrl !== urlAnterior) {
    setUrlAnterior(daUrl);
    if (valida(daUrl)) setAba(daUrl);
  }

  return [aba, setAba] as const;
}
