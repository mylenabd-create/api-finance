import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-bg-panel shadow-[0_1px_2px_rgba(49,0,79,0.05)] active:bg-bg-panel-raised ${className}`}
      {...props}
    />
  );
}
