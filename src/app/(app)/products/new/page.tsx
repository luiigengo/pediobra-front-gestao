"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { productsService, type CreateProductPayload } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional().or(z.literal("")),
  brand: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  images: z
    .array(
      z.object({
        url: z.string().url("URL inválida"),
        isPrimary: z.boolean().optional(),
      }),
    )
    .default([]),
  barcodes: z
    .array(
      z.object({
        barcode: z.string().min(1, "Código obrigatório"),
        barcodeType: z.string().optional().or(z.literal("")),
      }),
    )
    .default([]),
});

type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      unit: "",
      size: "",
      weight: "",
      categoryId: "",
      images: [],
      barcodes: [],
    },
  });

  const imagesFA = useFieldArray({ control: form.control, name: "images" });
  const barcodesFA = useFieldArray({
    control: form.control,
    name: "barcodes",
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateProductPayload = {
        name: values.name,
        description: values.description || undefined,
        brand: values.brand || undefined,
        unit: values.unit || undefined,
        size: values.size || undefined,
        weight: values.weight ? Number(values.weight) : undefined,
        categoryId: values.categoryId ? Number(values.categoryId) : undefined,
        images: values.images.map((img, i) => ({
          url: img.url,
          isPrimary: !!img.isPrimary,
          position: i,
        })),
        barcodes: values.barcodes.map((b) => ({
          barcode: b.barcode,
          barcodeType: b.barcodeType || undefined,
        })),
      };
      return productsService.create(payload);
    },
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
      toast.success(`Produto "${product.name}" criado`);
      router.push(`/products/${product.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : "Não foi possível criar o produto";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/products">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Novo produto"
        description="Cadastre um produto no catálogo global."
      />

      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="grid gap-6 lg:grid-cols-3"
        noValidate
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={3}
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" {...form.register("brand")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                placeholder="UN, KG, SC, M²…"
                {...form.register("unit")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho / dimensão</Label>
              <Input id="size" {...form.register("size")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (g)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                {...form.register("weight")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">ID da categoria (opcional)</Label>
              <Input
                id="categoryId"
                type="number"
                min={1}
                placeholder="Ex: 1"
                {...form.register("categoryId")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Imagens</CardTitle>
                <CardDescription>URLs do produto.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  imagesFA.append({
                    url: "",
                    isPrimary: imagesFA.fields.length === 0,
                  })
                }
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {imagesFA.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma imagem.
                </p>
              )}
              {imagesFA.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-md border border-border p-2 space-y-2"
                >
                  <Input
                    placeholder="https://…"
                    {...form.register(`images.${index}.url` as const)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={!!form.watch(`images.${index}.isPrimary`)}
                        onCheckedChange={(v) =>
                          form.setValue(
                            `images.${index}.isPrimary`,
                            v === true,
                          )
                        }
                      />
                      Imagem principal
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => imagesFA.remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Códigos de barras</CardTitle>
                <CardDescription>EAN, UPC, etc.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => barcodesFA.append({ barcode: "" })}
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {barcodesFA.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum código.
                </p>
              )}
              {barcodesFA.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Código"
                    className="font-mono"
                    {...form.register(`barcodes.${index}.barcode` as const)}
                  />
                  <Input
                    placeholder="Tipo"
                    className="w-24"
                    {...form.register(
                      `barcodes.${index}.barcodeType` as const,
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => barcodesFA.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" asChild>
            <Link href="/products">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Criar produto
          </Button>
        </div>
      </form>
    </div>
  );
}
