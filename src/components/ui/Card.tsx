import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-bg-panel active:bg-bg-panel-raised ${className}`}
      {...props}
    />
  );
}
