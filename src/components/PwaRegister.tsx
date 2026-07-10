"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // só registra em produção — em dev o SW cacheia respostas (inclusive
    // redirects de auth) de um jeito que atrapalha o hot reload e pode
    // deixar a sessão "presa" numa resposta antiga.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // instalação do PWA é um extra progressivo — falha aqui não deve
        // impedir o uso do app.
      });
    }
  }, []);

  return null;
}
