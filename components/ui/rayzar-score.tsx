"use client";

import { cn } from "@/lib/utils";

interface RayzarScoreProps {
  score: number;  // 0-100
  size?: "sm" | "md" | "lg";
  className?: string;
}

function scoreColour(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 45) return "text-gray-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

const sizeClasses = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-bold",
};

export function RayzarScore({ score, size = "md", className }: RayzarScoreProps) {
  return (
    <span className={cn(sizeClasses[size], scoreColour(score), className)}>
      {score}
    </span>
  );
}
