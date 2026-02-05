"use client";

import { type ChangeEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterDropdown?: ReactNode;
  className?: string;
}

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  filterDropdown,
  className,
}: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Search className="size-4 text-surface-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "block w-full rounded-xl border border-surface-200 bg-white pl-10 pr-10 py-2.5 text-sm text-surface-900 placeholder:text-surface-400",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "hover:border-surface-300"
          )}
        />
        {value.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {filterDropdown && <div>{filterDropdown}</div>}
    </div>
  );
}

export { SearchBar };
export type { SearchBarProps };
