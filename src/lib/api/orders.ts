import { api } from "./client";
import type {
  EvidenceType,
  Order,
  OrderStatus,
  Paginated,
} from "./types";

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sellerId?: number;
  clientUserId?: number;
  assignedDriverProfileId?: number;
}

export interface CreateOrderPayload {
  sellerId: number;
  deliveryAddress: string;
  customerAddressId?: number;
  deliveryCep?: string;
  contactPhone?: string;
  notes?: string;
  confirmationCode?: string;
  items: Array<{ sellerProductId: number; quantity: number }>;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  cancellationReason?: string;
  cancellationDetails?: string;
}

export interface AssignDriverPayload {
  driverProfileId: number;
}

export interface CreateOrderEvidencePayload {
  evidenceType: EvidenceType;
  imageUrl: string;
  note?: string;
}

export const ordersService = {
  list: (params: ListOrdersParams = {}) =>
    api.get<Paginated<Order>>("/orders", { query: params }),

  getById: (id: number) => api.get<Order>(`/orders/${id}`),

  create: (payload: CreateOrderPayload) =>
    api.post<Order>("/orders", payload),

  updateStatus: (id: number, payload: UpdateOrderStatusPayload) =>
    api.patch<Order>(`/orders/${id}/status`, payload),

  assignDriver: (id: number, payload: AssignDriverPayload) =>
    api.patch<Order>(`/orders/${id}/assign-driver`, payload),

  addEvidence: (id: number, payload: CreateOrderEvidencePayload) =>
    api.post<Order>(`/orders/${id}/evidences`, payload),
};
