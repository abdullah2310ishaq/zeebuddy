import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      type = "text",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-black dark:text-gray-100"
          >
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-600 cursor-text text-black",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",

            // Error state
            error && "border-red-500 focus:ring-red-500",

            className
          )}
          {...props}
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
