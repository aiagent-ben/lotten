import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "amber" | "stone" | "success" | "warning" | "destructive" | "outline";
  size?: "default" | "sm";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  stone: "bg-stone-100 text-stone-700 border-stone-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-900 border-amber-300",
  destructive: "bg-red-50 text-red-800 border-red-200",
  outline: "bg-white text-stone-800 border-stone-200",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  default: "px-2.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-[11px]",
};

export function Badge({
  className,
  variant = "amber",
  size = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border tracking-wide transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
