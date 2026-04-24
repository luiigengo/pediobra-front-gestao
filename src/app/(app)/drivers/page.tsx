"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { DriverStatusBadge } from "@/components/badges";
import { driversService, type ListDriversParams } from "@/lib/api/drivers";
import { queryKeys } from "@/lib/query-keys";
import { formatPhone } from "@/lib/formatters";
import type { DriverProfile, DriverStatus } from "@/lib/api/types";

const STATUS_OPTIONS: Array<{
  value: DriverStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Todos os status" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
  { value: "BLOCKED", label: "Bloqueados" },
];

export default function DriversListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DriverStatus | "ALL">("ALL");

  const params: ListDriversParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: status === "ALL" ? undefined : status,
    }),
    [page, status],
  );

  const query = useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => driversService.list(params),
  });

  const columns = useMemo<ColumnDef<DriverProfile>[]>(
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
        id: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.user?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.user?.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.cpf}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => (
          <span className="text-sm">{formatPhone(row.original.phone)}</span>
        ),
      },
      {
        id: "vehicles",
        header: "Veículos",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.vehicles?.length ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <DriverStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/drivers/${row.original.id}`}>
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
        title="Motoristas"
        description="Aprove ou bloqueie motoboys cadastrados."
      />

      <div className="flex items-center gap-3">
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v as DriverStatus | "ALL");
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
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
