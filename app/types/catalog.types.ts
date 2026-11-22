export type ProductAttributes = Record<string, string | number | boolean>;

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  orderIndex: number;
  isFeatured: boolean;
  isActive: boolean;
  parentId: string | null;
  parent?: ICategory | null;
  children?: ICategory[];
  _count?: { products: number };
  createdAt: string;
  updatedAt: string;
}

export interface IAttribute {
  id: string;
  name: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IProductVariant {
  sku: string;
  attributes: ProductAttributes;
  price: number;
  stock: number;
}

export interface IProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice: number | null;
  sku: string | null;
  stock: number;
  thumbnail: string;
  images: string[];
  customAttributes: ProductAttributes;
  variants: IProductVariant[];
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  category?: Pick<ICategory, "id" | "name" | "slug">;
  createdAt: string;
  updatedAt: string;
}
