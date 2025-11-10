"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-main disabled:opacity-50 disabled:cursor-not-allowed";

    // Variant styles
    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-hover active:bg-primary-active hover:shadow-glow-blue disabled:hover:shadow-none",
      secondary:
        "bg-transparent border border-border text-text-primary hover:border-primary hover:bg-primary/10 active:bg-primary/20",
      ghost:
        "bg-transparent text-text-secondary hover:text-primary hover:bg-primary/5 active:bg-primary/10",
      danger:
        "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 hover:shadow-lg",
    };

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-2 text-sm gap-2",
      md: "px-6 py-3 text-base gap-2",
      lg: "px-8 py-4 text-lg gap-3",
    };

    // Icon size based on button size
    const iconSizeClass = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const classes = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className={`${iconSizeClass[size]} animate-spin`} />
        )}

        {!loading && icon && iconPosition === "left" && (
          <span className={iconSizeClass[size]}>{icon}</span>
        )}

        {children}

        {!loading && icon && iconPosition === "right" && (
          <span className={iconSizeClass[size]}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
