"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { sellerProductsService } from "@/lib/api/seller-products";
import { productsService } from "@/lib/api/products";
import { sellersService } from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/forms/money-input";

export default function NewSellerProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin, sellerIds, canManageSellerProducts } = useAuth();

  const [sellerId, setSellerId] = useState<string>(
    sellerIds[0] ? String(sellerIds[0]) : "",
  );
  const [productId, setProductId] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");
  const [priceCents, setPriceCents] = useState(0);
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState("");

  const debouncedSearch = useDebouncedValue(productSearch, 300);

  const sellersQ = useQuery({
    queryKey: queryKeys.sellers.list({ page: 1, limit: 100 }),
    queryFn: () => sellersService.list({ page: 1, limit: 100 }),
    enabled: isAdmin,
  });

  const productsQ = useQuery({
    queryKey: queryKeys.products.list({
      page: 1,
      limit: 20,
      search: debouncedSearch || undefined,
    }),
    queryFn: () =>
      productsService.list({
        page: 1,
        limit: 20,
        search: debouncedSearch || undefined,
      }),
  });

  const availableSellers = useMemo(() => {
    if (isAdmin) return sellersQ.data?.data ?? [];
    return (sellersQ.data?.data ?? []).filter((s) =>
      sellerIds.includes(s.id),
    );
  }, [isAdmin, sellersQ.data, sellerIds]);

  const canCreateForSelected = sellerId
    ? isAdmin || canManageSellerProducts(Number(sellerId))
    : false;

  const mutation = useMutation({
    mutationFn: () => {
      if (!sellerId || !productId) throw new Error("Selecione loja e produto");
      return sellerProductsService.create({
        sellerId: Number(sellerId),
        productId: Number(productId),
        unitPriceCents: priceCents,
        stockAmount: stock,
        sku: sku || undefined,
      });
    },
    onSuccess: (sp) => {
      qc.invalidateQueries({ queryKey: queryKeys.sellerProducts.all() });
      toast.success("Oferta criada");
      router.push(`/seller-products/${sp.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : "Não foi possível criar a oferta";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/seller-products">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Nova oferta"
        description="Publique um produto na sua loja com preço e estoque."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da oferta</CardTitle>
          <CardDescription>
            Preço em R$ (armazenado internamente em centavos).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Loja</Label>
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {availableSellers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canCreateForSelected && sellerId && (
              <p className="text-xs text-destructive">
                Você não tem permissão de gerenciar ofertas nessa loja.
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Produto</Label>
            <Input
              placeholder="Buscar produto…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {(productsQ.data?.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} {p.brand ? `· ${p.brand}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço unitário</Label>
            <MoneyInput
              valueCents={priceCents}
              onChangeCents={setPriceCents}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Estoque</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sku">SKU (opcional)</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Código interno"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="ghost" asChild>
              <Link href="/seller-products">Cancelar</Link>
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !sellerId ||
                !productId ||
                !canCreateForSelected
              }
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Criar oferta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
