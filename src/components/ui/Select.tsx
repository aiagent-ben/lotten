import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || (label ? generatedId : undefined);

    return (
      <div className={cn("relative w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200",
              "text-sm font-medium text-stone-800 shadow-xs transition-all cursor-pointer",
              "hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50",
              error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
