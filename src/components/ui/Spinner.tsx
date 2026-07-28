import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-brand-500 border-t-transparent",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="در حال بارگذاری"
    />
  );
}
