"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { PaymentStatusBadge } from "@/components/badges";
import { paymentsService, type ListPaymentsParams } from "@/lib/api/payments";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/client";
import {
  centsToBRL,
  formatDateTime,
  PAYMENT_STATUS_LABEL,
} from "@/lib/formatters";
import type { Payment, PaymentStatus } from "@/lib/api/types";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

export default function PaymentsListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("ALL");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>("PAID");

  const params: ListPaymentsParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: status === "ALL" ? undefined : (status as PaymentStatus),
    }),
    [page, status],
  );

  const query = useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentsService.list(params),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Sem pagamento selecionado");
      return paymentsService.updateStatus(editing.id, newStatus);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments.all() });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
      toast.success("Status do pagamento atualizado");
      setEditing(null);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.displayMessage
          : err instanceof Error
            ? err.message
            : "Não foi possível atualizar";
      toast.error(msg);
    },
  });

  const columns = useMemo<ColumnDef<Payment>[]>(
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
        id: "order",
        header: "Pedido",
        cell: ({ row }) => (
          <Link
            href={`/orders/${row.original.orderId}`}
            className="font-mono text-xs font-medium hover:underline"
          >
            #{row.original.orderId}
          </Link>
        ),
      },
      {
        id: "provider",
        header: "Provedor / método",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.provider ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.method ?? "—"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "amountCents",
        header: "Valor",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {centsToBRL(row.original.amountCents)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Criado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(row.original);
                setNewStatus(row.original.status);
              }}
            >
              <Pencil className="size-4" />
              Status
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/orders/${row.original.orderId}`}>
                <Eye className="size-4" />
                Pedido
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
        title="Pagamentos"
        description="Lista global de pagamentos do marketplace (ainda em modo mock)."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_LABEL[s]}
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
        emptyMessage="Nenhum pagamento encontrado."
      />

      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar status do pagamento</DialogTitle>
            <DialogDescription>
              Pagamento #{editing?.id} do pedido #{editing?.orderId}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Novo status</Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as PaymentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PAYMENT_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
