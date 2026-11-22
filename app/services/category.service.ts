import type { IApiResponse } from "@/app/types/api.types";
import type { ICategory } from "@/app/types/catalog.types";
import api from "@/lib/axios";

export type CategoryInput = Pick<ICategory, "name"> &
  Partial<
    Pick<
      ICategory,
      | "slug"
      | "parentId"
      | "description"
      | "iconUrl"
      | "bannerUrl"
      | "isFeatured"
      | "isActive"
      | "orderIndex"
    >
  >;
type CategoryPosition = Pick<ICategory, "id" | "orderIndex"> & {
  parentId?: string | null;
};

export async function getPublicCategories(featured?: boolean) {
  return (
    await api.get<IApiResponse<ICategory[]>>("/categories", {
      params: { featured },
    })
  ).data.data;
}

export async function getAdminCategories() {
  return (await api.get<IApiResponse<ICategory[]>>("/categories/admin")).data
    .data;
}

export async function getCategoryBySlug(slug: string) {
  return (
    await api.get<IApiResponse<ICategory>>(
      `/categories/${encodeURIComponent(slug)}`,
    )
  ).data.data;
}

export async function createCategory(data: CategoryInput) {
  return (await api.post<IApiResponse<ICategory>>("/categories", data)).data
    .data;
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  return (
    await api.patch<IApiResponse<ICategory>>(
      `/categories/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function reorderCategories(items: CategoryPosition[]) {
  return (
    await api.patch<IApiResponse<ICategory[]>>("/categories/reorder", { items })
  ).data.data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${encodeURIComponent(id)}`);
}
