"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

/**
 * Protege rotas do dashboard. Aguarda a reidratação do store para evitar
 * redirecionar um usuário logado antes do token ser lido do localStorage.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
