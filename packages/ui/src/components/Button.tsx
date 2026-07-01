import * as React from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-ink text-canvas font-medium",
    "hover:opacity-90 active:scale-[0.98]",
  ].join(" "),
  secondary: [
    "bg-transparent text-ink border border-border",
    "hover:bg-canvas-overlay active:scale-[0.98]",
  ].join(" "),
  ghost: [
    "bg-transparent text-ink-muted",
    "hover:text-ink hover:bg-canvas-overlay active:scale-[0.98]",
  ].join(" "),
  danger: [
    "bg-danger text-white font-medium",
    "hover:opacity-90 active:scale-[0.98]",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
  md: "h-10 px-4 text-sm rounded-card gap-2",
  lg: "h-12 px-6 text-sm rounded-lg gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-body font-medium transition-all duration-100 select-none",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
