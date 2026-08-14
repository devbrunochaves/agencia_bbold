import { forwardRef, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-flow-border bg-flow-panel-alt text-flow-yellow accent-flow-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-yellow ${className}`}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-flow-text-secondary">
        {input}
        {label}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
