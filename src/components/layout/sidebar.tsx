"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardHat,
  LayoutDashboard,
  Users,
  Store,
  Package,
  PackageCheck,
  Truck,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  show: (ctx: { isAdmin: boolean; isSeller: boolean }) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    show: () => true,
  },
  {
    label: "Pedidos",
    href: "/orders",
    icon: ClipboardList,
    show: ({ isAdmin, isSeller }) => isAdmin || isSeller,
  },
  {
    label: "Produtos",
    href: "/products",
    icon: Package,
    show: () => true,
  },
  {
    label: "Ofertas da loja",
    href: "/seller-products",
    icon: PackageCheck,
    show: ({ isAdmin, isSeller }) => isAdmin || isSeller,
  },
  {
    label: "Lojas",
    href: "/sellers",
    icon: Store,
    show: ({ isAdmin, isSeller }) => isAdmin || isSeller,
  },
  {
    label: "Motoristas",
    href: "/drivers",
    icon: Truck,
    show: ({ isAdmin }) => isAdmin,
  },
  {
    label: "Usuários",
    href: "/users",
    icon: Users,
    show: ({ isAdmin }) => isAdmin,
  },
  {
    label: "Pagamentos",
    href: "/payments",
    icon: Receipt,
    show: ({ isAdmin }) => isAdmin,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isSeller } = useAuth();

  const items = NAV_ITEMS.filter((item) => item.show({ isAdmin, isSeller }));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="size-8 rounded-md bg-primary flex items-center justify-center">
          <HardHat className="size-5 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">PediObra</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 text-[11px] text-sidebar-foreground/50 border-t border-sidebar-border">
        PediObra v1 · painel interno
      </div>
    </aside>
  );
}
