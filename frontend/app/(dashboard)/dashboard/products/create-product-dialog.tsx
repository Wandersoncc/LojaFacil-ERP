"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProduct } from "@/lib/services";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
  sku: z.string().min(1, "Informe o SKU"),
  title: z.string().min(1, "Informe o título"),
  costReais: z.coerce.number().min(0, "Custo inválido").optional(),
  stockAvailable: z.coerce.number().int().min(0, "Estoque inválido").optional(),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, "Limite inválido")
    .optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createProduct({
        sku: values.sku,
        title: values.title,
        costCents: Math.round((values.costReais ?? 0) * 100),
        stockAvailable: values.stockAvailable ?? 0,
        lowStockThreshold: values.lowStockThreshold ?? 0,
      }),
    onSuccess: () => {
      toast.success("Produto criado!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      reset();
      setOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Cadastre um SKU. O estoque é a fonte única para todas as lojas.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="CAM-PT-P" {...register("sku")} />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAvailable">Estoque inicial</Label>
              <Input
                id="stockAvailable"
                type="number"
                placeholder="0"
                {...register("stockAvailable")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Camiseta Preta P"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costReais">Custo (R$)</Label>
              <Input
                id="costReais"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("costReais")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Alerta estoque baixo</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                placeholder="0"
                {...register("lowStockThreshold")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
