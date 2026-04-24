"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RoleBadge } from "@/components/badges";
import { usersService, type ListUsersParams } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/formatters";
import type { RoleName, User } from "@/lib/api/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const ROLE_OPTIONS: Array<{ value: RoleName | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos os papéis" },
  { value: "ADMIN", label: "Admin" },
  { value: "SELLER", label: "Vendedor" },
  { value: "DRIVER", label: "Motorista" },
  { value: "CUSTOMER", label: "Cliente" },
];

export default function UsersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleName | "ALL">("ALL");

  const debouncedSearch = useDebouncedValue(search, 300);

  const params: ListUsersParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      role: role === "ALL" ? undefined : role,
    }),
    [page, debouncedSearch, role],
  );

  const query = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.list(params),
  });

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
        size: 60,
      },
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/users/${row.original.id}`}>
                <Eye className="size-4" />
                Ver
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
      <PageHeader
        title="Usuários"
        description="Gerencie papéis e vínculos com lojas."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={role}
          onValueChange={(v) => {
            setPage(1);
            setRole(v as RoleName | "ALL");
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        meta={query.data?.meta}
        page={page}
        onPageChange={setPage}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
      />
    </div>
  );
}
