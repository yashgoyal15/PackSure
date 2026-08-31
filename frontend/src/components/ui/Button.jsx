import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-600/20",
  secondary: "bg-white text-primary-600 border border-primary-600 hover:bg-primary-50",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
  outline: "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50",
  accent: "bg-accent-600 text-white hover:bg-accent-700",
};

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  return (
    <Comp
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      {children}
      {!loading && IconRight && <IconRight className="h-4 w-4 shrink-0" />}
    </Comp>
  );
}
