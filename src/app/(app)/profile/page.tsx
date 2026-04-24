"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { usersService } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge, MembershipRoleBadge } from "@/components/badges";

const profileSchema = z.object({
  name: z.string().min(2, "Informe ao menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name, email: user.email });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      if (!user) throw new Error("Sem usuário");
      return usersService.update(user.id, values);
    },
    onSuccess: (updated) => {
      if (user) {
        setUser({
          ...user,
          name: updated.name,
          email: updated.email,
        });
      }
      toast.success("Perfil atualizado");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : "Não foi possível salvar o perfil";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Atualize seus dados de acesso."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>
              Alterações afetam apenas sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="space-y-4 max-w-md"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acessos</CardTitle>
            <CardDescription>
              Papéis e lojas vinculadas à sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Papéis
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user?.roles.length ? (
                  user.roles.map((r) => <RoleBadge key={r} role={r} />)
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Lojas
              </p>
              <div className="space-y-2">
                {user?.sellers.length ? (
                  user.sellers.map((s) => (
                    <div
                      key={s.sellerId}
                      className="flex items-center justify-between rounded-md border border-border p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.seller.name}
                        </div>
                        {s.jobTitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {s.jobTitle}
                          </div>
                        )}
                      </div>
                      <MembershipRoleBadge role={s.membershipRole} />
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma loja vinculada
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
