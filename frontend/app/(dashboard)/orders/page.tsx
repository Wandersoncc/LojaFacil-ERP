"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders, type OrderQuery } from "@/lib/services";
import { formatCents, formatDate } from "@/lib/utils";
import {
  OrderStatusBadge,
  PlatformBadge,
  orderStatusLabels,
  platformLabels,
} from "@/lib/labels";
import type { OrderStatus, Platform } from "@/types";

const ALL = "all";
const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [platform, setPlatform] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const query: OrderQuery = {
    page,
    pageSize: PAGE_SIZE,
    ...(platform !== ALL ? { platform: platform as Platform } : {}),
    ...(status !== ALL ? { status: status as OrderStatus } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["orders", query],
    queryFn: () => getOrders(query),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const resetPageAnd = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const clearFilters = () => {
    setPlatform(ALL);
    setStatus(ALL);
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Lista unificada de todas as suas lojas"
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select
              value={platform}
              onValueChange={(v) => resetPageAnd(() => setPlatform(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {(Object.keys(platformLabels) as Platform[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => resetPageAnd(() => setStatus(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {(Object.keys(orderStatusLabels) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {orderStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from">De</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => resetPageAnd(() => setFrom(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">Até</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => resetPageAnd(() => setTo(e.target.value))}
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {isError && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-destructive"
                  >
                    Erro ao carregar pedidos. Verifique a conexão com a API.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && data && data.data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum pedido encontrado. Conecte uma loja para importar
                    pedidos.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                data?.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.externalId}
                    </TableCell>
                    <TableCell>{order.store?.nickname ?? "-"}</TableCell>
                    <TableCell>
                      {order.store?.platform && (
                        <PlatformBadge platform={order.store.platform} />
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{order.buyerName ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCents(order.totalCents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.placedAt)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} pedido(s)` : ""}
          {isFetching && !isLoading ? " · atualizando…" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
