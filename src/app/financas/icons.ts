import {
  Home,
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Heart,
  Briefcase,
  Wallet,
  Circle,
  type LucideIcon,
} from "lucide-react";

// Mapa simples de palavras-chave do nome/campo "icone" da categoria para
// um ícone lucide. Fallback é Circle.
const ICON_MAP: Record<string, LucideIcon> = {
  moradia: Home,
  casa: Home,
  alimentacao: Utensils,
  mercado: Utensils,
  comida: Utensils,
  transporte: Car,
  carro: Car,
  assinaturas: Film,
  assinatura: Film,
  streaming: Film,
  compras: ShoppingBag,
  saude: Heart,
  trabalho: Briefcase,
  salario: Briefcase,
  dinheiro: Wallet,
  financas: Wallet,
};

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function iconeCategoria(nomeOuIcone: string | null | undefined): LucideIcon {
  if (!nomeOuIcone) return Circle;
  const key = normalize(nomeOuIcone);
  for (const [k, icon] of Object.entries(ICON_MAP)) {
    if (key.includes(k)) return icon;
  }
  return Circle;
}
