import { api } from "./client";
import type { MembershipRole, Paginated, Seller, UserWithRelations } from "./types";

export interface ListSellersParams {
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
  cep?: string;
}

export interface CreateSellerPayload {
  name: string;
  email: string;
  address: string;
  cep: string;
  phone: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateSellerUserAccessPayload {
  membershipRole: MembershipRole;
  jobTitle?: string | null;
  canEditSeller: boolean;
  canManageSellerProducts: boolean;
  canManageSellerStaff: boolean;
}

export const sellersService = {
  list: (params: ListSellersParams = {}) =>
    api.get<Paginated<Seller>>("/sellers", { query: params }),

  getById: (id: number) => api.get<Seller>(`/sellers/${id}`),

  create: (payload: CreateSellerPayload) =>
    api.post<Seller>("/sellers", payload),

  update: (id: number, payload: Partial<CreateSellerPayload>) =>
    api.patch<Seller>(`/sellers/${id}`, payload),

  remove: (id: number) => api.delete<Seller>(`/sellers/${id}`),

  updateUserAccess: (
    sellerId: number,
    userId: number,
    payload: UpdateSellerUserAccessPayload,
  ) =>
    api.patch<UserWithRelations>(
      `/sellers/${sellerId}/users/${userId}/access`,
      payload,
    ),
};
