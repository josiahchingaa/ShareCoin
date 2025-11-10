"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const selectClasses = `
      w-full
      bg-background-elevated
      border
      ${hasError ? "border-danger focus:border-danger" : "border-border focus:border-primary"}
      rounded-md
      px-4
      py-3
      pr-10
      text-text-primary
      appearance-none
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      ${hasError ? "focus:ring-danger/20" : "focus:ring-primary/20"}
      disabled:opacity-50
      disabled:cursor-not-allowed
      cursor-pointer
      ${className}
    `.trim();

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={selectClasses}
            disabled={disabled}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {error && <p className="mt-1 text-sm text-danger">{error}</p>}

        {!error && helperText && (
          <p className="mt-1 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
