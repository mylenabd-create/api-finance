"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Pessoa, Livro } from "./types";

export function LeituraTab({
  contaId,
  pessoas,
  livros,
}: {
  contaId: string;
  pessoas: Pessoa[];
  livros: Livro[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const livroAtual = livros.find((l) => l.atual);
  const estante = livros.filter((l) => !l.atual);

  const [progressoLocal, setProgressoLocal] = useState<number | null>(null);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoAutor, setNovoAutor] = useState("");
  const [novaPessoaId, setNovaPessoaId] = useState(pessoas[0]?.id ?? "");
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const progressoExibido =
    progressoLocal !== null ? progressoLocal : Math.round(livroAtual?.progresso ?? 0);

  async function salvarProgresso(valor: number) {
    if (!livroAtual) return;
    setSalvandoProgresso(true);
    await supabase.from("livro").update({ progresso: valor }).eq("id", livroAtual.id);
    setSalvandoProgresso(false);
    router.refresh();
  }

  async function marcarComoAtual(livro: Livro) {
    setMarcandoId(livro.id);
    const anteriorAtual = livros.find((l) => l.atual && l.pessoa_id === livro.pessoa_id);
    if (anteriorAtual) {
      await supabase.from("livro").update({ atual: false }).eq("id", anteriorAtual.id);
    }
    await supabase.from("livro").update({ atual: true }).eq("id", livro.id);
    setMarcandoId(null);
    router.refresh();
  }

  async function adicionarLivro() {
    if (!novoTitulo.trim() || !novaPessoaId) return;
    setSalvandoNovo(true);
    await supabase.from("livro").insert({
      conta_id: contaId,
      pessoa_id: novaPessoaId,
      titulo: novoTitulo.trim(),
      autor: novoAutor.trim() || null,
    });
    setSalvandoNovo(false);
    setNovoTitulo("");
    setNovoAutor("");
    setMostrarForm(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {livroAtual && (
        <Card className="p-[18px]">
          <p className="text-xs text-text-dim">Lendo agora</p>
          <p className="mt-1 font-display text-lg font-medium text-text">{livroAtual.titulo}</p>
          {livroAtual.autor && (
            <p className="mb-2.5 mt-0.5 text-xs text-text-dim">{livroAtual.autor}</p>
          )}
          <div className="mb-1.5 mt-2">
            <ProgressBar progress={progressoExibido / 100} color="var(--teal)" height={6} />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={progressoExibido}
              onChange={(e) => setProgressoLocal(Number(e.target.value))}
              onMouseUp={(e) => salvarProgresso(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => salvarProgresso(Number((e.target as HTMLInputElement).value))}
              className="flex-1 accent-[var(--teal)]"
            />
            <span className="w-12 shrink-0 text-right font-mono text-[11px] text-text-dim">
              {salvandoProgresso ? "..." : `${progressoExibido}%`}
            </span>
          </div>
        </Card>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="ml-0.5 text-[12.5px] text-text-dim">Sua estante</p>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-line bg-bg-panel px-2.5 py-1 text-[11.5px] text-text-dim"
          >
            <Plus size={12} /> Novo livro
          </button>
        </div>

        {mostrarForm && (
          <Card className="mb-3 flex flex-col gap-2 p-3.5">
            <input
              placeholder="Título"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-text placeholder:text-text-dim"
            />
            <input
              placeholder="Autor (opcional)"
              value={novoAutor}
              onChange={(e) => setNovoAutor(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-text placeholder:text-text-dim"
            />
            {pessoas.length > 1 && (
              <select
                value={novaPessoaId}
                onChange={(e) => setNovaPessoaId(e.target.value)}
                className="rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-text"
              >
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={adicionarLivro}
              disabled={salvandoNovo || !novoTitulo.trim()}
              className="mt-1 rounded-lg bg-accent-soft py-2 text-[13px] text-accent disabled:opacity-50"
            >
              {salvandoNovo ? "Salvando..." : "Adicionar"}
            </button>
          </Card>
        )}

        {estante.length === 0 ? (
          <Card className="p-4 text-sm text-text-dim">Nenhum outro livro na estante.</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {estante.map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-blue/15">
                  <BookOpen size={15} className="text-blue" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-text">{l.titulo}</p>
                  {l.autor && (
                    <p className="mt-0.5 truncate text-[11px] text-text-dim">{l.autor}</p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs text-text-dim">
                  {Math.round(l.progresso) >= 100 ? "concluído" : `${Math.round(l.progresso)}%`}
                </span>
                <button
                  onClick={() => marcarComoAtual(l)}
                  disabled={marcandoId === l.id}
                  className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] text-text-dim disabled:opacity-50"
                >
                  {marcandoId === l.id ? "..." : "Marcar como atual"}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
