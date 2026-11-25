"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

// Lixeira com confirmação em dois toques: evita apagar sem querer.
export function BotaoApagar({
  onConfirmar,
  rotulo = "Apagar lançamento",
}: {
  onConfirmar: () => Promise<void> | void;
  rotulo?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);

  if (!confirmando) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirmando(true);
        }}
        aria-label={rotulo}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-dim active:bg-bg-panel-raised"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={() => setConfirmando(false)}
        disabled={apagando}
        className="rounded-full px-2 py-1 text-[11.5px] text-text-dim"
      >
        Não
      </button>
      <button
        onClick={async () => {
          setApagando(true);
          try {
            await onConfirmar();
          } finally {
            setApagando(false);
            setConfirmando(false);
          }
        }}
        disabled={apagando}
        className="rounded-full bg-coral px-2.5 py-1 text-[11.5px] font-semibold text-white disabled:opacity-60"
      >
        {apagando ? "Apagando…" : "Apagar"}
      </button>
    </div>
  );
}
