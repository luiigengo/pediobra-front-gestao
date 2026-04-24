import { api } from "./client";
import type { Paginated, Product } from "./types";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  categoryId?: number;
  unit?: string;
}

export interface ProductImageInput {
  url: string;
  position?: number;
  isPrimary?: boolean;
}

export interface ProductBarcodeInput {
  barcode: string;
  barcodeType?: string;
  isPrimary?: boolean;
}

export interface CreateProductPayload {
  categoryId?: number;
  name: string;
  description?: string;
  size?: string;
  weight?: number;
  brand?: string;
  unit?: string;
  images?: ProductImageInput[];
  barcodes?: ProductBarcodeInput[];
}

export const productsService = {
  list: (params: ListProductsParams = {}) =>
    api.get<Paginated<Product>>("/products", { query: params }),

  getById: (id: number) => api.get<Product>(`/products/${id}`),

  create: (payload: CreateProductPayload) =>
    api.post<Product>("/products", payload),

  update: (id: number, payload: Partial<CreateProductPayload>) =>
    api.patch<Product>(`/products/${id}`, payload),

  remove: (id: number) => api.delete<Product>(`/products/${id}`),
};
