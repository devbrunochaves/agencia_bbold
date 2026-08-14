export default function ProgressBar({
  value,
  max = 100,
  tone = "yellow",
}: {
  value: number;
  max?: number;
  tone?: "yellow" | "success" | "danger" | "info";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const toneClass = {
    yellow: "bg-flow-yellow",
    success: "bg-flow-success",
    danger: "bg-flow-danger",
    info: "bg-flow-info",
  }[tone];

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-1.5 w-full overflow-hidden rounded-full bg-flow-panel-alt"
    >
      <div
        className={`h-full rounded-full transition-all duration-200 ${toneClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
