"use client";

import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const currentLength =
      typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-surface-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-500",
            "min-h-[80px] resize-y",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-surface-300 focus:border-primary-500 focus:ring-primary-500/20",
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between mt-1.5">
          <div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-sm text-surface-500">{helperText}</p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs ml-auto",
                currentLength >= maxLength
                  ? "text-red-500"
                  : "text-surface-400"
              )}
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
