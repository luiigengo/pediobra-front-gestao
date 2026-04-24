"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { sellersService } from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { formatCep, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/hooks/use-auth";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sellerId = Number(id);
  const qc = useQueryClient();
  const { canEditSeller, canManageSellerStaff } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sellers.byId(sellerId),
    queryFn: () => sellersService.getById(sellerId),
    enabled: Number.isFinite(sellerId),
  });

  const seller = query.data;
  const canEdit = canEditSeller(sellerId);
  const canEditTeam = canManageSellerStaff(sellerId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (seller) {
      setName(seller.name);
      setEmail(seller.email);
      setAddress(seller.address);
      setCep(seller.cep);
      setPhone(seller.phone);
    }
  }, [seller?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: () =>
      sellersService.update(sellerId, { name, email, address, cep, phone }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.sellers.byId(sellerId), updated);
      qc.invalidateQueries({ queryKey: queryKeys.sellers.all() });
      toast.success("Loja atualizada");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : "Não foi possível salvar";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/sellers">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <PageHeader
        title={seller?.name ?? "Carregando…"}
        description={seller?.email}
        actions={
          seller && canEditTeam && (
            <Button asChild variant="outline">
              <Link href={`/sellers/${sellerId}/team`}>
                <Users className="size-4" />
                Gerenciar equipe
              </Link>
            </Button>
          )
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !seller ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loja não encontrada.
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados operacionais</CardTitle>
            <CardDescription>
              {canEdit
                ? "Atualize informações cadastrais."
                : "Você não tem permissão para editar esta loja."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                disabled={!canEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                disabled={!canEdit}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formatPhone(seller.phone)}
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                disabled={!canEdit}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                disabled={!canEdit}
                value={cep}
                onChange={(e) => setCep(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formatCep(seller.cep)}
              </p>
            </div>

            {canEdit && (
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
