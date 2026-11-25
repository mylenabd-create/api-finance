"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // só registra em produção — em dev o SW cacheia respostas (inclusive
    // redirects de auth) de um jeito que atrapalha o hot reload e pode
    // deixar a sessão "presa" numa resposta antiga.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      // updateViaCache "none": o navegador sempre confere se há versão nova do SW
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
        // instalação do PWA é um extra progressivo — falha aqui não deve
        // impedir o uso do app.
      });
    }
  }, []);

  return null;
}
