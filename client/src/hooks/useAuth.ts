// Auth hook - Local authentication with email/password
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: Infinity, // Prevent refetching during navigation
  });

  const isAdmin = user?.role === "admin" || user?.role === "employe";
  const isClient = user?.role === "client";
  const isClientPro = user?.role === "client_professionnel";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isClient,
    isClientPro,
    isEmployee: user?.role === "employe",
  };
}
