import * as React from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "relative bg-accent text-white font-semibold overflow-hidden",
    "shadow-accent-sm hover:shadow-accent",
    "hover:bg-accent-hover active:scale-[0.98]",
    "before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-150",
  ].join(" "),
  secondary: [
    "bg-canvas-overlay text-ink border border-border",
    "hover:border-white/15 hover:bg-white/5 active:scale-[0.98]",
    "backdrop-blur-sm",
  ].join(" "),
  ghost: [
    "bg-transparent text-ink-muted",
    "hover:text-ink hover:bg-white/5 active:scale-[0.98]",
  ].join(" "),
  danger: [
    "bg-danger text-white font-semibold",
    "hover:bg-danger-hover active:scale-[0.98]",
    "shadow-[0_0_16px_0_rgb(239_68_68_/_0.25)] hover:shadow-[0_0_24px_0_rgb(239_68_68_/_0.4)]",
  ].join(" "),
  gold: [
    "relative bg-gold text-[#0A0C10] font-semibold overflow-hidden",
    "shadow-gold hover:bg-gold-hover active:scale-[0.98]",
    "before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-150",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-[8px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-card gap-2",
  lg: "h-12 px-6 text-sm rounded-lg gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-body font-medium transition-all duration-150 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
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
