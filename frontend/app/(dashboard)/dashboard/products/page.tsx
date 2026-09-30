"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts } from "@/lib/services";
import { formatCents } from "@/lib/utils";
import type { Product } from "@/types";
import { CreateProductDialog } from "./create-product-dialog";
import { AdjustStockDialog } from "./adjust-stock-dialog";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", debounced],
    queryFn: () => getProducts(debounced || undefined),
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebounced(search.trim());
  };

  const openAdjust = (product: Product) => {
    setSelected(product);
    setAdjustOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Cadastro de SKUs e controle de estoque"
        action={<CreateProductDialog />}
      />

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU ou título"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Anúncios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
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
                    Erro ao carregar produtos. Verifique a conexão com a API.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && data && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum produto cadastrado ainda. Clique em “Novo produto”.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                data?.map((p) => {
                  const effective = p.stockAvailable - p.stockReserved;
                  const low =
                    p.lowStockThreshold > 0 && effective <= p.lowStockThreshold;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">
                        <span className={low ? "font-semibold text-amber-600" : ""}>
                          {effective}
                          {low && " ⚠"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {p.stockReserved}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(p.costCents)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {p.listings?.length ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjust(p)}
                        >
                          <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                          Estoque
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdjustStockDialog
        product={selected}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
      />
    </div>
  );
}
