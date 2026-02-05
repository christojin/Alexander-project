import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="inline-flex items-center justify-center rounded-2xl bg-surface-100 p-4 text-surface-400 [&_svg]:size-8 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-surface-500 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
