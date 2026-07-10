# Gestor de Vida

App de gestão de vida pessoal (PWA) com uma "secretária" com IA que recebe lançamentos por texto, áudio, imagem ou documento e atualiza automaticamente finanças, hábitos & corpo, agenda & tempo e espiritual & leitura. Suporta múltiplas pessoas numa mesma conta (uso familiar).

Stack: Next.js (App Router) + Supabase (Postgres + Auth) + Claude API + Vercel. Veja `PROJECT_BRIEF_1.md` (na pasta pai) para o desenho completo do produto.

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor** do projeto, rode o conteúdo de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) — isso cria todas as tabelas, índices e políticas de RLS.
3. Em **Authentication → Providers**, confirme que **Email** está ativado. Se quiser login com Google (opcional, seção 9 do brief):
   - Ative o provedor **Google**.
   - Crie um OAuth Client no [Google Cloud Console](https://console.cloud.google.com/) e configure a URL de redirecionamento que o Supabase mostrar na tela do provedor.
4. Em **Project Settings → API**, copie a `Project URL`, a `anon public key` e a `service_role key`.

## 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — do passo 1.
- `ANTHROPIC_API_KEY` — chave da API do Claude, em [console.anthropic.com](https://console.anthropic.com). Necessária para a "secretária" (texto, imagem e PDF).
- `OPENAI_API_KEY` — opcional, só para transcrever **áudio** (Whisper) antes de mandar pro Claude. Sem essa chave, o app funciona normalmente, só o envio de áudio fica indisponível.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — opcional, só se for usar a sincronização com Google Calendar (fase futura, ainda não implementada nesta etapa).

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Crie uma conta pela tela de login (e-mail/senha) — a primeira pessoa a entrar cria automaticamente a "conta" (uso familiar) e uma `pessoa` chamada "Você".

## 4. Estrutura

```
src/app/            rotas (App Router) — painel, financas, habitos, agenda, espiritual, login
src/app/api/         rotas de API — /api/mensagem (pipeline da secretária com IA)
src/components/      AppShell, BottomNav, PwaRegister, componentes de UI reutilizáveis
src/lib/             clientes Supabase, tipos do banco, integração com Claude/Whisper
supabase/migrations/ schema SQL
public/               manifest.json, ícones e service worker do PWA
```

## 5. A "secretária" (IA)

`POST /api/mensagem` aceita:

- JSON `{ "texto": "gastei 45 no mercado" }`, ou
- `multipart/form-data` com campo `texto` (opcional) e `arquivo` (imagem, PDF ou áudio).

O Claude extrai um ou mais lançamentos estruturados (despesa, receita, hábito, tarefa, compromisso, leitura, prática espiritual, treino, sono) e o app grava direto nas tabelas certas do Supabase. Avaliações de bioimpedância (peso/altura/gordura/etc) ficam de fora desse pipeline por terem campos numéricos demais para extrair de uma frase solta — use o formulário dedicado em `/habitos`.

## 6. PWA

O app já tem `manifest.json` e um service worker (`public/sw.js`) com fallback offline. Os ícones em `public/icons/` são placeholders em SVG — troque por PNGs reais (192×192 e 512×512, incluindo uma versão maskable) antes de divulgar o app.

## 7. Deploy na Vercel

1. Suba esta pasta (`app-gestao-pessoal`, já é o próprio repositório git) pro GitHub: `git remote add origin <url> && git push -u origin main`.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório (Root Directory = raiz do repo, sem ajustes — o `package.json` já está na raiz).
3. Adicione as mesmas variáveis de ambiente do `.env.local` nas configurações do projeto na Vercel.
4. Deploy. Depois, no Supabase, adicione a URL de produção em **Authentication → URL Configuration** (Site URL e Redirect URLs) para o login funcionar.
5. Abra a URL de produção no celular e use "Adicionar à tela de início" para instalar o PWA.

## 8. Próximos passos (fase 2)

Integração com WhatsApp via Z-API, reaproveitando o mesmo pipeline de `/api/mensagem` (é só trocar a origem da mensagem).
