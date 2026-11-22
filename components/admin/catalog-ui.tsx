"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { getAdminCategories } from "@/app/services/category.service";
import { getAttributes } from "@/app/services/product.service";
import type { ICategory } from "@/app/types/catalog.types";
import { flattenTree, SelectField } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export const adminCategoriesQuery = {
  queryKey: ["admin", "categories"],
  queryFn: getAdminCategories,
};
export const attributesQuery = {
  queryKey: ["admin", "attributes"],
  queryFn: getAttributes,
};
export const productListKey = ["admin", "products"] as const;
export const productKey = (id: string) => ["admin", "product", id] as const;

export function CategorySelect({
  categories,
  emptyLabel,
  excluded,
  ...props
}: ComponentProps<"select"> & {
  categories: ICategory[];
  emptyLabel: string;
  excluded?: Set<string>;
}) {
  return (
    <SelectField {...props}>
      <option value="">{emptyLabel}</option>
      {flattenTree(categories)
        .filter(({ item }) => !excluded?.has(item.id))
        .map(({ item, depth }) => (
          <option key={item.id} value={item.id}>
            {"↳ ".repeat(depth)}
            {item.name}
            {!item.isActive ? " (Inactive)" : ""}
          </option>
        ))}
    </SelectField>
  );
}

export function CatalogImage({
  url,
  alt,
  className,
  sizes = "48px",
}: {
  url?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const valid =
    url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : null;
  return (
    <div
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {valid ? (
        <Image
          src={valid}
          alt={alt}
          fill
          sizes={sizes}
          className="object-contain"
          unoptimized={
            !valid.startsWith("/") &&
            !valid.startsWith("https://res.cloudinary.com/")
          }
        />
      ) : (
        <ImageIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function catalogSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "");
}
