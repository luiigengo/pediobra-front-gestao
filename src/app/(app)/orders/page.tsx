"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/badges";
import { ordersService, type ListOrdersParams } from "@/lib/api/orders";
import { sellersService } from "@/lib/api/sellers";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import {
  centsToBRL,
  formatDateTime,
  formatOrderCode,
} from "@/lib/formatters";
import type { Order, OrderStatus } from "@/lib/api/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "CANCELLED",
];

export default function OrdersListPage() {
  const { isAdmin, sellerIds } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sellerFilter, setSellerFilter] = useState<string>(
    isAdmin ? "ALL" : sellerIds[0] ? String(sellerIds[0]) : "ALL",
  );
  const [clientUserIdInput, setClientUserIdInput] = useState("");
  const debouncedClientId = useDebouncedValue(clientUserIdInput, 400);

  const sellersQ = useQuery({
    queryKey: queryKeys.sellers.list({ page: 1, limit: 100 }),
    queryFn: () => sellersService.list({ page: 1, limit: 100 }),
    enabled: isAdmin,
  });

  const params: ListOrdersParams = useMemo(() => {
    const base: ListOrdersParams = {
      page,
      limit: 10,
    };
    if (statusFilter !== "ALL") base.status = statusFilter as OrderStatus;
    if (sellerFilter !== "ALL") base.sellerId = Number(sellerFilter);
    const clientId = Number(debouncedClientId);
    if (debouncedClientId && Number.isFinite(clientId) && clientId > 0) {
      base.clientUserId = clientId;
    }
    return base;
  }, [page, statusFilter, sellerFilter, debouncedClientId]);

  const query = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersService.list(params),
  });

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "code",
        header: "Pedido",
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs font-semibold">
              {formatOrderCode(row.original)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(row.original.createdAt)}
            </div>
          </div>
        ),
      },
      {
        id: "client",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.clientUser?.name ??
              `Usuário #${row.original.clientUserId}`}
          </div>
        ),
      },
      {
        id: "seller",
        header: "Loja",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.seller?.name ?? `Loja #${row.original.sellerId}`}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        id: "payment",
        header: "Pagamento",
        cell: ({ row }) =>
          row.original.paymentStatus ? (
            <PaymentStatusBadge status={row.original.paymentStatus} />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "totalAmountCents",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {centsToBRL(row.original.totalAmountCents)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/orders/${row.original.id}`}>
                <Eye className="size-4" />
                Abrir
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
        title="Pedidos"
        description={
          isAdmin
            ? "Todos os pedidos do marketplace."
            : "Pedidos das lojas em que você atua."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setPage(1);
            setStatusFilter(v);
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select
            value={sellerFilter}
            onValueChange={(v) => {
              setPage(1);
              setSellerFilter(v);
            }}
          >
            <SelectTrigger className="sm:w-60">
              <SelectValue placeholder="Todas as lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as lojas</SelectItem>
              {(sellersQ.data?.data ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isAdmin && (
          <Input
            placeholder="ID do cliente"
            className="sm:w-48"
            value={clientUserIdInput}
            onChange={(e) => {
              setPage(1);
              setClientUserIdInput(e.target.value);
            }}
            inputMode="numeric"
          />
        )}
      </div>

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        meta={query.data?.meta}
        page={page}
        onPageChange={setPage}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        emptyMessage="Nenhum pedido encontrado."
      />
    </div>
  );
}
