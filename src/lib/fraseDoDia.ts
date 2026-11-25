// Frase do dia personalizada, sem IA: monta frases a partir das metas,
// hábitos, leitura, prática espiritual e rotina da pessoa, e escolhe uma
// por dia (a mesma frase o dia todo; muda no dia seguinte).
// Tom de voz do Manual CERNE: claro, positivo, próximo, sem cobrança nem culpa.

export interface ContextoFrase {
  nome: string;
  hojeStr: string; // YYYY-MM-DD
  habitos: string[];
  livroAtual: string | null;
  sequenciaEspiritual: number;
  praticouHoje: boolean;
  treinosSemana: number;
  tarefasPendentes: number;
  temMetaFinanceira: boolean;
  progressoFinancas: number | null; // gasto / meta do mês
}

export interface FraseDoDia {
  texto: string;
  tema: "finanças" | "hábitos" | "leitura" | "espiritual" | "movimento" | "foco" | "centro";
}

const GERAIS: FraseDoDia[] = [
  { tema: "centro", texto: "Organize sua vida. Encontre seu centro." },
  { tema: "centro", texto: "Tudo começa pelo essencial. Qual é o seu essencial hoje?" },
  { tema: "centro", texto: "Pequenos passos, repetidos com carinho, viram grandes mudanças." },
  { tema: "centro", texto: "Você não precisa dar conta de tudo hoje. Só do próximo passo." },
  { tema: "centro", texto: "Clareza vem antes do controle. Olhe para sua vida com calma." },
  { tema: "centro", texto: "Evoluir é um movimento, não uma linha reta." },
  { tema: "foco", texto: "Escolha uma coisa importante e dê a ela o melhor da sua manhã." },
  { tema: "foco", texto: "Feito com presença vale mais do que perfeito." },
  { tema: "centro", texto: "Seu tempo é a sua vida acontecendo. Use-o no que importa para você." },
  { tema: "centro", texto: "Cuidar de si também é produtividade." },
];

function hashDia(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function personalizadas(c: ContextoFrase): FraseDoDia[] {
  const p: FraseDoDia[] = [];
  const nome = c.nome && c.nome !== "Você" ? c.nome.split(" ")[0] : null;
  const voc = nome ? `${nome}, ` : "";

  // Finanças
  if (c.temMetaFinanceira && c.progressoFinancas !== null) {
    if (c.progressoFinancas < 0.8) {
      p.push({ tema: "finanças", texto: `${voc}seus gastos estão dentro do planejado. Cada escolha consciente te aproxima das suas metas.` });
    } else if (c.progressoFinancas <= 1) {
      p.push({ tema: "finanças", texto: "Você está perto do limite que definiu para o mês. Respire e escolha com intenção: o plano é seu." });
    } else {
      p.push({ tema: "finanças", texto: "Mês apertado não define você. Ajustar a rota também é estar no controle." });
    }
  } else {
    p.push({ tema: "finanças", texto: "Dinheiro organizado é tranquilidade. Que tal definir uma meta para este mês?" });
  }

  // Hábitos
  if (c.habitos.length > 0) {
    const h = c.habitos[hashDia(c.hojeStr + "h") % c.habitos.length];
    p.push({ tema: "hábitos", texto: `"${h}" é um presente que você dá para a sua versão de amanhã.` });
    p.push({ tema: "hábitos", texto: `${voc}consistência não é fazer muito: é voltar sempre. Seus hábitos te esperam hoje.` });
  }

  // Leitura
  if (c.livroAtual) {
    p.push({ tema: "leitura", texto: `Algumas páginas de "${c.livroAtual}" hoje já são um avanço.` });
  }

  // Espiritual
  if (c.sequenciaEspiritual >= 2) {
    p.push({ tema: "espiritual", texto: `${c.sequenciaEspiritual} dias seguidos cuidando do seu interior. Continue voltando ao seu centro.` });
  } else if (!c.praticouHoje) {
    p.push({ tema: "espiritual", texto: "Reserve um momento de silêncio hoje. É ali que a gente se reencontra." });
  }

  // Movimento
  if (c.treinosSemana > 0) {
    p.push({ tema: "movimento", texto: `${c.treinosSemana} ${c.treinosSemana === 1 ? "treino" : "treinos"} nesta semana. Seu corpo agradece cada movimento.` });
  } else {
    p.push({ tema: "movimento", texto: "Uma caminhada curta já muda o dia. Movimento também é cuidado." });
  }

  // Foco / tarefas
  if (c.tarefasPendentes > 0) {
    p.push({ tema: "foco", texto: `${voc}você tem ${c.tarefasPendentes} ${c.tarefasPendentes === 1 ? "tarefa" : "tarefas"} na lista. Comece pela que deixa seu dia mais leve.` });
  }

  return p;
}

export function fraseDoDia(c: ContextoFrase): FraseDoDia {
  const pessoais = personalizadas(c);
  // 2 em cada 3 dias a frase é personalizada; no outro, uma frase da marca
  const h = hashDia(c.hojeStr);
  const lista = pessoais.length > 0 && h % 3 !== 0 ? pessoais : GERAIS;
  return lista[h % lista.length];
}
