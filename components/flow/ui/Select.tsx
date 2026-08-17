import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`h-9 w-full appearance-none rounded-lg border border-flow-border bg-flow-panel-alt pl-3 pr-8 text-sm text-flow-text-primary outline-none transition-colors focus:border-flow-yellow disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-flow-text-muted"
      />
    </div>
  )
);

Select.displayName = "Select";
export default Select;
