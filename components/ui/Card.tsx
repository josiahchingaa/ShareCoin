"use client";

import React, { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hover = false,
      interactive = false,
      padding = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const baseClasses = `
      bg-background-card
      border border-border
      rounded-lg
      transition-all
      duration-300
      ${paddingStyles[padding]}
      ${className}
    `.trim();

    const hoverClasses = hover
      ? "hover:border-primary hover:shadow-glow-blue-subtle hover:-translate-y-0.5"
      : "";

    const interactiveClasses = interactive ? "cursor-pointer" : "";

    return (
      <div ref={ref} className={`${baseClasses} ${hoverClasses} ${interactiveClasses}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Sub-components for better composition
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`mb-4 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={`text-xl font-semibold text-text-primary ${className}`.trim()}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-text-secondary mt-1 ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`mt-6 pt-4 border-t border-border ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";

export default Card;
