import axios, { AxiosError } from "axios";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";
import type { ApiError } from "@/types";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** Anexa o Bearer token em toda requisição. */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Em 401, desloga (token inválido/expirado). O redirect é tratado pelo AuthGuard. */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Evita loop de logout na própria tela de login
      const url = error.config?.url ?? "";
      if (!url.includes("/auth/")) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

/** Extrai uma mensagem legível de qualquer erro do axios. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Não foi possível conectar à API. Verifique se o backend está rodando em " + baseURL;
    }
    return error.message;
  }
  return "Ocorreu um erro inesperado.";
}

export type { ApiError };
