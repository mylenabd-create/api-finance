import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <WifiOff size={28} className="text-text-dim" />
      <h1 className="font-display text-xl font-medium">Você está offline</h1>
      <p className="text-sm text-text-dim">
        Sem conexão no momento. Assim que a internet voltar, o Gestor de Vida
        volta a sincronizar automaticamente.
      </p>
    </div>
  );
}
