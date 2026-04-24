import { api } from "./client";
import type { CustomerAddress, Paginated } from "./types";

export interface ListAddressesParams {
  page?: number;
  limit?: number;
  userId?: number;
}

export interface CreateAddressPayload {
  cep: string;
  street: string;
  number: string;
  city: string;
  state: string;
  complement?: string;
  neighborhood?: string;
  label?: string;
  isDefault?: boolean;
}

export const addressesService = {
  list: (params: ListAddressesParams = {}) =>
    api.get<Paginated<CustomerAddress>>("/addresses", { query: params }),

  getById: (id: number) => api.get<CustomerAddress>(`/addresses/${id}`),

  create: (payload: CreateAddressPayload) =>
    api.post<CustomerAddress>("/addresses", payload),

  update: (id: number, payload: Partial<CreateAddressPayload>) =>
    api.patch<CustomerAddress>(`/addresses/${id}`, payload),

  remove: (id: number) => api.delete<CustomerAddress>(`/addresses/${id}`),
};
