"use client";

export default function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-flow-bg ${
        checked ? "bg-flow-yellow" : "bg-flow-border-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform duration-150 ${
          checked ? "translate-x-4 bg-black" : "translate-x-0.5 bg-flow-text-muted"
        }`}
      />
    </button>
  );
}
