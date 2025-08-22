
export const GlassCard = ({ 
  children, 
  className, 
  variant = "default",
  glow = false 
}) => {
  return (
    <div
      className={
        "glass rounded-2xl p-6 transition-all duration-300 hover:scale-105" +
        (variant === "strong" && "glass-strong") +
        (variant === "premium" && "border-premium/30 bg-gradient-to-br from-premium/5 to-transparent") +
        (glow && variant === "default" && "glow-primary") +
        (glow && variant === "premium" && "glow-premium") +
        className
      }
    >
      {children}
    </div>
  );
};