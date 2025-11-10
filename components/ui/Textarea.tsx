"use client";

import React, { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      resize = "vertical",
      className = "",
      disabled = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const textareaClasses = `
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
      ${resizeClasses[resize]}
      ${className}
    `.trim();

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          rows={rows}
          {...props}
        />

        {error && <p className="mt-1 text-sm text-danger">{error}</p>}

        {!error && helperText && (
          <p className="mt-1 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
