import { ButtonHTMLAttributes, ReactNode } from "react";



export const NeonButton = ({ 
  children, 
  className, 
  variant = "primary",
  size = "md",
  glow = false,
  ...props 
}) => {
  return (
    <button
      className={
        "relative overflow-hidden rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95" +
        // Base styles
        "border border-transparent" +
        // Size variants
        (size === "sm" && "px-4 py-2 text-sm") +
        (size === "md" && "px-6 py-3 text-base") +
        (size === "lg" && "px-8 py-4 text-lg") +
        // Color variants
        (variant === "primary" && "bg-gradient-primary text-primary-foreground hover:shadow-lg") +
        (variant === "secondary" && "bg-gradient-secondary text-secondary-foreground hover:shadow-lg") +
        (variant === "premium" && "bg-premium text-premium-foreground border-premium/50 hover:shadow-lg") +
        (variant === "ghost" && "glass text-foreground hover:bg-glass border-glass-border") +
        // Glow effects
        (glow && variant === "primary" && "glow-primary pulse-glow") +
        (glow && variant === "premium" && "glow-premium") +
        className
      }
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] hover:translate-x-full transition-transform duration-1000" />
    </button>
  );
};