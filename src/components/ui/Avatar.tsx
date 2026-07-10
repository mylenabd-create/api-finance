import { initials } from "@/lib/format";

export function Avatar({
  nome,
  cor,
  small,
}: {
  nome: string;
  cor: string;
  small?: boolean;
}) {
  const size = small ? "h-[18px] w-[18px] text-[9px]" : "h-[30px] w-[30px] text-[11.5px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${size}`}
      style={{ background: `${cor}33`, color: cor }}
    >
      {initials(nome)}
    </div>
  );
}
