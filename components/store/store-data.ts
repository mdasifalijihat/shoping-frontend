import { getPublicCategories } from "@/app/services/category.service";
import { getAllSiteSettings } from "@/app/services/siteSetting.service";
import type { JsonObject, JsonValue } from "@/app/types/api.types";
import type {
  ICategory,
  IProduct,
  IProductVariant,
} from "@/app/types/catalog.types";
import type { CartItem } from "@/app/store/useCartStore";

export const categoriesQuery = {
  queryKey: ["store", "categories"],
  queryFn: () => getPublicCategories(),
};
export const settingsQuery = {
  queryKey: ["store", "settings"],
  queryFn: getAllSiteSettings,
};
export const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
});

export function object(value: JsonValue | undefined): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function string(value: JsonValue | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function setting(
  settings: JsonObject | undefined,
  key: string,
): JsonValue | undefined {
  return settings?.[key];
}

export function categoryTree(
  categories: ICategory[],
  depth = 0,
): { category: ICategory; depth: number }[] {
  return categories
    .filter(({ isActive }) => isActive)
    .flatMap((category) => [
      { category, depth },
      ...categoryTree(category.children ?? [], depth + 1),
    ]);
}

export function safeHref(value: string): string | undefined {
  const input = value.trim();
  if (!input || /^[\\/]{2}/.test(input) || /[\x00-\x1f\\]/.test(input))
    return undefined;
  if (input.startsWith("#")) return input;
  const url = URL.parse(input, "https://store.invalid");
  if (
    !url ||
    !["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    return undefined;
  if (URL.canParse(input)) return url.href;
  return url.pathname.startsWith("//")
    ? undefined
    : url.pathname + url.search + url.hash;
}

export function imageSrc(value: string): string | undefined {
  const src = safeHref(value);
  return src && (src.startsWith("/") || /^https?:\/\//.test(src))
    ? src
    : undefined;
}

export function variantsOf(product: IProduct) {
  return Array.isArray(product.variants)
    ? product.variants.filter(
        (variant) =>
          variant &&
          typeof variant.sku === "string" &&
          variant.sku.trim() &&
          Number.isFinite(variant.price) &&
          variant.price >= 0 &&
          Number.isInteger(variant.stock) &&
          variant.stock >= 0 &&
          variant.attributes &&
          typeof variant.attributes === "object" &&
          !Array.isArray(variant.attributes) &&
          Object.values(variant.attributes).every((value) =>
            ["string", "number", "boolean"].includes(typeof value),
          ),
      )
    : [];
}

export function makeCartItem(
  product: IProduct,
  quantity = 1,
  variant?: IProductVariant,
  thumbnail = product.thumbnail,
): CartItem {
  return {
    productId: product.id,
    title: product.title,
    slug: product.slug,
    thumbnail,
    quantity,
    unitPrice: variant?.price ?? product.discountPrice ?? product.basePrice,
    maxStock: variant?.stock ?? product.stock,
    selectedVariant: variant
      ? { sku: variant.sku, attributes: variant.attributes }
      : null,
  };
}
