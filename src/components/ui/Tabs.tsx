"use client";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-full border border-line bg-bg-panel p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
            active === tab.key
              ? "bg-accent font-medium text-on-accent"
              : "text-text-dim"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
