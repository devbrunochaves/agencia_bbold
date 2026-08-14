import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

export default function SearchInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-flow-text-muted"
      />
      <input
        type="search"
        className={`h-9 w-full rounded-lg border border-flow-border bg-flow-panel-alt py-2 pl-9 pr-3 text-sm text-flow-text-primary outline-none transition-colors placeholder:text-flow-text-muted focus:border-flow-yellow ${className}`}
        {...props}
      />
    </div>
  );
}
