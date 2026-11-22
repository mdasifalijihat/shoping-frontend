import type { JsonValue } from "./api.types";

export interface INavbarItem {
  id: string;
  title: string;
  url: string | null;
  icon: string | null;
  orderIndex: number;
  isActive: boolean;
  openInNew: boolean;
  parentId: string | null;
  parent?: INavbarItem | null;
  children?: INavbarItem[];
  createdAt: string;
  updatedAt: string;
}

export type SectionType =
  | "HERO_SLIDER"
  | "BANNER"
  | "FEATURED_CATEGORIES"
  | "PRODUCT_COLLECTION"
  | "CUSTOM_HTML";

export interface IHomepageSection {
  id: string;
  title: string;
  subtitle: string | null;
  type: SectionType;
  orderIndex: number;
  isActive: boolean;
  config: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISiteSettings {
  id: string;
  key: string;
  value: JsonValue;
  updatedAt: string;
}
