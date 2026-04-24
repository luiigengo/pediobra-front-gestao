"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { sellersService, type ListSellersParams } from "@/lib/api/sellers";
import { queryKeys } from "@/lib/query-keys";
import { formatCep, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Seller } from "@/lib/api/types";

export default function SellersListPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const params: ListSellersParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );

  const query = useQuery({
    queryKey: queryKeys.sellers.list(params),
    queryFn: () => sellersService.list(params),
  });

  const columns = useMemo<ColumnDef<Seller>[]>(
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
        header: "Loja",
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
        accessorKey: "address",
        header: "Endereço",
        cell: ({ row }) => (
          <div className="text-sm max-w-md truncate">
            {row.original.address}
          </div>
        ),
      },
      {
        accessorKey: "cep",
        header: "CEP",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatCep(row.original.cep)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => (
          <span className="text-sm">{formatPhone(row.original.phone)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/sellers/${row.original.id}`}>
                <Eye className="size-4" />
                Detalhes
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
        title="Lojas"
        description="Todas as lojas parceiras PediObra."
        actions={
          isAdmin && (
            <Button asChild>
              <Link href="/sellers/new">
                <Plus className="size-4" />
                Nova loja
              </Link>
            </Button>
          )
        }
      />

      <div className="flex items-center gap-3">
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
