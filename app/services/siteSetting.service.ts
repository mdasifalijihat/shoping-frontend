import type {
  IApiResponse,
  JsonObject,
  JsonValue,
} from "@/app/types/api.types";
import type {
  ICustomPage,
  IHomepageSection,
  ISiteSettings,
} from "@/app/types/navbar.types";
import api from "@/lib/axios";

type HomepageInput = Pick<IHomepageSection, "title" | "type"> &
  Partial<
    Pick<IHomepageSection, "subtitle" | "config" | "isActive" | "orderIndex">
  >;
type HomepageOrder = Pick<IHomepageSection, "id" | "orderIndex">;
type PageInput = Pick<ICustomPage, "title" | "content"> &
  Partial<Pick<ICustomPage, "slug" | "isActive">>;
type PublicPage = Pick<ICustomPage, "id" | "title" | "slug">;

export async function getAllSiteSettings() {
  return (await api.get<IApiResponse<JsonObject>>("/site-settings")).data.data;
}

export async function upsertSiteSetting(key: string, value: JsonValue) {
  return (
    await api.put<IApiResponse<Pick<ISiteSettings, "key" | "value">>>(
      `/site-settings/${encodeURIComponent(key)}`,
      { value },
    )
  ).data.data;
}

export async function getAdminHomepageSections() {
  return (
    await api.get<IApiResponse<IHomepageSection[]>>("/homepage-sections/admin")
  ).data.data;
}

export async function createHomepageSection(data: HomepageInput) {
  return (
    await api.post<IApiResponse<IHomepageSection>>("/homepage-sections", data)
  ).data.data;
}

export async function updateHomepageSection(
  id: string,
  data: Partial<HomepageInput>,
) {
  return (
    await api.patch<IApiResponse<IHomepageSection>>(
      `/homepage-sections/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function reorderHomepageSections(items: HomepageOrder[]) {
  return (
    await api.patch<IApiResponse<IHomepageSection[]>>(
      "/homepage-sections/reorder",
      { items },
    )
  ).data.data;
}

export async function deleteHomepageSection(id: string) {
  await api.delete(`/homepage-sections/${encodeURIComponent(id)}`);
}

export async function getPublicPageLinks() {
  return (await api.get<IApiResponse<PublicPage[]>>("/pages")).data.data;
}

export async function getAllCustomPages() {
  return (await api.get<IApiResponse<ICustomPage[]>>("/pages/admin/list")).data
    .data;
}

export async function createCustomPage(data: PageInput) {
  return (await api.post<IApiResponse<ICustomPage>>("/pages", data)).data.data;
}

export async function updateCustomPage(id: string, data: Partial<PageInput>) {
  return (
    await api.patch<IApiResponse<ICustomPage>>(
      `/pages/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}

export async function deleteCustomPage(id: string) {
  await api.delete(`/pages/${encodeURIComponent(id)}`);
}

export async function getPublicHomepageSections() {
  return (await api.get<IApiResponse<IHomepageSection[]>>("/homepage-sections"))
    .data.data;
}

export async function getCustomPageBySlug(slug: string) {
  return (
    await api.get<IApiResponse<ICustomPage>>(
      `/pages/${encodeURIComponent(slug)}`,
    )
  ).data.data;
}
