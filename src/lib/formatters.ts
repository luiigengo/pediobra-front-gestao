import type {
  DriverStatus,
  EvidenceType,
  MembershipRole,
  OrderStatus,
  PaymentStatus,
  RoleName,
} from "@/lib/api/types";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function centsToBRL(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "—";
  return BRL.format(cents / 100);
}

export function centsToDecimalString(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function decimalStringToCents(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  try {
    return dateFormatter.format(new Date(date));
  } catch {
    return "—";
  }
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  try {
    return dateOnlyFormatter.format(new Date(date));
  } catch {
    return "—";
  }
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatCep(cep: string | null | undefined) {
  if (!cep) return "—";
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return cep;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  READY_FOR_PICKUP: "Pronto p/ retirada",
  PICKED_UP: "Coletado",
  OUT_FOR_DELIVERY: "Em rota",
  DELIVERED: "Entregue",
  DELIVERY_FAILED: "Falha na entrega",
  CANCELLED: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado",
  CANCELLED: "Cancelado",
};

export const DRIVER_STATUS_LABEL: Record<DriverStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  BLOCKED: "Bloqueado",
};

export const ROLE_LABEL: Record<RoleName, string> = {
  ADMIN: "Admin",
  CUSTOMER: "Cliente",
  SELLER: "Vendedor",
  DRIVER: "Motorista",
};

export const MEMBERSHIP_ROLE_LABEL: Record<MembershipRole, string> = {
  OWNER: "Proprietário",
  EMPLOYEE: "Funcionário",
};

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  SELLER_CONFIRMATION: "Confirmação do vendedor",
  DRIVER_CONFIRMATION: "Confirmação do motorista",
  DELIVERY_PHOTO: "Foto da entrega",
  PICKUP_PHOTO: "Foto da coleta",
  GENERAL: "Geral",
};

export function formatOrderCode(order: {
  code?: string | null;
  id: number;
}) {
  return order.code ?? `#${String(order.id).padStart(4, "0")}`;
}

export function roleNamesOf(
  roles: Array<{ name: string } | string> | undefined | null,
): RoleName[] {
  if (!roles) return [];
  return roles
    .map((r) => (typeof r === "string" ? r : r.name).toUpperCase())
    .filter((name): name is RoleName =>
      ["ADMIN", "CUSTOMER", "SELLER", "DRIVER"].includes(name),
    );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
