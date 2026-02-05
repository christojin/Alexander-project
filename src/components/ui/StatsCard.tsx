import { type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
}

function StatsCard({ icon, label, value, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-surface-200 bg-white p-6",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 size-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100/50 opacity-60" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center rounded-lg bg-primary-50 p-2.5 text-primary-600 [&_svg]:size-5">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-surface-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-surface-900 tracking-tight">
              {value}
            </p>
          </div>
        </div>

        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend.direction === "up"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}

export { StatsCard };
export type { StatsCardProps };
