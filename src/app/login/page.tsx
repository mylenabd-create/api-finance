"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";

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

    router.replace("/");
    router.refresh();
  }

  async function handleGoogle() {
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro(error.message);
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-2 py-10">
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-[1.2px] text-text-dim">
          Gestor de Vida
        </p>
        <h1 className="mt-1 font-display text-[26px] font-medium">
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
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60"
        >
          <Send size={15} />
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        onClick={handleGoogle}
        className="rounded-2xl border border-line bg-bg-panel px-4 py-3 text-sm text-text"
      >
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
