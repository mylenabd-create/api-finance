"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BASE_PATH } from "@/lib/basePath";
import { Send } from "lucide-react";

// "G" oficial do Google, nas cores da marca (padrão do botão "Continuar com Google").
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setLoading(true);

    const { error } =
      mode === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha });

    setLoading(false);

    if (error) {
      setErro(error.message);
      return;
    }

    if (mode === "criar") {
      setAviso("Conta criada. Verifique seu e-mail para confirmar o acesso.");
      return;
    }

    // Cria a conta (primeiro login) ou corrige o nome da pessoa titular se
    // ainda estiver genérico — só roda aqui, uma vez por login, não em toda
    // navegação (ver src/lib/conta.ts).
    await supabase.rpc("bootstrap_conta");

    router.replace("/");
    router.refresh();
  }

  async function handleGoogle() {
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${BASE_PATH}/auth/callback` },
    });
    if (error) setErro(error.message);
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-2 py-10">
      <div className="flex flex-col items-center text-center">
        {/* Símbolo isolado Cerne Evolução (Manual CERNE, seção 4.D) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE_PATH}/icons/cerne-marca-256.png`}
          alt="Cerne"
          width={88}
          height={88}
          className="rounded-[22px] shadow-[0_8px_24px_rgba(49,0,79,0.25)]"
        />
        <p className="mt-4 text-[28px] font-extrabold tracking-[0.12em] text-deep">CERNE</p>
        <p className="mt-0.5 text-[13px] text-text-dim">Organize sua vida. Encontre seu centro.</p>
        <h1 className="mt-6 font-display text-[22px] text-text">
          {mode === "entrar" ? "Bem-vinda de volta" : "Criar sua conta"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-line bg-bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-2xl border border-line bg-bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {erro && <p className="text-[12.5px] text-coral">{erro}</p>}
        {aviso && <p className="text-[12.5px] text-teal">{aviso}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-60"
        >
          <Send size={15} />
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        onClick={handleGoogle}
        className="flex items-center justify-center gap-2.5 rounded-2xl border border-line bg-bg-panel px-4 py-3 text-sm font-medium text-text"
      >
        <GoogleLogo />
        Continuar com Google
      </button>

      <button
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setErro(null);
          setAviso(null);
        }}
        className="text-center text-[12.5px] text-text-dim"
      >
        {mode === "entrar"
          ? "Não tem conta? Criar agora"
          : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
