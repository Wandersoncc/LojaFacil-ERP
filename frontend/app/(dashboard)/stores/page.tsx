"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Store as StoreIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStores,
  getAvailablePlatforms,
  connectStore,
} from "@/lib/services";
import { getErrorMessage } from "@/lib/api";
import { PlatformBadge, SyncStatusBadge, platformLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import type { Platform } from "@/types";

export default function StoresPage() {
  const stores = useQuery({ queryKey: ["stores"], queryFn: getStores });
  const platforms = useQuery({
    queryKey: ["available-platforms"],
    queryFn: getAvailablePlatforms,
  });

  const connect = useMutation({
    mutationFn: (platform: Platform) => connectStore(platform),
    onSuccess: (res) => {
      toast.success("Redirecionando para autorização…");
      // Abre o fluxo OAuth da plataforma
      window.location.href = res.authUrl;
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const available = platforms.data?.platforms ?? [];

  return (
    <div>
      <PageHeader
        title="Lojas"
        description="Conecte e gerencie suas lojas de marketplace"
      />

      {/* Lojas conectadas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lojas conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          {stores.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stores.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              Erro ao carregar lojas. Verifique a conexão com a API.
            </p>
          ) : stores.data && stores.data.length > 0 ? (
            <ul className="divide-y">
              {stores.data.map((store) => (
                <li
                  key={store.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <StoreIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{store.nickname}</p>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={store.platform} />
                        <span className="text-xs text-muted-foreground">
                          Últ. sync: {formatDate(store.lastSyncedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <SyncStatusBadge status={store.syncStatus} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Você ainda não conectou nenhuma loja. Conecte uma abaixo para
              começar a sincronizar pedidos e estoque.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conectar nova loja */}
      <Card>
        <CardHeader>
          <CardTitle>Conectar nova loja</CardTitle>
        </CardHeader>
        <CardContent>
          {platforms.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(platformLabels) as Platform[]).map((p) => {
                const enabled = available.includes(p);
                return (
                  <button
                    key={p}
                    disabled={!enabled || connect.isPending}
                    onClick={() => connect.mutate(p)}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <PlatformBadge platform={p} />
                    <span className="text-xs text-muted-foreground">
                      {enabled ? (
                        <span className="flex items-center gap-1 text-primary">
                          {connect.isPending &&
                          connect.variables === p ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Conectar
                        </span>
                      ) : (
                        "Em breve"
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
