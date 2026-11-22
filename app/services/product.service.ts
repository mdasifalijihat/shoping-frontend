import type { IApiResponse } from "@/app/types/api.types";
import type { IAttribute, IProduct } from "@/app/types/catalog.types";
import api from "@/lib/axios";

export type AttributeInput = Pick<IAttribute, "name" | "values">;
export type ProductInput = Pick<
  IProduct,
  "title" | "description" | "basePrice" | "thumbnail" | "categoryId"
> &
  Partial<
    Pick<
      IProduct,
      | "sku"
      | "discountPrice"
      | "stock"
      | "images"
      | "customAttributes"
      | "variants"
      | "isFeatured"
      | "isActive"
    >
  >;

interface ProductListParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: "createdAt" | "updatedAt" | "title" | "basePrice" | "stock";
  sortOrder?: "asc" | "desc";
}

export interface PublicProductParams extends ProductListParams {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  inStock?: boolean;
}

export interface AdminProductParams extends ProductListParams {
  categoryId?: string;
}

export async function getAttributes() {
  return (await api.get<IApiResponse<IAttribute[]>>("/attributes")).data.data;
}

export async function createAttribute(data: AttributeInput) {
  return (await api.post<IApiResponse<IAttribute>>("/attributes", data)).data
    .data;
}

export async function updateAttribute(
  id: string,
  data: Partial<AttributeInput>,
) {
  return (
    await api.patch<IApiResponse<IAttribute>>(
      `/attributes/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function deleteAttribute(id: string) {
  await api.delete(`/attributes/${encodeURIComponent(id)}`);
}

export async function getPublicProducts(params: PublicProductParams = {}) {
  return (await api.get<IApiResponse<IProduct[]>>("/products", { params }))
    .data;
}

export async function getAdminProducts(params: AdminProductParams = {}) {
  return (
    await api.get<IApiResponse<IProduct[]>>("/products/admin", { params })
  ).data;
}

export async function getProductBySlug(slug: string) {
  return (
    await api.get<IApiResponse<IProduct>>(
      `/products/${encodeURIComponent(slug)}`,
    )
  ).data.data;
}

export async function getAdminProductById(id: string) {
  return (
    await api.get<IApiResponse<IProduct>>(
      `/products/admin/${encodeURIComponent(id)}`,
    )
  ).data.data;
}

export async function createProduct(data: ProductInput) {
  return (await api.post<IApiResponse<IProduct>>("/products", data)).data.data;
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  return (
    await api.patch<IApiResponse<IProduct>>(
      `/products/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function deleteProduct(id: string) {
  return (
    await api.delete<IApiResponse<null>>(`/products/${encodeURIComponent(id)}`)
  ).data;
}
