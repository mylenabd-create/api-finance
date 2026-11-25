// Frase do dia, sem IA: tom direto, de "se liga na vida". Frases originais
// inspiradas nas ideias de livros como Hábitos Atômicos, O Poder do Agora,
// Antifrágil e O Segredo, e em passagens bíblicas (parafraseadas, com a
// referência). Muitas são montadas com os dados da pessoa: hábitos, metas,
// livro atual, prática espiritual, treinos e tarefas.
// A mesma frase vale o dia todo; muda no dia seguinte.

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
  fonte: string; // inspiração ou referência
}

const HABITOS_ATOMICOS = "inspirado em Hábitos Atômicos";
const PODER_DO_AGORA = "inspirado em O Poder do Agora";
const ANTIFRAGIL = "inspirado em Antifrágil";
const O_SEGREDO = "inspirado em O Segredo";

const GERAIS: FraseDoDia[] = [
  // Hábitos Atômicos: sistemas, identidade, 1% ao dia
  { fonte: HABITOS_ATOMICOS, texto: "Meta sem sistema é só desejo. O que você repete todo dia é o que você vira." },
  { fonte: HABITOS_ATOMICOS, texto: "1% melhor hoje parece nada. Daqui a um ano é outra pessoa. Faz o seu 1%." },
  { fonte: HABITOS_ATOMICOS, texto: "Cada ação é um voto na pessoa que você quer ser. Em quem você está votando hoje?" },
  { fonte: HABITOS_ATOMICOS, texto: "Não espera motivação. Deixa o hábito tão fácil que dê vergonha não fazer." },
  { fonte: HABITOS_ATOMICOS, texto: "Seu ambiente está te treinando o tempo todo. Arruma o ambiente e o resto vem." },
  // O Poder do Agora: presença
  { fonte: PODER_DO_AGORA, texto: "A vida só acontece agora. Para de ensaiar o futuro e de reprisar o passado." },
  { fonte: PODER_DO_AGORA, texto: "Você não é os seus pensamentos. Observa a mente falando e escolhe o que fazer." },
  { fonte: PODER_DO_AGORA, texto: "O problema de amanhã não se resolve hoje. A tarefa de hoje, sim. Foca nela." },
  // Antifrágil: crescer com o caos
  { fonte: ANTIFRAGIL, texto: "Pressão não é sinal para parar. É o treino que te deixa mais forte." },
  { fonte: ANTIFRAGIL, texto: "Quem só busca conforto fica frágil. Escolhe um desconforto útil hoje." },
  { fonte: ANTIFRAGIL, texto: "Erro pequeno e cedo é aula barata. Arrisca no pequeno, protege o essencial." },
  { fonte: ANTIFRAGIL, texto: "Não basta aguentar o caos. Usa ele para sair melhor do que entrou." },
  // O Segredo: foco e intenção
  { fonte: O_SEGREDO, texto: "Onde vai a sua atenção, vai a sua energia. Para de alimentar o que você não quer." },
  { fonte: O_SEGREDO, texto: "Decide o que você quer com clareza. Quem não sabe para onde vai aceita qualquer caminho." },
  { fonte: O_SEGREDO, texto: "Gratidão não é frescura: muda o que você enxerga e o que você atrai." },
  // Bíblia (paráfrases com referência)
  { fonte: "Provérbios 6:6-8", texto: "Olha a formiga: ninguém manda nela e ela faz a parte dela no tempo certo. E você?" },
  { fonte: "Provérbios 16:3", texto: "Entrega teus planos a Deus e põe a mão na massa. Fé e trabalho andam juntos." },
  { fonte: "Eclesiastes 3:1", texto: "Tem tempo para tudo. Mas o tempo que passou não volta. Usa bem o de hoje." },
  { fonte: "Mateus 6:34", texto: "Não carrega hoje o peso de amanhã. Cada dia tem a sua própria luta." },
  { fonte: "Lucas 16:10", texto: "Quem é fiel no pouco é fiel no muito. Começa cuidando bem do pouco que você tem." },
  { fonte: "Tiago 2:17", texto: "Fé sem atitude não sai do lugar. Qual atitude a sua fé pede hoje?" },
  { fonte: "Filipenses 4:13", texto: "Você pode mais do que imagina. Para de se subestimar e vai." },
  { fonte: "Josué 1:9", texto: "Coragem. Medo não é motivo para recuar, é sinal de que vale a pena." },
  { fonte: "Cerne", texto: "Organize sua vida. Encontre seu centro. E faz isso hoje, não segunda-feira." },
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
      p.push({ fonte: "Provérbios 21:5", texto: `${voc}o plano está funcionando. Quem planeja e segue o plano colhe. Não afrouxa agora.` });
    } else if (c.progressoFinancas <= 1) {
      p.push({ fonte: HABITOS_ATOMICOS, texto: "Você está no limite do que definiu para o mês. Cada compra agora é um voto: no seu plano ou contra ele." });
    } else {
      p.push({ fonte: ANTIFRAGIL, texto: "Estourou a meta. Beleza: dado é dado. Entende onde vazou e ajusta. Quem aprende com o erro fica mais forte." });
    }
  } else {
    p.push({ fonte: O_SEGREDO, texto: "Dinheiro sem destino some. Define uma meta para este mês e dá direção para cada real." });
  }

  // Hábitos
  if (c.habitos.length > 0) {
    const h = c.habitos[hashDia(c.hojeStr + "h") % c.habitos.length];
    p.push({ fonte: HABITOS_ATOMICOS, texto: `"${h}": não precisa ser perfeito, precisa ser hoje. Falhou ontem? Hoje não pode falhar de novo.` });
    p.push({ fonte: HABITOS_ATOMICOS, texto: `${voc}sonho grande com rotina bagunçada não fecha a conta. Quem decide seu resultado é a sua rotina.` });
  }

  // Leitura
  if (c.livroAtual) {
    p.push({ fonte: "Cerne", texto: `"${c.livroAtual}" não vai se ler sozinho. Dez páginas hoje. Sem desculpa.` });
  }

  // Espiritual
  if (c.sequenciaEspiritual >= 2) {
    p.push({ fonte: "Isaías 40:31", texto: `${c.sequenciaEspiritual} dias seguidos. Quem renova as forças no Senhor corre e não se cansa. Segue firme.` });
  } else if (!c.praticouHoje) {
    p.push({ fonte: "Marcos 1:35", texto: "Até Jesus levantava cedo para orar antes de tudo. Qual é a sua desculpa hoje?" });
  }

  // Movimento
  if (c.treinosSemana > 0) {
    p.push({ fonte: ANTIFRAGIL, texto: `${c.treinosSemana} ${c.treinosSemana === 1 ? "treino" : "treinos"} na semana. O corpo cresce com o esforço. Não deixa a semana esfriar.` });
  } else {
    p.push({ fonte: ANTIFRAGIL, texto: "Nenhum treino na semana. Corpo parado enferruja. Vinte minutos hoje já quebram o ciclo." });
  }

  // Foco / tarefas
  if (c.tarefasPendentes > 0) {
    p.push({ fonte: PODER_DO_AGORA, texto: `${voc}${c.tarefasPendentes} ${c.tarefasPendentes === 1 ? "tarefa esperando" : "tarefas esperando"}. Pensar nelas cansa mais do que fazer. Escolhe uma e resolve agora.` });
  }

  return p;
}

export function fraseDoDia(c: ContextoFrase): FraseDoDia {
  const pessoais = personalizadas(c);
  // metade dos dias usa os dados da pessoa; na outra, uma frase do acervo
  const h = hashDia(c.hojeStr);
  const lista = pessoais.length > 0 && h % 2 === 0 ? pessoais : GERAIS;
  return lista[Math.floor(h / 2) % lista.length];
}
