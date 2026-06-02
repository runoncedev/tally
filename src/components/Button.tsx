import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "outlined" | "filled" | "ghost";
type ButtonColor = "default" | "danger";
type ButtonShape = "default" | "square";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  color?: ButtonColor;
  shape?: ButtonShape;
};

const styles: Record<ButtonVariant, Record<ButtonColor, string>> = {
  outlined: {
    default:
      "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200",
    danger:
      "border border-red-400 text-red-500 hover:bg-red-200 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/60",
  },
  filled: {
    default:
      "bg-zinc-900 text-white hover:opacity-90 disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900",
    danger:
      "bg-red-500 text-white hover:bg-red-600 disabled:opacity-30",
  },
  ghost: {
    default:
      "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
    danger:
      "text-red-500 hover:bg-red-200 dark:text-red-400 dark:hover:bg-red-900/60",
  },
};

export function Button({
  variant = "ghost",
  color = "default",
  shape = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const padding = shape === "square" ? "p-2 aspect-square" : "px-3 py-1.5";
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none dark:focus-visible:ring-zinc-500 ${padding} ${styles[variant][color]} ${className}`}
    >
      {children}
    </button>
  );
}
