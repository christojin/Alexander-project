"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

/**
 * Generic status badge component.
 * Pass colorMap for Tailwind classes and labelMap for display labels.
 */
export function StatusBadge({
  status,
  colorMap,
  labelMap,
  size = "sm",
  icon,
}: StatusBadgeProps) {
  const key = status.toLowerCase();
  const colorClass = colorMap[key] || "bg-slate-100 text-slate-700";
  const label = labelMap[key] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorClass
      )}
    >
      {icon}
      {label}
    </span>
  );
}
