import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, fullWidth = false, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-surface-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                "w-full rounded-xl border bg-surface-900 px-4 py-2.5 text-sm text-surface-100",
                "placeholder:text-surface-600 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                icon && "pr-10",
                error
                  ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                  : "border-surface-700 hover:border-surface-600",
                className
              )
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
