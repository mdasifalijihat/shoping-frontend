"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  getPublicProducts,
  type PublicProductParams,
} from "@/app/services/product.service";
import type { ICategory } from "@/app/types/catalog.types";
import { ProductGrid } from "@/components/store/ProductCard";
import { categoriesQuery, categoryTree } from "@/components/store/store-data";
import { StoreError, StoreLoading } from "@/components/store/store-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function amount(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export function ProductCatalog({
  scopedCategory,
}: {
  scopedCategory?: { slug: string; name: string };
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const categories = useQuery(categoriesQuery);
  const sort =
    params.get("sort") === "price-asc"
      ? "price-asc"
      : params.get("sort") === "price-desc"
        ? "price-desc"
        : "newest";
  const page = Math.min(
    10_000_000,
    Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1),
  );
  const searchTerm = params.get("searchTerm")?.trim() || "";
  const minPrice = amount(params.get("minPrice"));
  const rawMax = amount(params.get("maxPrice"));
  const maxPrice =
    minPrice !== undefined && rawMax !== undefined && rawMax < minPrice
      ? undefined
      : rawMax;
  const categorySlug =
    scopedCategory?.slug || params.get("categorySlug")?.trim() || "";
  const inStock = params.get("inStock") === "true";
  const isFeatured = params.get("isFeatured") === "true";
  const queryParams: PublicProductParams = {
    page,
    limit: PAGE_SIZE,
    categorySlug: categorySlug || undefined,
    minPrice,
    maxPrice,
    inStock: inStock || undefined,
    searchTerm: searchTerm || undefined,
    isFeatured: isFeatured || undefined,
    sortBy: sort === "newest" ? "createdAt" : "basePrice",
    sortOrder: sort === "price-asc" ? "asc" : "desc",
  };
  const products = useQuery({
    queryKey: ["store", "products", queryParams],
    queryFn: () => getPublicProducts(queryParams),
  });
  const tree = categoryTree(categories.data ?? []);
  const meta = products.data?.meta;
  const pageHref = (to: number) => {
    const next = new URLSearchParams(params.toString());
    if (to === 1) next.delete("page");
    else next.set("page", String(to));
    return next.size ? `${pathname}?${next}` : pathname;
  };

  function apply(next: URLSearchParams) {
    if (isFeatured) next.set("isFeatured", "true");
    router.push(next.size ? `${pathname}?${next}` : pathname);
    setOpen(false);
  }

  const fields = {
    categories: categories.data ?? [],
    categorySlug,
    searchTerm,
    minPrice,
    maxPrice,
    sort,
    inStock,
    showCategories: !scopedCategory,
    action: apply,
  };
  const key = params.toString() + (scopedCategory?.slug ?? "");
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden rounded-2xl border bg-card p-4 lg:block">
        <h2 className="mb-4 text-lg font-semibold">Filters</h2>
        {categories.error && !scopedCategory && (
          <div className="mb-4">
            <StoreError
              message="Categories unavailable."
              retry={() => void categories.refetch()}
            />
          </div>
        )}
        <FilterForm key={key} {...fields} />
      </aside>
      <section className="min-w-0 space-y-4" aria-label="Product results">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            aria-live="polite"
            className="min-w-0 text-sm text-muted-foreground"
          >
            {meta && (
              <p>
                {meta.total} {meta.total === 1 ? "product" : "products"}
                {searchTerm ? (
                  <>
                    {" "}
                    for{" "}
                    <strong className="break-all text-foreground">
                      “{searchTerm}”
                    </strong>
                  </>
                ) : null}
              </p>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="outline" className="lg:hidden" />}
            >
              <SlidersHorizontal /> Filters
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-5">
                {categories.error && !scopedCategory && (
                  <div className="mb-4">
                    <StoreError
                      message="Categories unavailable."
                      retry={() => void categories.refetch()}
                    />
                  </div>
                )}
                <FilterForm key={key} {...fields} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {products.isPending && <StoreLoading />}
        {products.error && (
          <StoreError
            message="Products are unavailable."
            retry={() => void products.refetch()}
          />
        )}
        {products.data?.data.length ? (
          <ProductGrid
            products={products.data.data}
            categoryNames={
              new Map(tree.map(({ category }) => [category.id, category.name]))
            }
          />
        ) : (
          products.data && (
            <div className="rounded-xl border bg-card p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                No products match these filters.
              </p>
              <Link
                href={pathname}
                className={buttonVariants({ variant: "outline" })}
              >
                Clear filters
              </Link>
            </div>
          )
        )}
        {meta && meta.totalPage > 1 && (
          <nav
            aria-label="Product pages"
            className="flex flex-wrap items-center justify-center gap-3 border-t py-4 text-sm"
          >
            {page > 1 && (
              <Link
                href={pageHref(Math.min(page - 1, meta.totalPage))}
                className={buttonVariants({ variant: "outline" })}
              >
                <ChevronLeft /> Previous
              </Link>
            )}
            <span>
              Page {page} of {meta.totalPage}
            </span>
            {page < meta.totalPage && (
              <Link
                href={pageHref(page + 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                Next <ChevronRight />
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}

function FilterForm({
  categories,
  categorySlug,
  searchTerm,
  minPrice,
  maxPrice,
  sort,
  inStock,
  showCategories,
  action,
}: {
  categories: ICategory[];
  categorySlug: string;
  searchTerm: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  inStock: boolean;
  showCategories: boolean;
  action: (next: URLSearchParams) => void;
}) {
  const id = useId();
  const tree = categoryTree(categories);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [field, value] of new FormData(event.currentTarget)) {
      if (
        typeof value === "string" &&
        value.trim() &&
        (field !== "sort" || value !== "newest")
      )
        next.set(field, value.trim());
    }
    const min = amount(next.get("minPrice"));
    const max = amount(next.get("maxPrice"));
    if (min !== undefined && max !== undefined && max < min) {
      toast.error("Maximum price must be at least the minimum price.");
      return;
    }
    action(next);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-search`}>Search catalog</Label>
        <Input
          id={`${id}-search`}
          name="searchTerm"
          type="search"
          defaultValue={searchTerm}
        />
      </div>
      {showCategories && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Categories</legend>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
            <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted">
              <input
                className="accent-emerald-900"
                type="radio"
                name="categorySlug"
                value=""
                defaultChecked={!categorySlug}
              />
              <span className="text-sm">All categories</span>
            </label>
            {categorySlug &&
              !tree.some(({ category }) => category.slug === categorySlug) && (
                <label className="flex cursor-pointer items-center gap-2 px-1 py-1">
                  <input
                    type="radio"
                    name="categorySlug"
                    value={categorySlug}
                    defaultChecked
                  />
                  <span className="break-all text-sm">{categorySlug}</span>
                </label>
              )}
            {tree.map(({ category, depth }) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted"
                style={{ paddingInlineStart: 4 + Math.min(6, depth) * 10 }}
              >
                <input
                  className="shrink-0 accent-emerald-900"
                  type="radio"
                  name="categorySlug"
                  value={category.slug}
                  defaultChecked={categorySlug === category.slug}
                />
                <span className="break-words text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-medium">Price (BDT)</legend>
        <div className="min-w-0">
          <Label htmlFor={`${id}-min`} className="mb-1 text-xs">
            Min price
          </Label>
          <Input
            id={`${id}-min`}
            name="minPrice"
            type="number"
            step="any"
            min="0"
            defaultValue={minPrice}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor={`${id}-max`} className="mb-1 text-xs">
            Max price
          </Label>
          <Input
            id={`${id}-max`}
            name="maxPrice"
            type="number"
            step="any"
            min="0"
            defaultValue={maxPrice}
          />
        </div>
      </fieldset>
      <label className="flex w-fit items-center gap-2 text-sm">
        <input
          className="size-4 accent-emerald-900"
          name="inStock"
          value="true"
          type="checkbox"
          defaultChecked={inStock}
        />{" "}
        In stock only
      </label>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-sort`}>Sort by</Label>
        <select
          id={`${id}-sort`}
          name="sort"
          defaultValue={sort}
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
      <Button
        type="submit"
        className={cn("w-full bg-emerald-950 text-white hover:bg-emerald-900")}
      >
        Apply filters
      </Button>
    </form>
  );
}
