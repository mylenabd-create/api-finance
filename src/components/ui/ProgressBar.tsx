export function ProgressBar({
  progress,
  color = "var(--accent)",
  height = 4,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-full bg-track"
      style={{ height }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
          height: "100%",
          background: color,
        }}
      />
    </div>
  );
}
