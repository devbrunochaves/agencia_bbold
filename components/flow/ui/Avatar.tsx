export default function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" }[
    size
  ];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-flow-yellow font-semibold text-black ${sizeClass}`}
    >
      {initials || "?"}
    </div>
  );
}
