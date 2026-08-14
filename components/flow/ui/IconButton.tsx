import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  "aria-label": string;
  size?: "sm" | "md";
}

export default function IconButton({
  icon,
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg text-flow-text-muted transition-colors duration-150 hover:bg-flow-panel-alt hover:text-flow-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-yellow disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
