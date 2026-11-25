import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/format";

// Balanço geral do mês: saldo em destaque + entradas e saídas, com uma
// barra mostrando quanto do que entrou já saiu.
export function BalancoMes({
  entrou,
  saiu,
  mes,
  href,
}: {
  entrou: number;
  saiu: number;
  mes?: string;
  href?: string;
}) {
  const saldo = entrou - saiu;
  const positivo = saldo >= 0;
  const usado = entrou > 0 ? Math.min(saiu / entrou, 1) : saiu > 0 ? 1 : 0;

  const conteudo = (
    <div className="rounded-2xl bg-deep p-4 text-white transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.3px] text-white/65">
          Saldo {mes ? `de ${mes}` : "do mês"}
        </p>
        {href && <ChevronRight size={16} className="text-white/60" />}
      </div>
      <p
        className={`mt-1 font-mono text-[30px] font-semibold leading-tight ${
          positivo ? "text-white" : "text-[#FF8A7A]"
        }`}
      >
        {positivo ? "" : "−"}
        {formatBRL(Math.abs(saldo))}
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
        <div
          className="bg-brand-gradient h-full rounded-full transition-[width] duration-700"
          style={{ width: `${usado * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-white/60">
        {entrou > 0
          ? `${Math.round((saiu / entrou) * 100)}% do que entrou já saiu`
          : saiu > 0
            ? "Nenhuma entrada registrada neste mês"
            : "Nenhum lançamento neste mês ainda"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-white/70">
            <ArrowUpRight size={13} className="text-[#7CE0B5]" /> Entrou
          </p>
          <p className="mt-0.5 font-mono text-[15px] font-medium">{formatBRL(entrou)}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-white/70">
            <ArrowDownRight size={13} className="text-[#FF8A7A]" /> Saiu
          </p>
          <p className="mt-0.5 font-mono text-[15px] font-medium">{formatBRL(saiu)}</p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{conteudo}</Link> : conteudo;
}
