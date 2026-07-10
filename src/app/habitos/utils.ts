import type { Tables } from "@/lib/database.types";

export function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function hojeStr() {
  return toDateOnly(new Date());
}

export function ontemStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateOnly(d);
}

/**
 * Calcula a sequência atual (dias consecutivos concluídos) de um hábito,
 * terminando hoje ou ontem (tolera o dia de hoje ainda não marcado).
 */
export function calcularStreak(registros: Tables<"habito_registro">[]): number {
  const concluidos = new Set(
    registros.filter((r) => r.concluido).map((r) => r.data)
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Se hoje não está concluído, a sequência (se existir) deve terminar ontem.
  const cursor = new Date(hoje);
  if (!concluidos.has(toDateOnly(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (concluidos.has(toDateOnly(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function medalha(streak: number): { label: string; cor: string } | null {
  if (streak >= 100) return { label: "100 dias", cor: "var(--purple)" };
  if (streak >= 30) return { label: "30 dias", cor: "var(--accent)" };
  if (streak >= 7) return { label: "7 dias", cor: "var(--teal)" };
  return null;
}

/**
 * Duração da noite em minutos, tratando virada de dia (acordou < dormiu).
 */
export function duracaoSonoMinutos(
  dormiu: string | null,
  acordou: string | null
): number | null {
  if (!dormiu || !acordou) return null;
  const [h1, m1] = dormiu.split(":").map(Number);
  const [h2, m2] = acordou.split(":").map(Number);
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos <= 0) minutos += 24 * 60;
  return minutos;
}

export function formatarDuracao(minutos: number | null): string {
  if (minutos === null) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
