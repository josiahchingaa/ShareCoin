"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color?: "green" | "red";
  width?: number;
  height?: number;
}

/**
 * Mini line chart for displaying price trends in tables
 * Used in watchlist to show 7-day price movement
 */
export default function Sparkline({
  data,
  color = "green",
  width = 80,
  height = 30,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  const strokeColor = color === "green" ? "#00FF87" : "#FF4444";

  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
