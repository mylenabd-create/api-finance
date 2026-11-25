import { Home, Wallet, Flame, Calendar, Sparkles, type LucideIcon } from "lucide-react";

export type Grupo = {
  titulo: string;
  curto: string;
  href: string;
  icon: LucideIcon;
  atalhos: { label: string; aba: string }[];
};

// Mapa do app: cada área e as abas dela (abertas via ?aba=).
export const GRUPOS: Grupo[] = [
  { titulo: "Início", curto: "Início", href: "/", icon: Home, atalhos: [] },
  {
    titulo: "Finanças",
    curto: "Finanças",
    href: "/financas",
    icon: Wallet,
    atalhos: [
      { label: "Despesas", aba: "despesas" },
      { label: "Receitas", aba: "receitas" },
      { label: "Metas", aba: "metas" },
      { label: "Futuro", aba: "futuro" },
    ],
  },
  {
    titulo: "Hábitos & saúde",
    curto: "Hábitos",
    href: "/habitos",
    icon: Flame,
    atalhos: [
      { label: "Hábitos", aba: "habitos" },
      { label: "Sono", aba: "sono" },
      { label: "Exercício", aba: "exercicio" },
      { label: "Bioimpedância", aba: "bioimpedancia" },
    ],
  },
  {
    titulo: "Agenda & tempo",
    curto: "Agenda",
    href: "/agenda",
    icon: Calendar,
    atalhos: [
      { label: "Agenda", aba: "agenda" },
      { label: "Tarefas", aba: "tarefas" },
      { label: "Trabalho x vida", aba: "trabalho" },
    ],
  },
  {
    titulo: "Espiritual & leitura",
    curto: "Espiritual",
    href: "/espiritual",
    icon: Sparkles,
    atalhos: [
      { label: "Espiritual", aba: "espiritual" },
      { label: "Leitura", aba: "leitura" },
    ],
  },
];

export function grupoAtivo(href: string, pathname: string | null) {
  return href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
}
