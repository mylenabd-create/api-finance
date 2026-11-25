import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Voltar ao início"
      className="flex h-8 w-8 shrink-0 lg:hidden items-center justify-center rounded-full text-text active:bg-bg-panel-raised"
    >
      <ArrowLeft size={20} />
    </Link>
  );
}
