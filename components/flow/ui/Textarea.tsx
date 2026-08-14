import { forwardRef, type TextareaHTMLAttributes } from "react";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-flow-border bg-flow-panel-alt px-3 py-2 text-sm text-flow-text-primary outline-none transition-colors placeholder:text-flow-text-muted focus:border-flow-yellow disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
export default Textarea;
