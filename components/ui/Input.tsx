"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const inputClasses = `
      w-full
      bg-background-elevated
      border
      ${hasError ? "border-danger focus:border-danger" : "border-border focus:border-primary"}
      rounded-md
      px-4
      py-3
      text-text-primary
      placeholder:text-text-tertiary
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      ${hasError ? "focus:ring-danger/20" : "focus:ring-primary/20"}
      disabled:opacity-50
      disabled:cursor-not-allowed
      ${icon && iconPosition === "left" ? "pl-11" : ""}
      ${icon && iconPosition === "right" ? "pr-11" : ""}
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
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />

          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
