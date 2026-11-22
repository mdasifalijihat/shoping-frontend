import type { IApiResponse } from "@/app/types/api.types";
import type { INavbarItem } from "@/app/types/navbar.types";
import api from "@/lib/axios";

export type NavbarInput = Pick<INavbarItem, "title"> &
  Partial<
    Pick<
      INavbarItem,
      "url" | "icon" | "parentId" | "openInNew" | "isActive" | "orderIndex"
    >
  >;
type NavbarOrder = Pick<INavbarItem, "id" | "orderIndex"> & {
  parentId?: string | null;
};

export async function getPublicNavbar() {
  return (await api.get<IApiResponse<INavbarItem[]>>("/navbar")).data.data;
}

export async function getAdminNavbar() {
  return (await api.get<IApiResponse<INavbarItem[]>>("/navbar/admin")).data
    .data;
}

export async function createNavbarItem(data: NavbarInput) {
  return (await api.post<IApiResponse<INavbarItem>>("/navbar", data)).data.data;
}

export async function updateNavbarItem(id: string, data: Partial<NavbarInput>) {
  return (
    await api.patch<IApiResponse<INavbarItem>>(
      `/navbar/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function reorderNavbarItems(items: NavbarOrder[]) {
  return (
    await api.patch<IApiResponse<INavbarItem[]>>("/navbar/reorder", { items })
  ).data.data;
}

export async function deleteNavbarItem(id: string) {
  await api.delete(`/navbar/${encodeURIComponent(id)}`);
}
