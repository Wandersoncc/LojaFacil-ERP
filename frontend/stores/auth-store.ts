"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  hydrated: boolean;
  setTokens: (tokens: AuthTokens, email?: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

/**
 * Auth store com persistência em localStorage.
 * `hydrated` evita flicker/redirecionamento errado antes do estado ser lido.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      email: null,
      hydrated: false,
      setTokens: (tokens, email) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          ...(email ? { email } : {}),
        }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, email: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "lojafacil-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Leitura do token fora de componentes React (para o interceptor do axios). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
