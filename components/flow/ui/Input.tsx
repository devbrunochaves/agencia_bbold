import { forwardRef, type InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`h-9 w-full rounded-lg border border-flow-border bg-flow-panel-alt px-3 text-sm text-flow-text-primary outline-none transition-colors placeholder:text-flow-text-muted focus:border-flow-yellow disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);

Input.displayName = "Input";
export default Input;
