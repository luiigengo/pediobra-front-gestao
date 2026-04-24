"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { sellersService, type CreateSellerPayload } from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
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
import { useAuth } from "@/hooks/use-auth";
import { ImageFilePreview } from "@/components/forms/image-file-preview";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("Email inválido"),
  address: z.string().min(3, "Informe o endereço"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos"),
  phone: z.string().min(8, "Informe o telefone"),
  primaryColor: z.string().optional().or(z.literal("")),
  secondaryColor: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function NewSellerPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [logoFile, setLogoFile] = useState<File | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      cep: "",
      phone: "",
      primaryColor: "",
      secondaryColor: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateSellerPayload = {
        name: values.name,
        email: values.email,
        address: values.address,
        cep: values.cep.replace(/\D/g, ""),
        phone: values.phone.replace(/\D/g, ""),
        logo: logoFile,
        primaryColor: values.primaryColor || undefined,
        secondaryColor: values.secondaryColor || undefined,
      };
      return sellersService.create(payload);
    },
    onSuccess: (seller) => {
      qc.invalidateQueries({ queryKey: queryKeys.sellers.all() });
      toast.success(`Loja "${seller.name}" criada`);
      router.push(`/sellers/${seller.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : "Não foi possível criar a loja";
      toast.error(msg);
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Apenas administradores podem criar lojas.
        </CardContent>
      </Card>
    );
  }

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
        title="Nova loja"
        description="Cadastre uma nova loja parceira."
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da loja</CardTitle>
          <CardDescription>
            Preencha os dados operacionais da loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email de contato</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 98765-4321"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro, cidade/UF"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                {...form.register("cep")}
              />
              {form.formState.errors.cep && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cep.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logo">Logo (opcional)</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ImageFilePreview
                  file={logoFile}
                  alt={
                    logoFile
                      ? `Prévia da logo ${logoFile.name}`
                      : "Prévia da logo"
                  }
                  className="size-16 shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setLogoFile(event.target.files?.[0] ?? undefined)
                    }
                  />
                  {logoFile && (
                    <p className="text-xs text-muted-foreground">
                      {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor primária (opcional)</Label>
              <Input
                id="primaryColor"
                placeholder="#F59E0B"
                {...form.register("primaryColor")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">
                Cor secundária (opcional)
              </Label>
              <Input
                id="secondaryColor"
                placeholder="#27272A"
                {...form.register("secondaryColor")}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" asChild>
                <Link href="/sellers">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Criar loja
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
