"use client";

import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blue";
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = "default",
  width,
  height,
  rounded = "md",
  className = "",
  style,
  ...props
}) => {
  const variantClasses = {
    default: "skeleton",
    blue: "skeleton-blue",
  };

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const inlineStyles = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
    ...style,
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${roundedClasses[rounded]}
        ${className}
      `.trim()}
      style={inlineStyles}
      {...props}
    />
  );
};

// Preset skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? "80%" : "100%"}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`bg-background-card border border-border rounded-lg p-6 ${className}`}>
      <Skeleton width={120} height={24} className="mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = "",
}) => {
  return <Skeleton width={size} height={size} rounded="full" className={className} />;
};

export const SkeletonButton: React.FC<{ width?: number; className?: string }> = ({
  width = 120,
  className = "",
}) => {
  return <Skeleton width={width} height={40} rounded="md" className={className} />;
};

Skeleton.displayName = "Skeleton";

export default Skeleton;
