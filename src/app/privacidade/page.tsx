import type { Metadata } from "next";
import { BASE_PATH } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Política de Privacidade · Cerne",
};

// Página pública (sem login), exigida pelo Google para o login com Google
// e a conexão com o Google Agenda. Revisar com apoio jurídico antes de
// abrir o app para o público em geral.
export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-[640px] py-4 text-[14px] leading-relaxed text-text">
      <div className="mb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE_PATH}/icons/cerne-marca-256.png`} alt="" width={40} height={40} className="rounded-[11px]" />
        <p className="text-[20px] font-extrabold tracking-[0.12em] text-deep">CERNE</p>
      </div>

      <h1 className="font-display text-[22px]">Política de Privacidade</h1>
      <p className="mt-1 text-[12.5px] text-text-dim">Atualizada em 25 de novembro de 2026</p>

      <Secao titulo="Quem somos">
        O Cerne é um aplicativo de organização da vida pessoal: finanças, hábitos, agenda, saúde e
        vida espiritual, em um só lugar. Esta política explica quais dados o Cerne usa e por quê.
      </Secao>

      <Secao titulo="Dados que coletamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados de conta: seu e-mail e nome, informados no cadastro ou pelo login com Google.</li>
          <li>
            O que você registra no app: gastos, receitas, metas, hábitos, tarefas, compromissos,
            leituras e demais anotações.
          </li>
          <li>
            Google Agenda (somente se você conectar): leitura dos seus eventos, para mostrá-los na
            sua agenda dentro do Cerne. O Cerne não cria, altera nem apaga eventos na sua conta
            Google.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Como usamos os dados">
        Usamos seus dados apenas para fazer o Cerne funcionar para você: mostrar seus painéis,
        organizar seus registros e sincronizar sua agenda. Não vendemos seus dados e não os usamos
        para publicidade.
      </Secao>

      <Secao titulo="Dados do Google">
        O uso de informações recebidas das APIs do Google segue a Política de Dados do Usuário dos
        Serviços de API do Google, incluindo os requisitos de Uso Limitado. Os dados da sua agenda
        são usados só para exibir seus compromissos no app e não são compartilhados com terceiros.
      </Secao>

      <Secao titulo="Onde os dados ficam">
        Os dados são armazenados com criptografia em trânsito na infraestrutura do Supabase, e o
        app é hospedado na Vercel. Cada conta só acessa os próprios dados.
      </Secao>

      <Secao titulo="Seus direitos">
        Você pode pedir a qualquer momento acesso, correção ou exclusão dos seus dados, e pode
        desconectar o Google Agenda nas permissões da sua conta Google
        (myaccount.google.com/permissions). Os pedidos podem ser feitos pelo e-mail de contato do
        app informado na tela de login com Google.
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[15px] font-semibold text-deep">{titulo}</h2>
      <div className="mt-1.5 text-text">{children}</div>
    </section>
  );
}
