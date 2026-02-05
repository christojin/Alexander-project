"use client";

import Link from "next/link";
import {
  Tv,
  Gamepad2,
  Smartphone,
  ShoppingBag,
  Monitor,
  Share2,
} from "lucide-react";
import { Category } from "@/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Tv,
  Gamepad2,
  Smartphone,
  ShoppingBag,
  Monitor,
  Share2,
};

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Monitor;

  return (
    <Link href={`/products?category=${category.slug}`}>
      <div className="group relative bg-white rounded-2xl border border-surface-200 p-6 text-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1 hover:border-primary-200">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-primary-100 group-hover:scale-110">
          <Icon className="w-7 h-7 text-primary-600" />
        </div>
        <h3 className="font-semibold text-surface-900 mb-1 group-hover:text-primary-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-surface-500">
          {category.productCount} productos
        </p>
      </div>
    </Link>
  );
}
