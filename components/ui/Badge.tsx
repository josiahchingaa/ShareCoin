"use client";

import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "warning" | "info" | "default";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  pulse?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  icon,
  pulse = false,
  className = "",
  ...props
}) => {
  const variantStyles = {
    success: "bg-success-bg text-success border-success/30",
    danger: "bg-danger-bg text-danger border-danger/30",
    warning: "bg-warning-bg text-warning border-warning/30",
    info: "bg-info-bg text-info border-info/30",
    default: "bg-background-elevated text-text-secondary border-border",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  const iconSizeClass = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const classes = `
    inline-flex
    items-center
    justify-center
    font-medium
    rounded-full
    border
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${pulse ? "animate-pulse" : ""}
    ${className}
  `.trim();

  return (
    <span className={classes} {...props}>
      {icon && <span className={iconSizeClass[size]}>{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = "Badge";

export default Badge;
