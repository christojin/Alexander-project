"use client";

import { createContext, useContext, ReactNode } from "react";
import { User, Product, CartItem, UserRole } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalItems: number;
  cartTotalAmount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const cart = useCart();

  return (
    <AppContext.Provider
      value={{
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        login: auth.login,
        logout: auth.logout,
        cartItems: cart.items,
        addToCart: cart.addItem,
        removeFromCart: cart.removeItem,
        updateCartQuantity: cart.updateQuantity,
        clearCart: cart.clearCart,
        cartTotalItems: cart.totalItems,
        cartTotalAmount: cart.totalAmount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
