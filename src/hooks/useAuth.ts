"use client";

import { useState, useCallback } from "react";
import { User, UserRole } from "@/types";
import { buyers, sellers, admin } from "@/data/mock";

const mockUsers: Record<string, User> = {
  buyer: buyers[0],
  seller: sellers[0],
  admin: admin,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(mockUsers[role]);
      setIsLoading(false);
    }, 500);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
