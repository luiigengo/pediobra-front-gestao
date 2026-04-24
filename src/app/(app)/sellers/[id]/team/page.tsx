"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { sellersService } from "@/lib/api/sellers";
import { usersService } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { MembershipRoleBadge } from "@/components/badges";
import type { UserWithRelations } from "@/lib/api/types";

interface TeamMember {
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
  membershipRole: "OWNER" | "EMPLOYEE";
  canEditSeller: boolean;
  canManageSellerProducts: boolean;
  canManageSellerStaff: boolean;
}

export default function SellerTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sellerId = Number(id);
  const { canManageSellerStaff } = useAuth();
  const canEditTeam = canManageSellerStaff(sellerId);

  const sellerQ = useQuery({
    queryKey: queryKeys.sellers.byId(sellerId),
    queryFn: () => sellersService.getById(sellerId),
    enabled: Number.isFinite(sellerId),
  });

  const usersQ = useQuery({
    queryKey: queryKeys.users.list({ page: 1, limit: 100 }),
    queryFn: () => usersService.list({ page: 1, limit: 100 }),
  });

  const members = useMemo<TeamMember[]>(() => {
    const all = (usersQ.data?.data as unknown as UserWithRelations[]) ?? [];
    return all
      .filter((u) => u.sellers?.some((s) => s.sellerId === sellerId))
      .map((u) => {
        const link = u.sellers.find((s) => s.sellerId === sellerId)!;
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          jobTitle: link.jobTitle,
          membershipRole: link.membershipRole as "OWNER" | "EMPLOYEE",
          canEditSeller: link.canEditSeller,
          canManageSellerProducts: link.canManageSellerProducts,
          canManageSellerStaff: link.canManageSellerStaff,
        };
      });
  }, [usersQ.data, sellerId]);

  const columns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: "Cargo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.jobTitle ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "membershipRole",
        header: "Papel",
        cell: ({ row }) => (
          <MembershipRoleBadge role={row.original.membershipRole} />
        ),
      },
      {
        id: "permissions",
        header: "Permissões",
        cell: ({ row }) => {
          const labels: string[] = [];
          if (row.original.canEditSeller) labels.push("editar loja");
          if (row.original.canManageSellerProducts)
            labels.push("ofertas");
          if (row.original.canManageSellerStaff) labels.push("equipe");
          return (
            <span className="text-xs text-muted-foreground">
              {labels.length ? labels.join(", ") : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/users/${row.original.userId}`}>
                <Eye className="size-4" />
                Editar no usuário
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={`/sellers/${sellerId}`}>
            <ArrowLeft className="size-4" />
            Voltar para a loja
          </Link>
        </Button>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Equipe de {sellerQ.data?.name ?? "—"}
          </span>
        }
        description="Usuários vinculados a essa loja e suas permissões granulares."
      />

      {!canEditTeam && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Você pode visualizar, mas apenas o OWNER (ou um ADMIN) pode
            modificar a equipe. As edições acontecem na tela do usuário.
          </CardContent>
        </Card>
      )}

      <DataTable
        data={members}
        columns={columns}
        page={1}
        onPageChange={() => {}}
        isLoading={usersQ.isLoading || sellerQ.isLoading}
        emptyMessage="Nenhum membro vinculado a essa loja."
      />
    </div>
  );
}
