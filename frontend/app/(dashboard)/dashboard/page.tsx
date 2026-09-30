"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard, getLowStock } from "@/lib/services";
import { formatCents } from "@/lib/utils";
import { orderStatusLabels } from "@/lib/labels";
import type { OrderStatus } from "@/types";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const lowStock = useQuery({
    queryKey: ["low-stock"],
    queryFn: getLowStock,
  });

  const data = dashboard.data;
  const byStatus = data?.ordersByStatus ?? {};
  const statusKeys = Object.keys(orderStatusLabels) as OrderStatus[];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumo das suas vendas e operação"
      />

      {dashboard.isError && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar o resumo. Verifique se o backend está
            rodando.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas hoje"
          value={formatCents(data?.salesTodayCents)}
          icon={DollarSign}
          loading={dashboard.isLoading}
        />
        <StatCard
          title="Vendas 7 dias"
          value={formatCents(data?.sales7dCents)}
          icon={CalendarDays}
          loading={dashboard.isLoading}
        />
        <StatCard
          title="Vendas 30 dias"
          value={formatCents(data?.sales30dCents)}
          icon={TrendingUp}
          loading={dashboard.isLoading}
        />
        <StatCard
          title="Estoque baixo"
          value={String(lowStock.data?.length ?? 0)}
          icon={AlertTriangle}
          loading={lowStock.isLoading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statusKeys.map((status) => (
                  <div
                    key={status}
                    className="rounded-md border p-3 text-center"
                  >
                    <div className="text-xl font-bold">
                      {byStatus[status] ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {orderStatusLabels[status]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : lowStock.data && lowStock.data.length > 0 ? (
              <ul className="divide-y">
                {lowStock.data.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="font-medium text-amber-600">
                      {p.stockAvailable - p.stockReserved} un
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto com estoque baixo. 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
