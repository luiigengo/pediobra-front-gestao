"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardList,
  Package,
  Store,
  Truck,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ordersService } from "@/lib/api/orders";
import { sellersService } from "@/lib/api/sellers";
import { productsService } from "@/lib/api/products";
import { driversService } from "@/lib/api/drivers";
import { queryKeys } from "@/lib/query-keys";
import { centsToBRL, formatDateTime, formatOrderCode } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  OrderStatus,
  Paginated,
  Order,
  DriverProfile,
  Product,
  Seller,
} from "@/lib/api/types";

export default function DashboardPage() {
  const { user, isAdmin, isSeller, sellerIds } = useAuth();

  const sellerId = !isAdmin && isSeller ? sellerIds[0] : undefined;

  const sharedOrderParams = sellerId ? { sellerId } : {};

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.orders.list({
          page: 1,
          limit: 100,
          ...sharedOrderParams,
        }),
        queryFn: () =>
          ordersService.list({
            page: 1,
            limit: 100,
            ...sharedOrderParams,
          }),
      },
      {
        queryKey: queryKeys.orders.list({
          page: 1,
          limit: 5,
          ...sharedOrderParams,
        }),
        queryFn: () =>
          ordersService.list({
            page: 1,
            limit: 5,
            ...sharedOrderParams,
          }),
      },
      {
        queryKey: queryKeys.sellers.list({ page: 1, limit: 1 }),
        queryFn: () => sellersService.list({ page: 1, limit: 1 }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.products.list({ page: 1, limit: 1 }),
        queryFn: () => productsService.list({ page: 1, limit: 1 }),
      },
      {
        queryKey: queryKeys.drivers.list({ page: 1, limit: 1 }),
        queryFn: () => driversService.list({ page: 1, limit: 1 }),
        enabled: isAdmin,
      },
    ],
  });

  const [
    ordersAllQ,
    ordersRecentQ,
    sellersQ,
    productsQ,
    driversQ,
  ] = results as [
    { data?: Paginated<Order>; isLoading: boolean },
    { data?: Paginated<Order>; isLoading: boolean },
    { data?: Paginated<Seller>; isLoading: boolean },
    { data?: Paginated<Product>; isLoading: boolean },
    { data?: Paginated<DriverProfile>; isLoading: boolean },
  ];

  const ordersAll = ordersAllQ.data?.data ?? [];
  const statusCounts = countByStatus(ordersAll);

  const [sevenDaysAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const revenueCents7d = ordersAll
    .filter(
      (o) =>
        o.status === "DELIVERED" &&
        new Date(o.createdAt).getTime() >= sevenDaysAgo,
    )
    .reduce((sum, o) => sum + (o.totalAmountCents ?? 0), 0);

  const cards: Array<{
    label: string;
    icon: typeof ClipboardList;
    value: string | number;
    hint: string;
    loading: boolean;
    href: string;
  }> = [
    {
      label: "Pedidos ativos",
      icon: ClipboardList,
      value:
        (statusCounts.PENDING ?? 0) +
        (statusCounts.CONFIRMED ?? 0) +
        (statusCounts.PREPARING ?? 0) +
        (statusCounts.READY_FOR_PICKUP ?? 0) +
        (statusCounts.PICKED_UP ?? 0) +
        (statusCounts.OUT_FOR_DELIVERY ?? 0),
      hint: `${statusCounts.DELIVERED ?? 0} entregues · ${statusCounts.CANCELLED ?? 0} cancelados`,
      loading: ordersAllQ.isLoading,
      href: "/orders",
    },
    {
      label: "Receita 7 dias",
      icon: DollarSign,
      value: centsToBRL(revenueCents7d),
      hint: "Pedidos entregues nos últimos 7 dias",
      loading: ordersAllQ.isLoading,
      href: "/orders",
    },
    {
      label: "Produtos cadastrados",
      icon: Package,
      value: productsQ.data?.meta.total ?? "—",
      hint: "Catálogo global",
      loading: productsQ.isLoading,
      href: "/products",
    },
    ...(isAdmin
      ? [
          {
            label: "Lojas ativas",
            icon: Store,
            value: sellersQ.data?.meta.total ?? "—",
            hint: "Sellers cadastrados",
            loading: sellersQ.isLoading,
            href: "/sellers",
          },
          {
            label: "Motoristas",
            icon: Truck,
            value: driversQ.data?.meta.total ?? "—",
            hint: "Total aprovados + pendentes",
            loading: driversQ.isLoading,
            href: "/drivers",
          },
        ]
      : []),
  ];

  const recentOrders = ordersRecentQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.name?.split(" ")[0] ?? "visitante"}`}
        description={
          isAdmin
            ? "Visão geral da operação PediObra."
            : "Visão geral dos pedidos e catálogo da sua loja."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardDescription className="text-xs uppercase tracking-wider">
                      {card.label}
                    </CardDescription>
                  </div>
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-[oklch(0.35_0.1_60)]">
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {card.loading ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    <div className="text-3xl font-semibold font-mono tracking-tight">
                      {card.value}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Pedidos recentes</CardTitle>
              <CardDescription>Os últimos 5 pedidos da operação.</CardDescription>
            </div>
            <Link
              href="/orders"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {ordersRecentQ.isLoading ? (
              <div className="px-6 pb-6 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                Nenhum pedido ainda.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50"
                    >
                      <div className="font-mono text-sm font-medium w-24 shrink-0">
                        {formatOrderCode(order)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {order.seller?.name ?? `Loja #${order.sellerId}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="font-mono text-sm font-semibold w-24 text-right">
                        {centsToBRL(order.totalAmountCents)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por status</CardTitle>
            <CardDescription>Pedidos nos últimos 100 registros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {ordersAllQ.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))
            ) : (
              (
                [
                  "PENDING",
                  "CONFIRMED",
                  "PREPARING",
                  "OUT_FOR_DELIVERY",
                  "DELIVERED",
                  "CANCELLED",
                ] as OrderStatus[]
              ).map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between gap-2"
                >
                  <OrderStatusBadge status={status} />
                  <span className="font-mono text-sm font-medium">
                    {statusCounts[status] ?? 0}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function countByStatus(orders: Order[]): Partial<Record<OrderStatus, number>> {
  const out: Partial<Record<OrderStatus, number>> = {};
  for (const o of orders) {
    out[o.status] = (out[o.status] ?? 0) + 1;
  }
  return out;
}
