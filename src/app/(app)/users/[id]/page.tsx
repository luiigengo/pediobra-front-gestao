"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Shield, Store } from "lucide-react";
import { usersService } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, roleNamesOf } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge, MembershipRoleBadge } from "@/components/badges";
import { EditRolesDialog } from "./edit-roles-dialog";
import { EditSellersDialog } from "./edit-sellers-dialog";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = Number(id);

  const query = useQuery({
    queryKey: queryKeys.users.byId(userId),
    queryFn: () => usersService.getById(userId),
    enabled: Number.isFinite(userId),
  });

  const user = query.data;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/users">
            <ArrowLeft className="size-4" />
            Voltar para usuários
          </Link>
        </Button>
      </div>

      <PageHeader
        title={user?.name ?? "Carregando…"}
        description={user?.email}
      />

      {query.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Usuário não encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4" />
                  Papéis do sistema
                </CardTitle>
                <CardDescription>
                  Controla o que o usuário pode acessar.
                </CardDescription>
              </div>
              <EditRolesDialog user={user}>
                <Button variant="outline" size="sm">
                  <Edit3 className="size-4" />
                  Editar
                </Button>
              </EditRolesDialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.roles.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {roleNamesOf(user.roles).map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum papel atribuído.
                </p>
              )}
              <dl className="pt-2 text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono">#{user.id}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
                <dt className="text-muted-foreground">Criado em</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-4" />
                  Vínculos com lojas
                </CardTitle>
                <CardDescription>
                  Permissões granulares por loja (OWNER/EMPLOYEE).
                </CardDescription>
              </div>
              <EditSellersDialog user={user}>
                <Button variant="outline" size="sm">
                  <Edit3 className="size-4" />
                  Editar
                </Button>
              </EditSellersDialog>
            </CardHeader>
            <CardContent>
              {user.sellers.length ? (
                <ul className="divide-y divide-border -my-3">
                  {user.sellers.map((s) => (
                    <li
                      key={s.sellerId}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {s.seller.name}
                          </span>
                          <MembershipRoleBadge role={s.membershipRole} />
                        </div>
                        {s.jobTitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {s.jobTitle}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                          {s.canEditSeller && <span>✓ editar loja</span>}
                          {s.canManageSellerProducts && (
                            <span>✓ gerenciar ofertas</span>
                          )}
                          {s.canManageSellerStaff && (
                            <span>✓ gerenciar equipe</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum vínculo com loja.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
